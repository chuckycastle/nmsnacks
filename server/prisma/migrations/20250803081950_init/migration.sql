-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SELLER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'NOT_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_user_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contactInfo" TEXT,
    "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_customer_id" INTEGER,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "image_link" TEXT,
    "category" TEXT NOT NULL,
    "categoryId" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_product_id" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "buyer" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_sale_price" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "sale_date" TIMESTAMP(3) NOT NULL,
    "payment_received_by" TEXT,
    "payment_method" TEXT,
    "notes" TEXT,
    "pos_batch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_sale_id" INTEGER,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT,
    "customerId" TEXT,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bundle_price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_bundle_id" INTEGER,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_cost_per_box" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_template_id" INTEGER,

    CONSTRAINT "box_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_template_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "box_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replenishments" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "admin_user" TEXT NOT NULL,
    "replenishment_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "batch_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_replenishment_id" INTEGER,
    "productId" TEXT NOT NULL,
    "templateId" TEXT,
    "userId" TEXT,

    CONSTRAINT "replenishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "admin_user" TEXT NOT NULL,
    "batch_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacy_transaction_id" INTEGER,
    "productId" TEXT,
    "templateId" TEXT,
    "userId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "ticket_price" DECIMAL(10,2) NOT NULL,
    "max_tickets" INTEGER,
    "status" "RaffleStatus" NOT NULL DEFAULT 'ACTIVE',
    "winner_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_raffle_id" INTEGER,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_items" (
    "id" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacy_raffle_item_id" INTEGER,
    "raffleId" TEXT NOT NULL,
    "productId" TEXT,

    CONSTRAINT "raffle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_tickets" (
    "id" TEXT NOT NULL,
    "buyer_name" TEXT NOT NULL,
    "contact_info" TEXT,
    "ticket_number" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "seller" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacy_ticket_id" INTEGER,
    "raffleId" TEXT NOT NULL,
    "customerId" TEXT,
    "sellerId" TEXT,

    CONSTRAINT "raffle_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_account_id" INTEGER,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "type" "JournalEntryType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacy_entry_id" INTEGER,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "legacy_setting_id" INTEGER,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_legacy_user_id_key" ON "users"("legacy_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_legacy_customer_id_key" ON "customers"("legacy_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_legacy_product_id_key" ON "products"("legacy_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_legacy_sale_id_key" ON "sales"("legacy_sale_id");

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "sales"("sale_date");

-- CreateIndex
CREATE INDEX "sales_pos_batch_idx" ON "sales"("pos_batch");

-- CreateIndex
CREATE INDEX "sales_productId_idx" ON "sales"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "bundles_legacy_bundle_id_key" ON "bundles"("legacy_bundle_id");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_items_bundleId_productId_key" ON "bundle_items"("bundleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "box_templates_legacy_template_id_key" ON "box_templates"("legacy_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "box_template_items_templateId_productId_key" ON "box_template_items"("templateId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "replenishments_legacy_replenishment_id_key" ON "replenishments"("legacy_replenishment_id");

-- CreateIndex
CREATE INDEX "replenishments_batch_id_idx" ON "replenishments"("batch_id");

-- CreateIndex
CREATE INDEX "replenishments_replenishment_date_idx" ON "replenishments"("replenishment_date");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_legacy_transaction_id_key" ON "transactions"("legacy_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "raffles_legacy_raffle_id_key" ON "raffles"("legacy_raffle_id");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_items_legacy_raffle_item_id_key" ON "raffle_items"("legacy_raffle_item_id");

-- CreateIndex
CREATE INDEX "raffle_items_raffleId_idx" ON "raffle_items"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_tickets_legacy_ticket_id_key" ON "raffle_tickets"("legacy_ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_tickets_raffleId_ticket_number_key" ON "raffle_tickets"("raffleId", "ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_legacy_account_id_key" ON "accounts"("legacy_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_legacy_entry_id_key" ON "journal_entries"("legacy_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "settings_legacy_setting_id_key" ON "settings"("legacy_setting_id");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_record_id_idx" ON "audit_logs"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_template_items" ADD CONSTRAINT "box_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "box_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_template_items" ADD CONSTRAINT "box_template_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishments" ADD CONSTRAINT "replenishments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishments" ADD CONSTRAINT "replenishments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "box_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishments" ADD CONSTRAINT "replenishments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "box_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_items" ADD CONSTRAINT "raffle_items_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_items" ADD CONSTRAINT "raffle_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
