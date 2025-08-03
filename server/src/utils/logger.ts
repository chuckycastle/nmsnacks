import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return log;
  })
);

// File format (JSON for structured logging)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: { service: 'nmsnacks-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? fileFormat : consoleFormat,
    }),
    
    // File transports for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
});

// Helper functions for structured logging
export const logRequest = (req: any, res: any, duration: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};