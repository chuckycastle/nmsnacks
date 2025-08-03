import { PrismaClient, Product, Prisma } from '@prisma/client';
import { createNotFoundError, createValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductWithStock extends Product {
  availableStock?: number;
  totalSold?: number;
  lowStockAlert?: boolean;
}

export class ProductService {
  static async findMany(params: ProductSearchParams) {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } }
        ]
      }),
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(minPrice !== undefined && { salePrice: { gte: minPrice } }),
      ...(maxPrice !== undefined && { salePrice: { lte: maxPrice } }),
      ...(inStock && { stock: { gt: 0 } }),
      ...(lowStock && { 
        OR: [
          { stock: { lte: prisma.product.fields.minStock } },
          { stock: { lte: 10 } } // Default low stock threshold
        ]
      })
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with aggregations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sales: {
            select: {
              quantity: true,
              saleDate: true
            }
          },
          _count: {
            select: {
              sales: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Enhance products with computed fields
    const enhancedProducts: ProductWithStock[] = products.map(product => {
      const totalSold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
      const availableStock = Math.max(0, product.stock - totalSold);
      const lowStockAlert = availableStock <= product.minStock;

      return {
        ...product,
        sales: undefined, // Remove sales data from response
        totalSold,
        availableStock,
        lowStockAlert
      };
    });

    return {
      data: enhancedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id: string): Promise<ProductWithStock> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            quantity: true,
            saleDate: true,
            unitSalePrice: true
          }
        },
        replenishments: {
          select: {
            quantity: true,
            replenishmentDate: true,
            totalCost: true
          },
          orderBy: { replenishmentDate: 'desc' },
          take: 5
        },
        _count: {
          select: {
            sales: true,
            replenishments: true
          }
        }
      }
    });

    if (!product) {
      throw createNotFoundError('Product not found');
    }

    const totalSold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const availableStock = Math.max(0, product.stock - totalSold);
    const lowStockAlert = availableStock <= product.minStock;

    return {
      ...product,
      totalSold,
      availableStock,
      lowStockAlert
    };
  }

  static async create(data: Prisma.ProductCreateInput): Promise<Product> {
    // Validate unique constraints
    if (data.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku }
      });
      if (existingSku) {
        throw createValidationError('Product with this SKU already exists');
      }
    }

    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: data.barcode }
      });
      if (existingBarcode) {
        throw createValidationError('Product with this barcode already exists');
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        category: data.category || 'General'
      }
    });

    logger.info('Product created', {
      productId: product.id,
      name: product.name,
      category: product.category
    });

    return product;
  }

  static async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw createNotFoundError('Product not found');
    }

    // Validate unique constraints for updates
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { 
          sku: data.sku as string,
          id: { not: id }
        }
      });
      if (existingSku) {
        throw createValidationError('Product with this SKU already exists');
      }
    }

    if (data.barcode && data.barcode !== existingProduct.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { 
          barcode: data.barcode as string,
          id: { not: id }
        }
      });
      if (existingBarcode) {
        throw createValidationError('Product with this barcode already exists');
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data
    });

    logger.info('Product updated', {
      productId: product.id,
      name: product.name,
      changes: Object.keys(data)
    });

    return product;
  }

  static async delete(id: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            replenishments: true
          }
        }
      }
    });

    if (!product) {
      throw createNotFoundError('Product not found');
    }

    // Check if product has sales or replenishments
    if (product._count.sales > 0 || product._count.replenishments > 0) {
      // Soft delete - mark as inactive
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info('Product soft deleted (has transaction history)', {
        productId: id,
        name: product.name,
        salesCount: product._count.sales,
        replenishmentsCount: product._count.replenishments
      });
    } else {
      // Hard delete - no transaction history
      await prisma.product.delete({
        where: { id }
      });

      logger.info('Product hard deleted', {
        productId: id,
        name: product.name
      });
    }
  }

  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw createNotFoundError('Product not found');
    }

    const newStock = operation === 'add' 
      ? product.stock + quantity 
      : product.stock - quantity;

    if (newStock < 0) {
      throw createValidationError('Insufficient stock available');
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: newStock }
    });

    logger.info('Product stock updated', {
      productId: id,
      name: product.name,
      operation,
      quantity,
      oldStock: product.stock,
      newStock
    });

    return updatedProduct;
  }

  static async getCategories(): Promise<string[]> {
    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    return categories
      .map(p => p.category)
      .filter(Boolean)
      .sort();
  }

  static async getLowStockProducts(threshold?: number): Promise<ProductWithStock[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: threshold || 10
        }
      },
      include: {
        sales: {
          select: { quantity: true }
        }
      },
      orderBy: { stock: 'asc' }
    });

    return products.map(product => {
      const totalSold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
      const availableStock = Math.max(0, product.stock - totalSold);

      return {
        ...product,
        sales: undefined,
        totalSold,
        availableStock,
        lowStockAlert: true
      };
    });
  }

  static async getBestSellers(limit: number = 10): Promise<any[]> {
    const bestSellers = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        sales: {
          select: {
            quantity: true,
            unitSalePrice: true,
            saleDate: true
          }
        }
      }
    });

    return bestSellers
      .map(product => {
        const totalQuantitySold = product.sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = product.sales.reduce((sum, sale) => 
          sum + (sale.quantity * Number(sale.unitSalePrice)), 0
        );

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          totalQuantitySold,
          totalRevenue,
          averagePrice: totalQuantitySold > 0 ? totalRevenue / totalQuantitySold : 0,
          salesCount: product.sales.length
        };
      })
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, limit);
  }
}