#!/usr/bin/env tsx

/**
 * NMSnacks Database Seeding Script
 * Creates initial data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/utils/auth';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🔑 Seeding users...');

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@nmsnacks.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create seller user
  const sellerPassword = await hashPassword('Seller123!');
  const seller = await prisma.user.upsert({
    where: { username: 'seller1' },
    update: {},
    create: {
      username: 'seller1',
      email: 'seller@nmsnacks.com',
      name: 'Store Clerk',
      password: sellerPassword,
      role: 'SELLER'
    }
  });

  console.log(`  ✓ Created admin user: ${admin.username}`);
  console.log(`  ✓ Created seller user: ${seller.username}`);
  
  return { admin, seller };
}

async function seedCategories() {
  console.log('📂 Seeding categories...');

  const categories = [
    'Snacks',
    'Beverages', 
    'Candy',
    'Chips',
    'Cookies',
    'Beverages - Soda',
    'Beverages - Water',
    'Beverages - Energy',
    'Health Foods',
    'Seasonal Items'
  ];

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: `${categoryName} products`
      }
    });
  }

  console.log(`  ✓ Created ${categories.length} categories`);
}

async function seedProducts() {
  console.log('📦 Seeding products...');

  const products = [
    {
      name: 'Coca-Cola 20oz',
      salePrice: 2.50,
      cost: 1.25,
      stock: 50,
      category: 'Beverages - Soda',
      sku: 'COK-20OZ-001'
    },
    {
      name: 'Pepsi 20oz',
      salePrice: 2.50,
      cost: 1.25,
      stock: 45,
      category: 'Beverages - Soda',
      sku: 'PEP-20OZ-001'
    },
    {
      name: 'Lays Classic Chips',
      salePrice: 1.99,
      cost: 0.99,
      stock: 30,
      category: 'Chips',
      sku: 'LAY-CLASSIC-001'
    },
    {
      name: 'Doritos Nacho Cheese',
      salePrice: 2.25,
      cost: 1.15,
      stock: 25,
      category: 'Chips',
      sku: 'DOR-NACHO-001'
    },
    {
      name: 'Snickers Bar',
      salePrice: 1.50,
      cost: 0.75,
      stock: 40,
      category: 'Candy',
      sku: 'SNI-BAR-001'
    },
    {
      name: 'Kit-Kat Bar',
      salePrice: 1.50,
      cost: 0.75,
      stock: 35,
      category: 'Candy',
      sku: 'KIT-BAR-001'
    },
    {
      name: 'Oreo Cookies Original',
      salePrice: 3.99,
      cost: 2.25,
      stock: 20,
      category: 'Cookies',
      sku: 'ORE-ORIG-001'
    },
    {
      name: 'Dasani Water 16.9oz',
      salePrice: 1.25,
      cost: 0.50,
      stock: 60,
      category: 'Beverages - Water',
      sku: 'DAS-16OZ-001'
    },
    {
      name: 'Red Bull Energy Drink',
      salePrice: 3.25,
      cost: 1.85,
      stock: 24,
      category: 'Beverages - Energy',
      sku: 'RDB-ORIG-001'
    },
    {
      name: 'Granola Bar - Nature Valley',
      salePrice: 1.75,
      cost: 0.95,
      stock: 30,
      category: 'Health Foods',
      sku: 'NV-GRAN-001'
    }
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        ...productData,
        minStock: 5
      }
    });
  }

  console.log(`  ✓ Created ${products.length} products`);
}

async function seedCustomers() {
  console.log('👥 Seeding customers...');

  const customers = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      creditBalance: 25.00
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 234-5678',
      creditBalance: 10.50
    },
    {
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      creditBalance: 0
    },
    {
      name: 'Emily Davis',
      phone: '(555) 345-6789',
      creditBalance: 5.25
    },
    {
      name: 'David Brown',
      email: 'david.brown@email.com',
      creditBalance: 15.75
    }
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { 
        email: customerData.email || `${customerData.name.toLowerCase().replace(' ', '.')}@placeholder.com`
      },
      update: {},
      create: customerData
    });
  }

  console.log(`  ✓ Created ${customers.length} customers`);
}

async function seedSettings() {
  console.log('⚙️ Seeding system settings...');

  const settings = [
    {
      key: 'business_name',
      value: 'NMSnacks',
      category: 'business'
    },
    {
      key: 'business_address',
      value: '123 Snack Street, Food City, FC 12345',
      category: 'business'
    },
    {
      key: 'business_phone',
      value: '(555) 123-SNACK',
      category: 'business'
    },
    {
      key: 'business_email',
      value: 'info@nmsnacks.com',
      category: 'business'
    },
    {
      key: 'tax_rate',
      value: '0.08',
      category: 'pos'
    },
    {
      key: 'low_stock_threshold',
      value: '10',
      category: 'inventory'
    },
    {
      key: 'receipt_message',
      value: 'Thank you for shopping with NMSnacks!',
      category: 'pos'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log(`  ✓ Created ${settings.length} system settings`);
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    const { admin, seller } = await seedUsers();
    await seedCategories();
    await seedProducts();
    await seedCustomers();
    await seedSettings();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('  Admin: username=admin, password=Admin123!');
    console.log('  Seller: username=seller1, password=Seller123!');
    console.log('\n🌐 You can now start the server and access the API at http://localhost:3001');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;