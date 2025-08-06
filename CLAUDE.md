# CLAUDE.md - NMSnacks Point of Sale System

This file provides guidance to Claude Code when working with the NMSnacks point-of-sale and inventory management system.

## Project Overview

NMSnacks is a modern point-of-sale and inventory management system for a snack business, built with React + TypeScript frontend and Node.js + Express + Prisma backend. The system was migrated from legacy PHP to provide better mobile experience and modern features.

## Repository Structure (Updated August 2025)

The repository is organized into three distinct branches with specific purposes:

### Branch Architecture

**🏛️ `legacy` Branch** (Archive)
- **Purpose**: Permanent historical archive of original PHP codebase
- **Status**: Frozen - never changes
- **Contents**: Original PHP/MySQL LAMP stack application
- **Usage**: Reference only for historical context

**🏠 `main` Branch** (Production)
- **Purpose**: Current production deployment at nmsnacks.com
- **Status**: Contains legacy PHP code for production stability
- **Contents**: PHP/MySQL LAMP stack (cleaned of modern code)
- **Deployment**: Direct file serving via Apache/PHP-FPM
- **URL**: https://nmsnacks.com

**🚀 `dev` Branch** (Development)
- **Purpose**: Modern React/TypeScript + Node.js development
- **Status**: Active development branch with modern architecture
- **Contents**: React frontend + Node.js/Express/Prisma backend
- **Deployment**: Development environment at dev.nmsnacks.com
- **URL**: https://dev.nmsnacks.com (when Node.js servers are running)

## Live Environment Setup (AWS Lightsail)

**Separate Lightsail Instances Architecture:**

### Production Instance (nmsnacks.com)
- **FQDN**: nmsnacks.com
- **SSH Access**: `ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com`
- **Database**: MySQL running on same server
- **Web Server**: Apache with PHP-FPM
- **Application Path**: `/opt/bitnami/apache/htdocs/` (main branch - legacy PHP)
- **Purpose**: Live production system serving legacy PHP application

### Development Instance (dev.nmsnacks.com)
- **FQDN**: dev.nmsnacks.com
- **SSH Access**: `ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com`
- **Database**: PostgreSQL + Redis (Docker containers or native)
- **Web Server**: Apache with reverse proxy OR direct Node.js serving
- **Application Path**: `/opt/bitnami/apache/htdocs/` OR `/home/bitnami/nmsnacks/` (dev branch - modern stack)
- **Purpose**: Development and staging environment for React/Node.js application

### AWS CLI Access
Both instances can be managed via AWS CLI with appropriate permissions:
```bash
# List all Lightsail instances
aws lightsail get-instances

# Production instance operations
aws lightsail get-instance --instance-name nmsnacks-prod

# Development instance operations  
aws lightsail get-instance --instance-name nmsnacks-dev
```

## Current Architecture (Modern Stack)

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state, Zustand for client state
- **UI Components**: Headless UI for accessibility
- **Icons**: Heroicons
- **Mobile-First**: Optimized for iPhone usage with responsive design
- **Development Server**: Vite dev server on port 3000

### Backend (Node.js + Express)
- **Runtime**: Node.js 18.20.8 with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: Prisma ORM with PostgreSQL (modern architecture)
- **Authentication**: JWT with secure session management
- **Security**: Helmet, CORS, rate limiting, input validation
- **Development Server**: Express server on port 3001

### Database Configuration
- **Development**: PostgreSQL 15 via Docker containers
- **Production**: Will use PostgreSQL (separate from legacy MySQL)
- **Schema**: Modern Prisma schema with comprehensive data model
- **Legacy Migration**: Separate from production data for clean architecture

## Deployment Workflows

### Production Deployment (Legacy PHP)
```bash
# SSH to production instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Navigate to production directory
cd /opt/bitnami/apache/htdocs

# Pull latest changes from main branch
git pull origin main

# No additional steps needed - Apache serves PHP directly
```

### Development Deployment (Modern React/Node.js Stack)
```bash
# SSH to development instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com

# Navigate to application directory (adjust path as needed)
cd /opt/bitnami/apache/htdocs
# OR
cd /home/bitnami/nmsnacks

# Pull latest changes from dev branch
git pull origin dev

# Install/update dependencies
cd server && npm install
cd ../client && npm install

# Database operations (if needed)
cd ../server
npx prisma generate
npx prisma migrate deploy

# Start development servers
npm run dev
# OR use process manager
pm2 start ecosystem.config.js
```

**Development Instance Services:**
- **Backend API**: Express/Prisma server on port 3001
- **Frontend**: Vite dev server on port 3000 OR built static files
- **Database**: PostgreSQL + Redis (Docker or native installation)
- **Web Server**: Apache reverse proxy OR direct Node.js serving

### Git Repository Setup
Each instance has its own git repository configuration:

**Production Instance (nmsnacks.com):**
```bash
cd /opt/bitnami/apache/htdocs
git branch -v  # Shows: main branch tracking origin/main
git remote -v  # Shows repository URL
```

**Development Instance (dev.nmsnacks.com):**
```bash
cd /opt/bitnami/apache/htdocs  # or /home/bitnami/nmsnacks
git branch -v  # Shows: dev branch tracking origin/dev
git remote -v  # Shows repository URL
```

## Development Environment Configuration

### Node.js Setup
- **Version**: Node.js 18.20.8 installed via NodeSource repository
- **Package Manager**: npm 10.8.2
- **Dependencies**: All client and server dependencies installed

### Environment Configuration
Development environment uses `.env` file with MySQL connection:
```env
DATABASE_URL="mysql://root:@localhost:3306/nmsnacks"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://dev.nmsnacks.com"
```

### Startup Script (`start-dev.sh`)
```bash
#!/bin/bash
# Starts both backend (port 3001) and frontend (port 3000) servers
# Runs in background with PID tracking for cleanup
```

## System Status (August 2025)

### Working Components
- ✅ **Production Site**: nmsnacks.com serves legacy PHP application
- ✅ **Domain Routing**: *.nmsnacks.com defaults to production
- ✅ **Git Integration**: Both environments track appropriate branches
- ✅ **Apache Configuration**: Proper virtual host routing
- ✅ **Node.js Environment**: Installed and configured for development

### Development Environment Status (Updated August 2025)
- ✅ **Infrastructure**: Node.js, PostgreSQL, Redis via Docker
- ✅ **Dependencies**: All npm packages installed and working
- ✅ **Database**: PostgreSQL with Prisma migrations deployed
- ✅ **Authentication**: JWT-based auth system fully functional
- ✅ **Sample Data**: Database seeded with test users and products
- ✅ **Servers**: Both frontend (3000) and backend (3001) running
- ✅ **Development Ready**: Complete local environment functional

### Completed Setup Items
1. ✅ **Database Architecture**: Modern PostgreSQL with Prisma ORM
2. ✅ **User Authentication**: Admin/Seller accounts with proper login
3. ✅ **Sample Data**: Comprehensive seed script with realistic data
4. ✅ **Environment Configuration**: Proper .env setup with all required variables
5. ✅ **Development Workflow**: Streamlined setup process documented

## Architecture Migration Strategy

### Current State (August 2025)
- **Production**: Legacy PHP (stable, user-facing at nmsnacks.com)
- **Development**: Modern React/Node.js stack (fully functional locally)
- **Data Architecture**: Clean separation - PostgreSQL for modern, MySQL for legacy
- **Authentication**: Complete modern JWT-based system with test users

### Development Workflow
1. **Local Development**: Use fully functional local environment with Docker
2. **Feature Development**: Work on `dev` branch with modern stack
3. **Testing**: Comprehensive local testing with seeded data
4. **Future Deployment**: Modern stack will get dedicated cloud infrastructure
5. **Legacy Preservation**: Original code preserved in `legacy` branch

### Migration Phases
- **Phase 1** ✅: Infrastructure setup, branch organization
- **Phase 2** ✅: Backend API development, database integration, authentication
- **Phase 3** ✅: Local development environment, data seeding, testing setup
- **Phase 4** 🔜: Cloud deployment preparation, production environment setup
- **Phase 5** 🔜: Production cutover, legacy retirement

## Security Considerations

### Current Security Status
**Legacy PHP Application:**
- ✅ Strong authentication with password hashing
- ✅ SQL injection prevention via PDO prepared statements
- ✅ Output escaping with htmlspecialchars()
- ⚠️ File upload security vulnerabilities remain
- ⚠️ CSRF protection missing
- ⚠️ Hardcoded database credentials in config.php

**Modern Node.js Application:**
- ✅ JWT-based authentication with refresh tokens
- ✅ Input validation and sanitization via Zod
- ✅ CORS and security headers via Helmet
- ✅ Environment-based configuration with .env
- ✅ Secure password hashing with bcryptjs
- ✅ Database migrations deployed and functional
- ✅ User authentication system fully operational

## Performance & Monitoring

### Current Performance
- **Production**: Supports ~50 concurrent users, ~1000 products
- **Infrastructure**: Bitnami LAMP stack on AWS Lightsail
- **Database**: MySQL with appropriate indexes for legacy queries
- **Monitoring**: Apache access/error logs

### Development Performance
- **Frontend**: Vite dev server with hot reload
- **Backend**: Express with development middleware
- **Database**: Shared MySQL instance (development data isolation needed)

## Team Development Guidelines

### Branch Management
```bash
# Working on new features
git checkout dev
git pull origin dev
# Make changes
git commit -m "feature: description"
git push origin dev

# Deploying to production (when ready)
git checkout main
git merge dev  # or create PR
git push origin main
```

## Local Development Environment Setup

### Prerequisites
- Node.js 18+ installed
- Docker installed and running
- Git configured

### Complete Setup Process (Tested August 2025)

**1. Repository Setup**
```bash
# Clone and checkout dev branch
git clone <repository-url>
cd nmsnacks
git checkout dev
```

**2. Database Setup (PostgreSQL via Docker)**
```bash
# Start PostgreSQL and Redis containers
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running
docker ps | grep nmsnacks
```

**3. Backend Setup**
```bash
cd server

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
DATABASE_URL="postgresql://nmsnacks:nmsnacks@localhost:5432/nmsnacks_dev"
NODE_ENV="development"
PORT=3001
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-change-in-production"
CORS_ORIGIN="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
EOF

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Seed database with test data
npx tsx src/scripts/seed.ts

# Start backend server (in background)
npm run dev > ../server.log 2>&1 &
```

**4. Frontend Setup**
```bash
cd ../client

# Install dependencies
npm install

# Start frontend server (in background)
npm run dev > ../client.log 2>&1 &
```

**5. Verification**
```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl -I http://localhost:3000

# Check logs
tail -f server.log client.log
```

### Test Credentials (Created by Seeding)
- **Admin**: username=`admin`, password=`Admin123!`
- **Seller**: username=`seller1`, password=`Seller123!`

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Sample Data Created
- 2 Users (admin + seller with proper roles)
- 10 Product categories
- 10 Sample products (snacks, beverages, candy, etc.)
- 5 Sample customers with credit balances
- 7 System settings

### Environment Management
```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Stop database services
docker-compose -f docker-compose.dev.yml down

# Stop all development servers
pkill -f "node.*3001" && pkill -f "node.*3000"

# Clean restart (reset database)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
cd server && npx prisma migrate deploy && npx tsx src/scripts/seed.ts
```

### Remote Team Development

**Development Instance Access:**
1. SSH to development instance: `ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com`
2. Navigate to project directory: `cd /opt/bitnami/apache/htdocs` OR `cd /home/bitnami/nmsnacks`
3. Pull latest changes: `git pull origin dev`
4. Update dependencies: `cd server && npm install && cd ../client && npm install`
5. Start services: `npm run dev` OR `pm2 start ecosystem.config.js`
6. Access via: https://dev.nmsnacks.com

**Production Instance Access (for maintenance only):**
1. SSH to production instance: `ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com`
2. Navigate to directory: `cd /opt/bitnami/apache/htdocs`
3. Pull changes: `git pull origin main`
4. Access via: https://nmsnacks.com

## Emergency Procedures

### Production Instance Service Recovery (nmsnacks.com)
```bash
# SSH to production instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Restart Apache if needed
sudo /opt/bitnami/ctlscript.sh restart apache

# Restart MySQL if needed
sudo /opt/bitnami/ctlscript.sh restart mariadb

# Check service status
sudo /opt/bitnami/ctlscript.sh status
```

### Development Instance Service Recovery (dev.nmsnacks.com)
```bash
# SSH to development instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com

# Restart Node.js services
pm2 restart all
# OR if using direct npm
pkill -f "node.*3001" && pkill -f "node.*3000"
cd /path/to/nmsnacks && npm run dev

# Restart database services (if using Docker)
docker-compose restart postgres redis

# Check service status
pm2 status
docker ps
```

### Rollback Procedures
- **Production Issues**: Reset main branch on production instance
- **Development Issues**: Reset dev branch on development instance  
- **Database Issues**: Each instance has independent database systems

### Log Locations

**Production Instance (nmsnacks.com):**
- **Apache Access**: `/opt/bitnami/apache/logs/access.log`
- **Apache Errors**: `/opt/bitnami/apache/logs/error.log`
- **MySQL**: `/opt/bitnami/mysql/logs/mysqld.log`

**Development Instance (dev.nmsnacks.com):**
- **Node.js Logs**: PM2 logs or application logs in project directory
- **Database Logs**: Docker container logs or PostgreSQL system logs
- **Apache Logs**: `/opt/bitnami/apache/logs/` (if using reverse proxy)
- **Application Logs**: Check project directory for `server.log`, `client.log`

## Contact Information & Resources

### Development Access
- **Production Admin**: Via legacy PHP interface at nmsnacks.com/login.php
- **Development Environment**: https://dev.nmsnacks.com (when servers running)
- **Database Access**: MySQL as bitnami user on localhost
- **File System**: Full SSH access as bitnami user

### Documentation References
- **Legacy API**: PHP files in ajax/ directory
- **Modern API**: Express routes in server/src/routes/
- **Database Schema**: Prisma schema in server/prisma/schema.prisma
- **Frontend Components**: React components in client/src/

---

**Last Updated**: August 3, 2025  
**Current Status**: Development environment configured, production stable  
**Next Priority**: Complete modern backend integration and frontend debugging  
**Backup Strategy**: Git-based with legacy code preserved in separate branch

## Quick Reference Commands

### Production Operations (nmsnacks.com)
```bash
# SSH to production instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Deploy to production
cd /opt/bitnami/apache/htdocs && git pull origin main

# Check production logs
tail -f /opt/bitnami/apache/logs/error.log

# Restart services
sudo /opt/bitnami/ctlscript.sh restart apache
```

### Development Operations (dev.nmsnacks.com)
```bash
# SSH to development instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com

# Update development environment
cd /path/to/nmsnacks && git pull origin dev

# Install dependencies
cd server && npm install && cd ../client && npm install

# Start development servers
npm run dev
# OR with process manager
pm2 start ecosystem.config.js

# Stop development servers
pm2 stop all
# OR
pkill -f "node.*3001" && pkill -f "node.*3000"
```

### AWS CLI Operations
```bash
# List all Lightsail instances
aws lightsail get-instances

# Get specific instance details
aws lightsail get-instance --instance-name nmsnacks-prod
aws lightsail get-instance --instance-name nmsnacks-dev

# Instance operations (start/stop/reboot)
aws lightsail start-instance --instance-name nmsnacks-dev
aws lightsail stop-instance --instance-name nmsnacks-dev
aws lightsail reboot-instance --instance-name nmsnacks-dev
```

### System Maintenance
```bash
# Production instance (Apache/MySQL)
sudo /opt/bitnami/ctlscript.sh restart
sudo /opt/bitnami/ctlscript.sh status

# Development instance (Node.js/PostgreSQL)
pm2 status
docker ps  # if using Docker for databases
```