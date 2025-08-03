import { Router } from 'express';
import { authenticate, adminOrSeller, adminOnly } from '@/middleware/auth';
import { SalesController } from '@/controllers/salesController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sales viewing and analytics (all authenticated users)
router.get('/', SalesController.getSales);
router.get('/analytics', SalesController.getAnalytics);
router.get('/recent', SalesController.getRecentTransactions);
router.get('/daily-summary', SalesController.getDailySummary);
router.get('/products/:productId', SalesController.getSalesByProduct);
router.get('/seller-performance', SalesController.getSellerPerformance);
router.get('/transaction/:batchId', SalesController.getTransaction);
router.get('/receipt/:batchId', SalesController.generateReceipt);
router.get('/:id', SalesController.getSale);

// Sales creation (admin/seller only)
router.post('/', adminOrSeller, SalesController.createSale);

// Sales modification (admin only for refunds/status changes)
router.patch('/:id/status', adminOnly, SalesController.updateSaleStatus);

export { router as salesRouter };