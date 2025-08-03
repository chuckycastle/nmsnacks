#!/usr/bin/env tsx

/**
 * NMSnacks Data Migration Script
 * Migrates data from live AWS Lightsail MySQL database to PostgreSQL
 * 
 * CRITICAL: This script connects to the live production database
 * Usage: npm run migrate:live
 */

import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Live database configuration
const LIVE_DB_CONFIG = {
  host: 'nmsnacks.com',
  user: 'bitnami',
  password: '', // Will be prompted or from env
  database: 'bitnami_nmsnacks', // Assuming bitnami naming convention
  port: 3306,
  ssl: false
};

interface MigrationStats {
  users: number;
  customers: number;
  products: number;
  sales: number;
  raffles: number;
  raffleTickets: number;
  bundles: number;
  replenishments: number;
  errors: string[];
}

class LiveDataMigrator {
  private mysql: mysql.Connection | null = null;
  private stats: MigrationStats = {
    users: 0,
    customers: 0,
    products: 0,
    sales: 0,
    raffles: 0,
    raffleTickets: 0,
    bundles: 0,
    replenishments: 0,
    errors: []
  };

  async connect() {
    console.log('🔌 Connecting to live MySQL database...');
    
    // Try to get password from environment first
    const password = process.env.LIVE_DB_PASSWORD || await this.promptForPassword();
    
    this.mysql = await mysql.createConnection({
      ...LIVE_DB_CONFIG,
      password
    });

    // Test connection
    await this.mysql.execute('SELECT 1');
    console.log('✅ Connected to live database successfully');
  }

  private async promptForPassword(): Promise<string> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('Enter live database password: ', (password: string) => {
        readline.close();
        resolve(password);
      });
    });
  }

  async backupLiveData() {
    console.log('💾 Creating backup of live data...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    const backupDir = path.join(process.cwd(), 'backups', new Date().toISOString().split('T')[0]);
    await fs.mkdir(backupDir, { recursive: true });

    // Get all table names
    const [tables] = await this.mysql.execute('SHOW TABLES');
    
    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0] as string;
      console.log(`📋 Backing up table: ${tableName}`);
      
      const [rows] = await this.mysql.execute(`SELECT * FROM ${tableName}`);
      const backupFile = path.join(backupDir, `${tableName}.json`);
      await fs.writeFile(backupFile, JSON.stringify(rows, null, 2));
    }

    console.log(`✅ Backup completed in: ${backupDir}`);
    return backupDir;
  }

  async migrateUsers() {
    console.log('👥 Migrating users...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT user_id, name, username, email, password, role, created_at 
        FROM users 
        WHERE 1=1
      `);

      for (const row of rows as any[]) {
        try {
          // Convert role from lowercase to uppercase enum
          const role = row.role.toUpperCase();
          
          const user = await prisma.user.create({
            data: {
              username: row.username,
              email: row.email || null,
              name: row.name,
              password: row.password, // Already hashed in PHP
              role: role as any,
              legacyUserId: row.user_id,
              createdAt: new Date(row.created_at)
            }
          });

          this.stats.users++;
          console.log(`  ✓ Migrated user: ${row.username}`);
        } catch (error) {
          const errorMsg = `Failed to migrate user ${row.username}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Users migration failed: ${error}`);
    }
  }

  async migrateCustomers() {
    console.log('🛒 Migrating customers...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT customer_id, name, credit_balance, created_at 
        FROM customers 
        WHERE 1=1
      `);

      for (const row of rows as any[]) {
        try {
          const customer = await prisma.customer.create({
            data: {
              name: row.name,
              creditBalance: parseFloat(row.credit_balance) || 0,
              legacyCustomerId: row.customer_id,
              createdAt: new Date(row.created_at)
            }
          });

          this.stats.customers++;
          console.log(`  ✓ Migrated customer: ${row.name}`);
        } catch (error) {
          const errorMsg = `Failed to migrate customer ${row.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Customers migration failed: ${error}`);
    }
  }

  async migrateProducts() {
    console.log('📦 Migrating products...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT product_id, name, sale_price, cost, stock, image_link, category, created_at 
        FROM products 
        WHERE 1=1
      `);

      for (const row of rows as any[]) {
        try {
          const product = await prisma.product.create({
            data: {
              name: row.name,
              salePrice: parseFloat(row.sale_price),
              cost: parseFloat(row.cost),
              stock: parseInt(row.stock) || 0,
              imageLink: row.image_link || null,
              category: row.category || 'General',
              legacyProductId: row.product_id,
              createdAt: new Date(row.created_at)
            }
          });

          this.stats.products++;
          console.log(`  ✓ Migrated product: ${row.name}`);
        } catch (error) {
          const errorMsg = `Failed to migrate product ${row.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Products migration failed: ${error}`);
    }
  }

  async migrateSales() {
    console.log('💰 Migrating sales...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT s.sale_id, s.buyer, s.product_id, s.quantity, s.unit_sale_price, 
               s.payment_status, s.sale_date, s.payment_received_by, s.payment_method, 
               s.notes, s.pos_batch, s.created_at
        FROM sales s
        WHERE 1=1
        ORDER BY s.sale_date
      `);

      for (const row of rows as any[]) {
        try {
          // Find the corresponding product in new database
          const product = await prisma.product.findUnique({
            where: { legacyProductId: row.product_id }
          });

          if (!product) {
            throw new Error(`Product with legacy ID ${row.product_id} not found`);
          }

          // Find seller by username if available
          let sellerId = null;
          if (row.payment_received_by) {
            const seller = await prisma.user.findUnique({
              where: { username: row.payment_received_by }
            });
            sellerId = seller?.id || null;
          }

          // Find customer by name if buyer is specified
          let customerId = null;
          if (row.buyer && row.buyer.trim()) {
            const customer = await prisma.customer.findFirst({
              where: { name: { contains: row.buyer.trim(), mode: 'insensitive' } }
            });
            customerId = customer?.id || null;
          }

          const totalAmount = parseFloat(row.unit_sale_price) * parseInt(row.quantity);
          const paymentStatus = row.payment_status === 'Paid' ? 'PAID' : 'NOT_PAID';

          const sale = await prisma.sale.create({
            data: {
              buyer: row.buyer || null,
              productId: product.id,
              quantity: parseInt(row.quantity),
              unitSalePrice: parseFloat(row.unit_sale_price),
              totalAmount: totalAmount,
              paymentStatus: paymentStatus as any,
              saleDate: new Date(row.sale_date),
              paymentReceivedBy: row.payment_received_by || null,
              paymentMethod: row.payment_method || null,
              notes: row.notes || null,
              posBatch: row.pos_batch || null,
              sellerId,
              customerId,
              legacySaleId: row.sale_id,
              createdAt: new Date(row.created_at)
            }
          });

          this.stats.sales++;
          if (this.stats.sales % 100 === 0) {
            console.log(`  ✓ Migrated ${this.stats.sales} sales...`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate sale ${row.sale_id}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Sales migration failed: ${error}`);
    }
  }

  async migrateRaffles() {
    console.log('🎲 Migrating raffles...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      // First migrate raffles
      const [raffleRows] = await this.mysql.execute(`
        SELECT raffle_id, name, description, start_date, end_date, ticket_price, 
               status, created_at, updated_at, created_by
        FROM raffles 
        WHERE 1=1
      `);

      for (const row of raffleRows as any[]) {
        try {
          // Find creator by username
          const creator = await prisma.user.findUnique({
            where: { username: row.created_by }
          });

          if (!creator) {
            throw new Error(`Creator with username ${row.created_by} not found`);
          }

          const status = row.status.toUpperCase();
          
          const raffle = await prisma.raffle.create({
            data: {
              name: row.name,
              description: row.description || null,
              startDate: new Date(row.start_date),
              endDate: new Date(row.end_date),
              ticketPrice: parseFloat(row.ticket_price),
              status: status as any,
              createdById: creator.id,
              legacyRaffleId: row.raffle_id,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at)
            }
          });

          this.stats.raffles++;
          console.log(`  ✓ Migrated raffle: ${row.name}`);

          // Migrate raffle items
          await this.migrateRaffleItems(row.raffle_id, raffle.id);
          
          // Migrate raffle tickets
          await this.migrateRaffleTickets(row.raffle_id, raffle.id);

        } catch (error) {
          const errorMsg = `Failed to migrate raffle ${row.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Raffles migration failed: ${error}`);
    }
  }

  private async migrateRaffleItems(legacyRaffleId: number, newRaffleId: string) {
    if (!this.mysql) return;

    const [itemRows] = await this.mysql.execute(`
      SELECT raffle_item_id, category, product_id, quantity, created_at
      FROM raffle_items 
      WHERE raffle_id = ?
    `, [legacyRaffleId]);

    for (const item of itemRows as any[]) {
      try {
        let productId = null;
        if (item.product_id) {
          const product = await prisma.product.findUnique({
            where: { legacyProductId: item.product_id }
          });
          productId = product?.id || null;
        }

        await prisma.raffleItem.create({
          data: {
            raffleId: newRaffleId,
            category: item.category || null,
            productId,
            quantity: parseInt(item.quantity) || 1,
            legacyRaffleItemId: item.raffle_item_id,
            createdAt: new Date(item.created_at)
          }
        });
      } catch (error) {
        console.error(`    ✗ Failed to migrate raffle item: ${error}`);
      }
    }
  }

  private async migrateRaffleTickets(legacyRaffleId: number, newRaffleId: string) {
    if (!this.mysql) return;

    const [ticketRows] = await this.mysql.execute(`
      SELECT ticket_id, buyer_name, contact_info, ticket_number, purchase_date,
             price, payment_method, payment_status, seller, notes
      FROM raffle_tickets 
      WHERE raffle_id = ?
    `, [legacyRaffleId]);

    for (const ticket of ticketRows as any[]) {
      try {
        // Find seller by username
        let sellerId = null;
        if (ticket.seller) {
          const seller = await prisma.user.findUnique({
            where: { username: ticket.seller }
          });
          sellerId = seller?.id || null;
        }

        // Try to find customer by name
        let customerId = null;
        if (ticket.buyer_name) {
          const customer = await prisma.customer.findFirst({
            where: { name: { contains: ticket.buyer_name, mode: 'insensitive' } }
          });
          customerId = customer?.id || null;
        }

        const paymentStatus = ticket.payment_status === 'Paid' ? 'PAID' : 'NOT_PAID';

        await prisma.raffleTicket.create({
          data: {
            raffleId: newRaffleId,
            buyerName: ticket.buyer_name,
            contactInfo: ticket.contact_info || null,
            ticketNumber: ticket.ticket_number,
            purchaseDate: new Date(ticket.purchase_date),
            price: parseFloat(ticket.price),
            paymentMethod: ticket.payment_method,
            paymentStatus: paymentStatus as any,
            seller: ticket.seller,
            notes: ticket.notes || null,
            customerId,
            sellerId,
            legacyTicketId: ticket.ticket_id
          }
        });

        this.stats.raffleTickets++;
      } catch (error) {
        console.error(`    ✗ Failed to migrate raffle ticket: ${error}`);
      }
    }
  }

  async migrateBundles() {
    console.log('📦 Migrating bundles...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT bundle_id, name, bundle_price, items, created_at 
        FROM bundles 
        WHERE 1=1
      `);

      for (const row of rows as any[]) {
        try {
          const bundle = await prisma.bundle.create({
            data: {
              name: row.name,
              bundlePrice: parseFloat(row.bundle_price),
              legacyBundleId: row.bundle_id,
              createdAt: new Date(row.created_at)
            }
          });

          // Parse JSON items and create bundle items
          if (row.items) {
            try {
              const items = JSON.parse(row.items);
              for (const item of items) {
                const product = await prisma.product.findUnique({
                  where: { legacyProductId: item.product_id }
                });

                if (product) {
                  await prisma.bundleItem.create({
                    data: {
                      bundleId: bundle.id,
                      productId: product.id,
                      quantity: parseInt(item.quantity) || 1
                    }
                  });
                }
              }
            } catch (jsonError) {
              console.error(`    ✗ Failed to parse bundle items JSON: ${jsonError}`);
            }
          }

          this.stats.bundles++;
          console.log(`  ✓ Migrated bundle: ${row.name}`);
        } catch (error) {
          const errorMsg = `Failed to migrate bundle ${row.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Bundles migration failed: ${error}`);
    }
  }

  async migrateReplenishments() {
    console.log('📈 Migrating replenishments...');
    
    if (!this.mysql) throw new Error('Not connected to MySQL');

    try {
      const [rows] = await this.mysql.execute(`
        SELECT replenishment_id, product_id, quantity, total_cost, admin_user,
               replenishment_date, notes, batch_id, template_id, created_at
        FROM replenishments 
        WHERE 1=1
      `);

      for (const row of rows as any[]) {
        try {
          const product = await prisma.product.findUnique({
            where: { legacyProductId: row.product_id }
          });

          if (!product) {
            throw new Error(`Product with legacy ID ${row.product_id} not found`);
          }

          // Find user by username
          let userId = null;
          if (row.admin_user) {
            const user = await prisma.user.findUnique({
              where: { username: row.admin_user }
            });
            userId = user?.id || null;
          }

          // Find template if specified
          let templateId = null;
          if (row.template_id) {
            const template = await prisma.boxTemplate.findUnique({
              where: { legacyTemplateId: row.template_id }
            });
            templateId = template?.id || null;
          }

          const replenishment = await prisma.replenishment.create({
            data: {
              productId: product.id,
              quantity: parseInt(row.quantity),
              totalCost: parseFloat(row.total_cost),
              adminUser: row.admin_user,
              replenishmentDate: new Date(row.replenishment_date),
              notes: row.notes || null,
              batchId: row.batch_id || null,
              userId,
              templateId,
              legacyReplenishmentId: row.replenishment_id,
              createdAt: new Date(row.created_at)
            }
          });

          this.stats.replenishments++;
          if (this.stats.replenishments % 50 === 0) {
            console.log(`  ✓ Migrated ${this.stats.replenishments} replenishments...`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate replenishment ${row.replenishment_id}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`  ✗ ${errorMsg}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Replenishments migration failed: ${error}`);
    }
  }

  async validateMigration() {
    console.log('🔍 Validating migration...');

    const validation = {
      users: await prisma.user.count(),
      customers: await prisma.customer.count(),
      products: await prisma.product.count(),
      sales: await prisma.sale.count(),
      raffles: await prisma.raffle.count(),
      raffleTickets: await prisma.raffleTicket.count(),
      bundles: await prisma.bundle.count(),
      replenishments: await prisma.replenishment.count()
    };

    console.log('📊 Migration Results:');
    console.log(`  Users: ${validation.users} migrated`);
    console.log(`  Customers: ${validation.customers} migrated`);
    console.log(`  Products: ${validation.products} migrated`);
    console.log(`  Sales: ${validation.sales} migrated`);
    console.log(`  Raffles: ${validation.raffles} migrated`);
    console.log(`  Raffle Tickets: ${validation.raffleTickets} migrated`);
    console.log(`  Bundles: ${validation.bundles} migrated`);
    console.log(`  Replenishments: ${validation.replenishments} migrated`);

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${this.stats.errors.length}`);
      for (const error of this.stats.errors) {
        console.log(`  - ${error}`);
      }
    }

    return validation;
  }

  async disconnect() {
    if (this.mysql) {
      await this.mysql.end();
    }
    await prisma.$disconnect();
  }
}

// Main migration function
async function main() {
  const migrator = new LiveDataMigrator();

  try {
    console.log('🚀 Starting NMSnacks data migration from live environment...');
    console.log('⚠️  CRITICAL: This will migrate data from nmsnacks.com production database');
    
    await migrator.connect();
    
    // Create backup first
    const backupPath = await migrator.backupLiveData();
    console.log(`💾 Backup created: ${backupPath}`);

    // Run migrations in dependency order
    await migrator.migrateUsers();
    await migrator.migrateCustomers();
    await migrator.migrateProducts();
    await migrator.migrateBundles();
    await migrator.migrateRaffles();
    await migrator.migrateReplenishments();
    await migrator.migrateSales(); // Last due to dependencies

    // Validate migration
    await migrator.validateMigration();

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default LiveDataMigrator;