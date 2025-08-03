import { Router } from 'express';
import { authenticate, adminOrSeller } from '@/middleware/auth';
import { CustomersController } from '@/controllers/customersController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer viewing (all authenticated users)
router.get('/', CustomersController.getCustomers);
router.get('/search', CustomersController.searchCustomers);
router.get('/top-customers', CustomersController.getTopCustomers);
router.get('/with-credit', CustomersController.getCustomersWithCredit);
router.get('/:id', CustomersController.getCustomer);

// Customer management (admin/seller only)
router.post('/', adminOrSeller, CustomersController.createCustomer);
router.put('/:id', adminOrSeller, CustomersController.updateCustomer);
router.delete('/:id', adminOrSeller, CustomersController.deleteCustomer);
router.patch('/:id/credit', adminOrSeller, CustomersController.updateCredit);

export { router as customersRouter };