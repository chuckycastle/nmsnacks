import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { createNotFoundError, createValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface CustomerSearchParams {
  q?: string;
  hasCredit?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerWithStats extends Customer {
  totalPurchases?: number;
  totalSpent?: number;
  lastPurchaseDate?: Date;
  purchaseCount?: number;
}

export class CustomerService {
  static async findMany(params: CustomerSearchParams) {
    const {
      q,
      hasCredit,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const where: Prisma.CustomerWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } }
        ]
      }),
      ...(hasCredit && { creditBalance: { gt: 0 } })
    };

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sales: {
            select: {
              totalAmount: true,
              saleDate: true
            }
          },
          _count: {
            select: {
              sales: true,
              raffleTickets: true
            }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    const enhancedCustomers: CustomerWithStats[] = customers.map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const lastPurchaseDate = customer.sales.length > 0 
        ? customer.sales.reduce((latest, sale) => 
            sale.saleDate > latest ? sale.saleDate : latest, 
            customer.sales[0].saleDate
          )
        : undefined;

      return {
        ...customer,
        sales: undefined,
        totalSpent,
        lastPurchaseDate,
        purchaseCount: customer._count.sales
      };
    });

    return {
      data: enhancedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id: string): Promise<CustomerWithStats> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            totalAmount: true,
            saleDate: true,
            product: {
              select: {
                name: true,
                category: true
              }
            }
          },
          orderBy: { saleDate: 'desc' },
          take: 10
        },
        raffleTickets: {
          select: {
            id: true,
            ticketNumber: true,
            purchaseDate: true,
            price: true,
            raffle: {
              select: {
                name: true,
                status: true
              }
            }
          },
          orderBy: { purchaseDate: 'desc' }
        },
        _count: {
          select: {
            sales: true,
            raffleTickets: true
          }
        }
      }
    });

    if (!customer) {
      throw createNotFoundError('Customer not found');
    }

    const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const lastPurchaseDate = customer.sales.length > 0 ? customer.sales[0].saleDate : undefined;

    return {
      ...customer,
      totalSpent,
      lastPurchaseDate,
      purchaseCount: customer._count.sales
    };
  }

  static async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    // Check for existing customer with same email
    if (data.email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: data.email }
      });
      if (existingCustomer) {
        throw createValidationError('Customer with this email already exists');
      }
    }

    const customer = await prisma.customer.create({
      data
    });

    logger.info('Customer created', {
      customerId: customer.id,
      name: customer.name,
      email: customer.email
    });

    return customer;
  }

  static async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      throw createNotFoundError('Customer not found');
    }

    // Check email uniqueness for updates
    if (data.email && data.email !== existingCustomer.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: { 
          email: data.email as string,
          id: { not: id }
        }
      });
      if (existingEmail) {
        throw createValidationError('Customer with this email already exists');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data
    });

    logger.info('Customer updated', {
      customerId: customer.id,
      name: customer.name,
      changes: Object.keys(data)
    });

    return customer;
  }

  static async delete(id: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true,
            raffleTickets: true
          }
        }
      }
    });

    if (!customer) {
      throw createNotFoundError('Customer not found');
    }

    // Check if customer has transaction history
    if (customer._count.sales > 0 || customer._count.raffleTickets > 0) {
      // Soft delete
      await prisma.customer.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info('Customer soft deleted (has transaction history)', {
        customerId: id,
        name: customer.name,
        salesCount: customer._count.sales,
        raffleTicketsCount: customer._count.raffleTickets
      });
    } else {
      // Hard delete
      await prisma.customer.delete({
        where: { id }
      });

      logger.info('Customer hard deleted', {
        customerId: id,
        name: customer.name
      });
    }
  }

  static async updateCredit(
    id: string, 
    amount: number, 
    operation: 'add' | 'subtract',
    reason?: string
  ): Promise<Customer> {
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw createNotFoundError('Customer not found');
    }

    const newBalance = operation === 'add' 
      ? Number(customer.creditBalance) + amount 
      : Number(customer.creditBalance) - amount;

    if (newBalance < 0) {
      throw createValidationError('Credit balance cannot be negative');
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { creditBalance: newBalance }
    });

    logger.info('Customer credit updated', {
      customerId: id,
      name: customer.name,
      operation,
      amount,
      oldBalance: customer.creditBalance,
      newBalance,
      reason
    });

    return updatedCustomer;
  }

  static async getTopCustomers(limit: number = 10): Promise<CustomerWithStats[]> {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        sales: {
          select: {
            totalAmount: true,
            saleDate: true
          }
        },
        _count: {
          select: {
            sales: true
          }
        }
      }
    });

    return customers
      .map(customer => {
        const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const lastPurchaseDate = customer.sales.length > 0 
          ? customer.sales.reduce((latest, sale) => 
              sale.saleDate > latest ? sale.saleDate : latest, 
              customer.sales[0].saleDate
            )
          : undefined;

        return {
          ...customer,
          sales: undefined,
          totalSpent,
          lastPurchaseDate,
          purchaseCount: customer._count.sales
        };
      })
      .filter(customer => customer.totalSpent! > 0)
      .sort((a, b) => b.totalSpent! - a.totalSpent!)
      .slice(0, limit);
  }

  static async getCustomersWithCredit(): Promise<CustomerWithStats[]> {
    const customers = await prisma.customer.findMany({
      where: { 
        isActive: true,
        creditBalance: { gt: 0 }
      },
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      },
      orderBy: { creditBalance: 'desc' }
    });

    return customers.map(customer => ({
      ...customer,
      purchaseCount: customer._count.sales
    }));
  }
}