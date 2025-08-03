import { Router } from 'express';
import { authenticate, adminOrSeller } from '@/middleware/auth';
import { ProductsController } from '@/controllers/productsController';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Public product routes (authenticated users can view)
router.get('/', ProductsController.getProducts);
router.get('/categories', ProductsController.getCategories);
router.get('/low-stock', ProductsController.getLowStock);
router.get('/best-sellers', ProductsController.getBestSellers);
router.get('/:id', ProductsController.getProduct);

// Admin/Seller only routes
router.post('/', adminOrSeller, ProductsController.createProduct);
router.put('/:id', adminOrSeller, ProductsController.updateProduct);
router.delete('/:id', adminOrSeller, ProductsController.deleteProduct);
router.post('/:id/image', adminOrSeller, ProductsController.uploadImage);
router.patch('/:id/stock', adminOrSeller, ProductsController.updateStock);

export { router as productsRouter };