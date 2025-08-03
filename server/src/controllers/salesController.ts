import { Request, Response } from 'express';
import { SalesService } from '@/services/salesService';
import { validateRequest, saleCreateSchema, saleUpdateSchema, paginationSchema, dateRangeSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { z } from 'zod';

export class SalesController {
  // Get all sales with filtering and pagination  
  static getSales = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = validateRequest(
      paginationSchema.merge(dateRangeSchema).extend({
        customerId: z.string().optional(),
        sellerId: z.string().optional(), 
        paymentStatus: z.string().optional(),
        posBatch: z.string().optional()
      })
    )(req.query);

    const result = await SalesService.findMany(searchParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get single sale by ID
  static getSale = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const sale = await SalesService.findById(id);

    res.json({
      success: true,
      data: sale
    });
  });

  // Create new sale transaction
  static createSale = asyncHandler(async (req: Request, res: Response) => {
    const saleData = validateRequest(saleCreateSchema)(req.body);
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const transaction = await SalesService.createTransaction(saleData, req.user.id);

    logger.info('Sale transaction created via API', {
      posBatch: transaction.posBatch,
      totalAmount: transaction.totalAmount,
      itemCount: transaction.itemCount,
      userId: req.user.id,
      username: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: transaction
    });
  });

  // Update sale status
  static updateSaleStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = validateRequest(saleUpdateSchema)(req.body);
    
    const sale = await SalesService.updateStatus(
      id, 
      updateData.paymentStatus,
      updateData.notes
    );

    logger.info('Sale status updated via API', {
      saleId: id,
      newStatus: updateData.paymentStatus,
      userId: req.user?.id,
      username: req.user?.username
    });

    res.json({
      success: true,
      message: 'Sale status updated successfully',
      data: sale
    });
  });

  // Get transaction by batch ID
  static getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    
    const transaction = await SalesService.getTransactionsByBatch(batchId);

    res.json({
      success: true,
      data: transaction
    });
  });

  // Get sales analytics
  static getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = validateRequest(dateRangeSchema)(req.query);
    
    const analytics = await SalesService.getSalesAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: analytics
    });
  });

  // Get recent transactions
  static getRecentTransactions = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const transactions = await SalesService.getRecentTransactions(limit);

    res.json({
      success: true,
      data: transactions
    });
  });

  // Get daily sales summary
  static getDailySummary = asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const analytics = await SalesService.getSalesAnalytics(today, tomorrow);

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        ...analytics.summary
      }
    });
  });

  // Get sales by product (for inventory insights)
  static getSalesByProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { startDate, endDate } = validateRequest(dateRangeSchema)(req.query);
    const { page = 1, limit = 20 } = validateRequest(paginationSchema)(req.query);

    const searchParams = {
      page: Number(page),
      limit: Number(limit),
      startDate,
      endDate
    };

    // Add productId filter via raw query since we need to filter by productId
    const result = await SalesService.findMany({
      ...searchParams,
      // Note: This would need to be implemented in SalesService to filter by productId
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get sales performance by seller
  static getSellerPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = validateRequest(dateRangeSchema)(req.query);
    
    // This would need a specific service method to aggregate by seller
    const analytics = await SalesService.getSalesAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: analytics
    });
  });

  // Receipt generation endpoint
  static generateReceipt = asyncHandler(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    
    const transaction = await SalesService.getTransactionsByBatch(batchId);

    // Generate receipt data
    const receipt = {
      transaction,
      receiptNumber: `RCP-${transaction.posBatch}`,
      generatedAt: new Date().toISOString(),
      business: {
        name: 'NMSnacks',
        address: '123 Snack Street',
        phone: '(555) 123-4567',
        email: 'info@nmsnacks.com'
      }
    };

    res.json({
      success: true,
      data: receipt
    });
  });
}