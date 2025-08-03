import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().optional().transform(val => val === '' ? undefined : val),
  endDate: z.string().optional().transform(val => val === '' ? undefined : val),
});

// User validation schemas
export const userCreateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  role: z.enum(['ADMIN', 'SELLER', 'CUSTOMER']).default('SELLER'),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Product validation schemas
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name cannot exceed 200 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  salePrice: z.coerce.number().positive('Sale price must be positive'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  minStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  categoryId: z.string().cuid().optional(),
  sku: z.string().max(50, 'SKU cannot exceed 50 characters').optional(),
  barcode: z.string().max(100, 'Barcode cannot exceed 100 characters').optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productSearchSchema = z.object({
  q: z.string().optional(), // Search query
  categoryId: z.string().cuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
});

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

// Customer validation schemas
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Customer name cannot exceed 200 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
  creditBalance: z.coerce.number().min(0, 'Credit balance cannot be negative').default(0),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// Sale validation schemas
export const saleCreateSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitSalePrice: z.number().positive('Unit sale price must be positive'),
  })).min(1, 'At least one item is required'),
  customerId: z.string().cuid().optional(),
  paymentMethod: z.string().max(50, 'Payment method cannot exceed 50 characters').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const saleUpdateSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

// Raffle validation schemas
export const raffleCreateSchema = z.object({
  name: z.string().min(1, 'Raffle name is required').max(200, 'Raffle name cannot exceed 200 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  ticketPrice: z.coerce.number().positive('Ticket price must be positive'),
  maxTickets: z.coerce.number().int().positive().optional(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive('Quantity must be positive').default(1),
  })).min(1, 'At least one item is required'),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const raffleUpdateSchema = z.object({
  name: z.string().min(1, 'Raffle name is required').max(200, 'Raffle name cannot exceed 200 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  ticketPrice: z.coerce.number().positive('Ticket price must be positive').optional(),
  maxTickets: z.coerce.number().int().positive().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const raffleTicketPurchaseSchema = z.object({
  customerId: z.string().cuid(),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
});

// File upload validation
export const fileUploadSchema = z.object({
  mimetype: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
    'Only JPEG, PNG, GIF, and WebP images are allowed'
  ),
  size: z.number().max(5 * 1024 * 1024, 'File size cannot exceed 5MB'),
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`);
    }
    return result.data;
  };
};