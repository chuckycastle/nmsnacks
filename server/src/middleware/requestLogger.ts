import { Request, Response, NextFunction } from 'express';
import { logRequest } from '@/utils/logger';
import { performance } from 'perf_hooks';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now();
  
  // Add request ID for tracing
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    require('crypto').randomBytes(16).toString('hex');

  // Log request completion
  res.on('finish', () => {
    const duration = Math.round(performance.now() - startTime);
    logRequest(req, res, duration);
  });

  next();
};