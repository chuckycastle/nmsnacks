import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Public routes
router.post('/login', asyncHandler(AuthController.login));
router.post('/refresh', asyncHandler(AuthController.refreshToken));

// Protected routes
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.get('/profile', authenticate, asyncHandler(AuthController.getProfile));
router.post('/change-password', authenticate, asyncHandler(AuthController.changePassword));
router.get('/validate', authenticate, asyncHandler(AuthController.validateToken));

export { router as authRouter };