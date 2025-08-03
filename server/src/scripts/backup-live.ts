#!/usr/bin/env tsx

/**
 * NMSnacks Live Backup Script
 * Creates a complete backup of the live AWS Lightsail database
 * 
 * Usage: npm run backup:live
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';

const LIVE_DB_CONFIG = {
  host: 'nmsnacks.com',
  user: 'bitnami',
  password: '', // Will be prompted
  database: 'bitnami_nmsnacks',
  port: 3306
};

class LiveBackup {
  private mysql: mysql.Connection | null = null;

  async connect() {
    console.log('🔌 Connecting to live database for backup...');
    
    const password = process.env.LIVE_DB_PASSWORD || await this.promptForPassword();
    
    this.mysql = await mysql.createConnection({
      ...LIVE_DB_CONFIG,
      password
    });

    await this.mysql.execute('SELECT 1');
    console.log('✅ Connected successfully');
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

  async createFullBackup() {
    if (!this.mysql) throw new Error('Not connected');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `live-backup-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`📁 Creating backup in: ${backupDir}`);

    // Get database schema
    await this.backupSchema(path.join(backupDir, 'schema.sql'));
    
    // Get all table names
    const [tables] = await this.mysql.execute('SHOW TABLES');
    const tableNames = (tables as any[]).map(row => Object.values(row)[0] as string);

    console.log(`📋 Found ${tableNames.length} tables to backup`);

    // Backup each table
    for (const tableName of tableNames) {
      await this.backupTable(tableName, backupDir);
    }

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      source: 'nmsnacks.com',
      database: LIVE_DB_CONFIG.database,
      tables: tableNames,
      backup_type: 'full'
    };

    await fs.writeFile(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('✅ Backup completed successfully!');
    return backupDir;
  }

  private async backupSchema(filePath: string) {
    if (!this.mysql) return;

    console.log('📐 Backing up database schema...');
    
    const [tables] = await this.mysql.execute('SHOW TABLES');
    const schemaFile = createWriteStream(filePath);
    
    schemaFile.write(`-- NMSnacks Database Schema Backup\n`);
    schemaFile.write(`-- Generated: ${new Date().toISOString()}\n\n`);

    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0] as string;
      
      const [createTable] = await this.mysql.execute(`SHOW CREATE TABLE ${tableName}`);
      const createSQL = (createTable as any[])[0]['Create Table'];
      
      schemaFile.write(`-- Table: ${tableName}\n`);
      schemaFile.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
      schemaFile.write(`${createSQL};\n\n`);
    }

    schemaFile.end();
  }

  private async backupTable(tableName: string, backupDir: string) {
    if (!this.mysql) return;

    console.log(`  📊 Backing up table: ${tableName}`);

    // Get table data
    const [rows] = await this.mysql.execute(`SELECT * FROM ${tableName}`);
    
    // Save as JSON
    const jsonFile = path.join(backupDir, `${tableName}.json`);
    await fs.writeFile(jsonFile, JSON.stringify(rows, null, 2));

    // Get row count
    const [countResult] = await this.mysql.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    const count = (countResult as any[])[0].count;
    
    console.log(`    ✓ ${count} rows backed up`);

    // Generate SQL insert statements for critical tables
    if (['users', 'products', 'sales'].includes(tableName) && count > 0) {
      await this.generateInsertSQL(tableName, rows as any[], backupDir);
    }
  }

  private async generateInsertSQL(tableName: string, rows: any[], backupDir: string) {
    if (!rows.length) return;

    const sqlFile = path.join(backupDir, `${tableName}_inserts.sql`);
    const writeStream = createWriteStream(sqlFile);

    writeStream.write(`-- Insert statements for ${tableName}\n\n`);

    const columns = Object.keys(rows[0]);
    const columnList = columns.map(col => `\`${col}\``).join(', ');

    for (const row of rows) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        return value;
      }).join(', ');

      writeStream.write(`INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`);
    }

    writeStream.end();
  }

  async disconnect() {
    if (this.mysql) {
      await this.mysql.end();
    }
  }
}

async function main() {
  const backup = new LiveBackup();

  try {
    console.log('🚀 Starting live database backup...');
    console.log('📡 Connecting to nmsnacks.com...');
    
    await backup.connect();
    const backupPath = await backup.createFullBackup();
    
    console.log(`✅ Backup completed: ${backupPath}`);
    
  } catch (error) {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  } finally {
    await backup.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default LiveBackup;