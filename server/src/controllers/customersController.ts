import { Request, Response } from 'express';
import { CustomerService } from '@/services/customerService';
import { validateRequest, customerCreateSchema, customerUpdateSchema, paginationSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { z } from 'zod';

export class CustomersController {
  // Get all customers with filtering and pagination
  static getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const searchParams = validateRequest(
      paginationSchema.extend({
        q: z.string().optional(),
        hasCredit: z.boolean().optional()
      })
    )(req.query);

    const result = await CustomerService.findMany(searchParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get single customer by ID
  static getCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const customer = await CustomerService.findById(id);

    res.json({
      success: true,
      data: customer
    });
  });

  // Create new customer
  static createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customerData = validateRequest(customerCreateSchema)(req.body);
    
    const customer = await CustomerService.create(customerData);

    logger.info('Customer created via API', {
      customerId: customer.id,
      userId: req.user?.id,
      username: req.user?.username
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  });

  // Update customer
  static updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = validateRequest(customerUpdateSchema)(req.body);
    
    const customer = await CustomerService.update(id, updateData);

    logger.info('Customer updated via API', {
      customerId: id,
      userId: req.user?.id,
      username: req.user?.username,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  });

  // Delete customer
  static deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await CustomerService.delete(id);

    logger.info('Customer deleted via API', {
      customerId: id,
      userId: req.user?.id,
      username: req.user?.username
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  });

  // Update customer credit balance
  static updateCredit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, operation, reason } = req.body;

    if (!amount || !operation || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Provide amount and operation (add/subtract)'
      });
    }

    const customer = await CustomerService.updateCredit(
      id, 
      parseFloat(amount), 
      operation,
      reason
    );

    logger.info('Customer credit updated via API', {
      customerId: id,
      operation,
      amount: parseFloat(amount),
      newBalance: customer.creditBalance,
      reason,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Credit ${operation === 'add' ? 'added to' : 'deducted from'} customer successfully`,
      data: customer
    });
  });

  // Get top customers by spending
  static getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const customers = await CustomerService.getTopCustomers(limit);

    res.json({
      success: true,
      data: customers
    });
  });

  // Get customers with credit balance
  static getCustomersWithCredit = asyncHandler(async (req: Request, res: Response) => {
    const customers = await CustomerService.getCustomersWithCredit();

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  });

  // Search customers by name (for POS system autocomplete)
  static searchCustomers = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const result = await CustomerService.findMany({
      q: q.toString(),
      limit: 20
    });

    // Return simplified data for autocomplete
    const suggestions = result.data.map(customer => ({
      id: customer.id,
      name: customer.name,
      creditBalance: customer.creditBalance,
      email: customer.email
    }));

    res.json({
      success: true,
      data: suggestions
    });
  });
}