import { PrismaClient, Sale, Prisma } from '@prisma/client';
import { createNotFoundError, createValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { ProductService } from './productService';

const prisma = new PrismaClient();

export interface SaleCreateData {
  items: Array<{
    productId: string;
    quantity: number;
    unitSalePrice: number;
  }>;
  customerId?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface SaleSearchParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  sellerId?: string;
  paymentStatus?: string;
  posBatch?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SaleWithDetails extends Sale {
  product: {
    id: string;
    name: string;
    category: string;
    imageLink?: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface SalesTransaction {
  posBatch: string;
  totalAmount: number;
  itemCount: number;
  saleDate: Date;
  paymentStatus: string;
  paymentMethod?: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
  };
  sellerId: string;
  seller: {
    id: string;
    name: string;
    username: string;
  };
  items: SaleWithDetails[];
}

export class SalesService {
  static async findMany(params: SaleSearchParams) {
    const {
      startDate,
      endDate,
      customerId,
      sellerId,
      paymentStatus,
      posBatch,
      page = 1,
      limit = 20,
      sortBy = 'saleDate',
      sortOrder = 'desc'
    } = params;

    // Build where clause
    const where: Prisma.SaleWhereInput = {
      ...(startDate && { saleDate: { gte: new Date(startDate) } }),
      ...(endDate && { saleDate: { lte: new Date(endDate) } }),
      ...(customerId && { customerId }),
      ...(sellerId && { sellerId }),
      ...(paymentStatus && { paymentStatus: paymentStatus as any }),
      ...(posBatch && { posBatch })
    };

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              imageLink: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      }),
      prisma.sale.count({ where })
    ]);

    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id: string): Promise<SaleWithDetails> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            imageLink: true,
            salePrice: true,
            cost: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            creditBalance: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    if (!sale) {
      throw createNotFoundError('Sale not found');
    }

    return sale as SaleWithDetails;
  }

  static async createTransaction(
    data: SaleCreateData, 
    sellerId: string
  ): Promise<SalesTransaction> {
    // Generate unique batch ID for this transaction
    const posBatch = `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return await prisma.$transaction(async (tx) => {
      const createdSales: SaleWithDetails[] = [];
      let totalAmount = 0;

      // Validate and create each sale item
      for (const item of data.items) {
        // Verify product exists and has sufficient stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            category: true,
            imageLink: true,
            stock: true,
            salePrice: true,
            isActive: true
          }
        });

        if (!product) {
          throw createNotFoundError(`Product with ID ${item.productId} not found`);
        }

        if (!product.isActive) {
          throw createValidationError(`Product ${product.name} is not available for sale`);
        }

        if (product.stock < item.quantity) {
          throw createValidationError(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        // Calculate item total
        const itemTotal = item.quantity * item.unitSalePrice;
        totalAmount += itemTotal;

        // Create sale record
        const sale = await tx.sale.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            unitSalePrice: item.unitSalePrice,
            totalAmount: itemTotal,
            sellerId,
            customerId: data.customerId || null,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            posBatch,
            saleDate: new Date(),
            paymentStatus: 'PAID'
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                imageLink: true
              }
            },
            customer: {
              select: {
                id: true,
                name: true
              }
            },
            seller: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        createdSales.push(sale as SaleWithDetails);
      }

      // Update customer credit if applicable
      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId }
        });

        if (customer && customer.creditBalance > 0) {
          const creditUsed = Math.min(customer.creditBalance, totalAmount);
          if (creditUsed > 0) {
            await tx.customer.update({
              where: { id: data.customerId },
              data: {
                creditBalance: {
                  decrement: creditUsed
                }
              }
            });
          }
        }
      }

      // Get seller info
      const seller = await tx.user.findUnique({
        where: { id: sellerId },
        select: {
          id: true,
          name: true,
          username: true
        }
      });

      if (!seller) {
        throw createNotFoundError('Seller not found');
      }

      // Get customer info if provided
      let customer = null;
      if (data.customerId) {
        customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: {
            id: true,
            name: true
          }
        });
      }

      const transaction: SalesTransaction = {
        posBatch,
        totalAmount,
        itemCount: data.items.length,
        saleDate: new Date(),
        paymentStatus: 'PAID',
        paymentMethod: data.paymentMethod,
        customerId: data.customerId,
        customer,
        sellerId,
        seller,
        items: createdSales
      };

      logger.info('Sales transaction completed', {
        posBatch,
        totalAmount,
        itemCount: data.items.length,
        sellerId,
        customerId: data.customerId
      });

      return transaction;
    });
  }

  static async updateStatus(id: string, status: 'PAID' | 'NOT_PAID' | 'REFUNDED', notes?: string): Promise<Sale> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        product: {
          select: { name: true }
        }
      }
    });

    if (!sale) {
      throw createNotFoundError('Sale not found');
    }

    // Handle stock restoration for refunds
    if (status === 'REFUNDED' && sale.paymentStatus !== 'REFUNDED') {
      await prisma.product.update({
        where: { id: sale.productId },
        data: {
          stock: {
            increment: sale.quantity
          }
        }
      });

      logger.info('Stock restored due to refund', {
        saleId: id,
        productName: sale.product.name,
        quantity: sale.quantity
      });
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        paymentStatus: status,
        notes: notes ? `${sale.notes || ''}\n${notes}`.trim() : sale.notes
      }
    });

    logger.info('Sale status updated', {
      saleId: id,
      oldStatus: sale.paymentStatus,
      newStatus: status
    });

    return updatedSale;
  }

  static async getTransactionsByBatch(posBatch: string): Promise<SalesTransaction> {
    const sales = await prisma.sale.findMany({
      where: { posBatch },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            imageLink: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!sales.length) {
      throw createNotFoundError('Transaction not found');
    }

    const firstSale = sales[0];
    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    return {
      posBatch,
      totalAmount,
      itemCount: sales.length,
      saleDate: firstSale.saleDate,
      paymentStatus: firstSale.paymentStatus,
      paymentMethod: firstSale.paymentMethod,
      customerId: firstSale.customerId,
      customer: firstSale.customer,
      sellerId: firstSale.sellerId!,
      seller: firstSale.seller!,
      items: sales as SaleWithDetails[]
    };
  }

  static async getSalesAnalytics(startDate?: Date, endDate?: Date) {
    const where: Prisma.SaleWhereInput = {
      ...(startDate && { saleDate: { gte: startDate } }),
      ...(endDate && { saleDate: { lte: endDate } })
    };

    const [
      totalSales,
      totalRevenue,
      totalQuantity,
      avgOrderValue,
      topProducts,
      salesByDateRaw
    ] = await Promise.all([
      // Total sales count
      prisma.sale.count({ where }),
      
      // Total revenue
      prisma.sale.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      
      // Total quantity sold
      prisma.sale.aggregate({
        where,
        _sum: { quantity: true }
      }),
      
      // Average order value
      prisma.sale.aggregate({
        where,
        _avg: { totalAmount: true }
      }),
      
      // Top selling products
      prisma.sale.groupBy({
        by: ['productId'],
        where,
        _sum: {
          quantity: true,
          totalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      }),
      
      // Sales by date
      prisma.$queryRaw`
        SELECT 
          DATE(sale_date) as date,
          COUNT(*) as transaction_count,
          SUM(total_amount) as revenue,
          SUM(quantity) as quantity_sold
        FROM sales 
        WHERE sale_date >= ${startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
          AND sale_date <= ${endDate || new Date()}
        GROUP BY DATE(sale_date)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Convert BigInt values from raw query to regular numbers
    const salesByDate = (salesByDateRaw as any[]).map(row => ({
      date: row.date,
      transaction_count: Number(row.transaction_count),
      revenue: Number(row.revenue),
      quantity_sold: Number(row.quantity_sold)
    }));

    // Enrich top products with product details and convert BigInt values
    const productIds = topProducts.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true }
    });

    const enrichedTopProducts = topProducts.map(tp => {
      const product = productDetails.find(p => p.id === tp.productId);
      return {
        productId: tp.productId,
        quantity: Number(tp._sum.quantity || 0),
        totalAmount: Number(tp._sum.totalAmount || 0),
        transactionCount: Number(tp._count.id || 0),
        product
      };
    });

    return {
      summary: {
        totalSales,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        totalQuantity: Number(totalQuantity._sum.quantity || 0),
        avgOrderValue: Number(avgOrderValue._avg.totalAmount || 0)
      },
      topProducts: enrichedTopProducts,
      salesByDate
    };
  }

  static async getRecentTransactions(limit: number = 10): Promise<SalesTransaction[]> {
    const recentBatches = await prisma.sale.findMany({
      select: { posBatch: true },
      where: { posBatch: { not: null } },
      distinct: ['posBatch'],
      orderBy: { saleDate: 'desc' },
      take: limit
    });

    const transactions: SalesTransaction[] = [];
    
    for (const batch of recentBatches) {
      if (batch.posBatch) {
        try {
          const transaction = await this.getTransactionsByBatch(batch.posBatch);
          transactions.push(transaction);
        } catch (error) {
          // Skip invalid transactions
          continue;
        }
      }
    }

    return transactions;
  }
}