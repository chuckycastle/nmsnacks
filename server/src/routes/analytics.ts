import { Router } from 'express';
import { authenticate, adminOrSeller } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', adminOrSeller, (req, res) => {
  res.json({ success: true, message: 'Dashboard analytics - to be implemented', data: {} });
});

router.get('/sales', adminOrSeller, (req, res) => {
  res.json({ success: true, message: 'Sales analytics - to be implemented', data: {} });
});

export { router as analyticsRouter };