import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger, logSecurityEvent } from './logger';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be configured');
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT token generation
export const generateTokens = (user: { id: string; username: string; role: string }): TokenPair => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// JWT token verification
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logSecurityEvent('Invalid access token', { token: token.substring(0, 20) + '...' });
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logSecurityEvent('Invalid refresh token', { token: token.substring(0, 20) + '...' });
    throw new Error('Invalid or expired refresh token');
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

// Generate secure random string
export const generateSecureToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Check password strength
export const isPasswordStrong = (password: string): { isStrong: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    issues.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isStrong: issues.length === 0,
    issues
  };
};

// Rate limiting helpers
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const recordLoginAttempt = (identifier: string): void => {
  const now = new Date();
  const attempts = loginAttempts.get(identifier);
  
  if (attempts) {
    // Reset counter if last attempt was more than 15 minutes ago
    if (now.getTime() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
      loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    } else {
      loginAttempts.set(identifier, { count: attempts.count + 1, lastAttempt: now });
    }
  } else {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
  }
};

export const isLoginRateLimited = (identifier: string): boolean => {
  const attempts = loginAttempts.get(identifier);
  if (!attempts) return false;
  
  // Block after 5 failed attempts within 15 minutes
  return attempts.count >= 5 && 
         new Date().getTime() - attempts.lastAttempt.getTime() < 15 * 60 * 1000;
};

export const clearLoginAttempts = (identifier: string): void => {
  loginAttempts.delete(identifier);
};

// Cleanup old login attempts (run periodically)
export const cleanupLoginAttempts = (): void => {
  const now = new Date();
  const fifteenMinutesAgo = now.getTime() - 15 * 60 * 1000;
  
  for (const [identifier, attempts] of loginAttempts.entries()) {
    if (attempts.lastAttempt.getTime() < fifteenMinutesAgo) {
      loginAttempts.delete(identifier);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);