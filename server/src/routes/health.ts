import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {
      database: 'unknown',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      }
    }
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = 'connected';
  } catch (error) {
    healthCheck.services.database = 'disconnected';
    healthCheck.status = 'ERROR';
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

export { router as healthRouter };