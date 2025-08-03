import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';

import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { authRouter } from '@/routes/auth';
import { productsRouter } from '@/routes/products';
import { salesRouter } from '@/routes/sales';
import { customersRouter } from '@/routes/customers';
import { usersRouter } from '@/routes/users';
import { rafflesRouter } from '@/routes/raffles';
import { analyticsRouter } from '@/routes/analytics';
import { healthRouter } from '@/routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(requestLogger);
}

// Health check endpoint (before auth)
app.use('/health', healthRouter);

// API routes
const apiPrefix = `/api/${API_VERSION}`;

app.use(`${apiPrefix}/auth`, authRouter);
app.use(`${apiPrefix}/products`, productsRouter);
app.use(`${apiPrefix}/sales`, salesRouter);
app.use(`${apiPrefix}/customers`, customersRouter);
app.use(`${apiPrefix}/users`, usersRouter);
app.use(`${apiPrefix}/raffles`, rafflesRouter);
app.use(`${apiPrefix}/analytics`, analyticsRouter);

// Serve uploaded files (with security headers)
app.use('/uploads', express.static('uploads', {
  maxAge: '1h',
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 API available at http://localhost:${PORT}${apiPrefix}`);
  logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

export default app;