import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  hashPassword, 
  verifyPassword, 
  generateTokens, 
  verifyRefreshToken,
  recordLoginAttempt,
  isLoginRateLimited,
  clearLoginAttempts,
  isPasswordStrong
} from '@/utils/auth';
import { validateRequest, loginSchema, refreshTokenSchema, passwordChangeSchema } from '@/utils/validation';
import { logger, logSecurityEvent } from '@/utils/logger';
import { createValidationError, createUnauthorizedError, createTooManyRequestsError } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

export class AuthController {
  // User login
  static async login(req: Request, res: Response): Promise<void> {
    const { username, password } = validateRequest(loginSchema)(req.body);
    const clientIp = req.ip;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Check rate limiting
    const identifier = `${username}:${clientIp}`;
    if (isLoginRateLimited(identifier)) {
      logSecurityEvent('Login rate limit exceeded', {
        username,
        ip: clientIp,
        userAgent
      });

      throw createTooManyRequestsError('Too many login attempts. Please try again later.');
    }

    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username }
          ],
          isActive: true
        }
      });

      if (!user) {
        recordLoginAttempt(identifier);
        logSecurityEvent('Login failed - user not found', {
          username,
          ip: clientIp,
          userAgent
        });

        throw createUnauthorizedError('Invalid username or password');
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        recordLoginAttempt(identifier);
        logSecurityEvent('Login failed - invalid password', {
          userId: user.id,
          username: user.username,
          ip: clientIp,
          userAgent
        });

        throw createUnauthorizedError('Invalid username or password');
      }

      // Clear login attempts on successful login
      clearLoginAttempts(identifier);

      // Generate tokens
      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        role: user.role
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
        ip: clientIp
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid username or password')) {
        throw error;
      }
      
      logger.error('Login error', {
        username,
        ip: clientIp,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new Error('Login failed. Please try again.');
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = validateRequest(refreshTokenSchema)(req.body);

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId, isActive: true }
      });

      if (!user) {
        logSecurityEvent('Refresh token failed - user not found', {
          userId: decoded.userId,
          ip: req.ip
        });
        throw createUnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        role: user.role
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      logSecurityEvent('Refresh token failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip
      });
      throw createUnauthorizedError('Invalid or expired refresh token');
    }
  }

  // User logout
  static async logout(req: Request, res: Response): Promise<void> {
    // In a production system, you might want to maintain a blacklist of tokens
    // For now, we'll just return success (client should discard tokens)
    
    logger.info('User logged out', {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw createUnauthorizedError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createUnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: { user }
    });
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw createUnauthorizedError('User not authenticated');
    }

    const { currentPassword, newPassword } = validateRequest(passwordChangeSchema)(req.body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw createUnauthorizedError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logSecurityEvent('Password change failed - invalid current password', {
        userId: user.id,
        username: user.username,
        ip: req.ip
      });
      throw createUnauthorizedError('Current password is incorrect');
    }

    // Check new password strength
    const passwordCheck = isPasswordStrong(newPassword);
    if (!passwordCheck.isStrong) {
      throw createValidationError(`Password requirements not met: ${passwordCheck.issues.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    logger.info('Password changed successfully', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }

  // Validate token (for client-side validation)
  static async validateToken(req: Request, res: Response): Promise<void> {
    // If we reach here, the token is valid (auth middleware passed)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  }
}