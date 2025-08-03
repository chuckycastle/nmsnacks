import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/auth';
import { logger, logSecurityEvent } from '@/utils/logger';

const prisma = new PrismaClient();

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        name: string;
        email: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
    }

    // Verify and decode token
    const decoded = verifyAccessToken(token);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
      }
    });

    if (!user || !user.isActive) {
      logSecurityEvent('Authentication failed - user not found or inactive', {
        userId: decoded.userId,
        username: decoded.username,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'User account not found or inactive'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    logSecurityEvent('Authentication failed - invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid or expired authentication token'
    });
  }
};

// Authorization middleware factory
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Insufficient permissions to access this resource'
      });
    }

    next();
  };
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        }
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    logger.warn('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    next();
  }
};

// Admin-only middleware
export const adminOnly = authorize('ADMIN');

// Admin or Seller middleware
export const adminOrSeller = authorize('ADMIN', 'SELLER');

// Resource ownership check (for users managing their own data)
export const requireOwnershipOrAdmin = (resourceUserIdParam: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.params[resourceUserIdParam];
    
    // Admin can access any resource, users can only access their own
    if (req.user.role === 'ADMIN' || req.user.id === resourceUserId) {
      next();
    } else {
      logSecurityEvent('Unauthorized resource access attempt', {
        userId: req.user.id,
        username: req.user.username,
        attemptedResourceUserId: resourceUserId,
        endpoint: req.originalUrl,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }
  };
};

// Update last login time
export const updateLastLogin = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      // Don't fail the request if we can't update last login
      logger.warn('Failed to update last login time', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  next();
};