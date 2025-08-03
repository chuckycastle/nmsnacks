import { Request, Response } from 'express';
import { ProductService } from '@/services/productService';
import { validateRequest, productCreateSchema, productUpdateSchema, productSearchSchema, paginationSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

// Secure file upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

export class ProductsController {
  // Get all products with filtering and pagination
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = validateRequest(productSearchSchema.merge(paginationSchema))(req.query);
    
    const result = await ProductService.findMany(searchParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get single product by ID
  static getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const product = await ProductService.findById(id);

    res.json({
      success: true,
      data: product
    });
  });

  // Create new product
  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = validateRequest(productCreateSchema)(req.body);
    
    const product = await ProductService.create(productData);

    logger.info('Product created via API', {
      productId: product.id,
      userId: req.user?.id,
      username: req.user?.username
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  });

  // Update product
  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = validateRequest(productUpdateSchema)(req.body);
    
    const product = await ProductService.update(id, updateData);

    logger.info('Product updated via API', {
      productId: id,
      userId: req.user?.id,
      username: req.user?.username,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  });

  // Delete product
  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await ProductService.delete(id);

    logger.info('Product deleted via API', {
      productId: id,
      userId: req.user?.id,
      username: req.user?.username
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  // Upload product image
  static uploadImage = [
    upload.single('image'),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      // Validate file content (magic bytes check)
      const fileSignature = req.file.buffer.slice(0, 4).toString('hex');
      const validSignatures = {
        'ffd8ffe0': 'jpg',
        'ffd8ffe1': 'jpg', 
        'ffd8ffe2': 'jpg',
        '89504e47': 'png',
        '47494638': 'gif',
        '52494646': 'webp'
      };

      const detectedType = validSignatures[fileSignature.substring(0, 8) as keyof typeof validSignatures];
      if (!detectedType) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image file format'
        });
      }

      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate secure filename
        const fileHash = createHash('sha256').update(req.file.buffer).digest('hex').substring(0, 16);
        const timestamp = Date.now();
        const filename = `${id}_${timestamp}_${fileHash}.webp`;
        const filepath = path.join(uploadsDir, filename);

        // Process and optimize image with Sharp
        await sharp(req.file.buffer)
          .resize(800, 600, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ 
            quality: 85,
            effort: 4 
          })
          .toFile(filepath);

        // Update product with image URL
        const imageUrl = `/uploads/products/${filename}`;
        const product = await ProductService.update(id, { imageLink: imageUrl });

        logger.info('Product image uploaded', {
          productId: id,
          filename,
          userId: req.user?.id,
          originalSize: req.file.size,
          processedPath: filepath
        });

        res.json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            imageUrl,
            product
          }
        });

      } catch (error) {
        logger.error('Image upload failed', {
          productId: id,
          userId: req.user?.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(500).json({
          success: false,
          error: 'Failed to process and save image'
        });
      }
    })
  ];

  // Update stock
  static updateStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    if (!quantity || !operation || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Provide quantity and operation (add/subtract)'
      });
    }

    const product = await ProductService.updateStock(id, parseInt(quantity), operation);

    logger.info('Product stock updated via API', {
      productId: id,
      operation,
      quantity: parseInt(quantity),
      newStock: product.stock,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`,
      data: product
    });
  });

  // Get product categories
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await ProductService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  });

  // Get low stock products
  static getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
    
    const products = await ProductService.getLowStockProducts(threshold);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  });

  // Get best selling products
  static getBestSellers = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const products = await ProductService.getBestSellers(limit);

    res.json({
      success: true,
      data: products
    });
  });
}