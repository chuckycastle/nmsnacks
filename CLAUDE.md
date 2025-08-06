# CLAUDE.md - NMSnacks Point of Sale System

This file provides comprehensive guidance to Claude Code when working with the NMSnacks point-of-sale and inventory management system.

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Architecture & Infrastructure](#architecture--infrastructure)  
3. [Git Workflows & Branch Management](#git-workflows--branch-management)
4. [AWS Infrastructure & Deployment](#aws-infrastructure--deployment)
5. [Development Environments](#development-environments)
6. [Production Operations](#production-operations)
7. [Database Management](#database-management)
8. [Security Considerations](#security-considerations)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Team Development Guidelines](#team-development-guidelines)

## 🎯 **Project Overview**

**NMSnacks** is a dual-architecture point-of-sale and inventory management system for a snack business. The project maintains both a production-ready legacy PHP system and a modern React/Node.js development stack.

### **Business Context**
- **Industry**: Retail snack business with inventory management needs
- **Users**: Store staff, managers, and administrators
- **Core Functions**: Point-of-sale, inventory tracking, customer management, sales analytics
- **Access Pattern**: Mobile-first design optimized for iPhone/tablet usage in retail environment

### **Technical Overview**
- **Repository**: Dual-branch architecture with completely separate technology stacks
- **Production System**: Legacy PHP/MySQL LAMP stack (stable, user-facing)
- **Development System**: Modern React/TypeScript + Node.js/Express/PostgreSQL stack
- **Infrastructure**: AWS Lightsail instances with separate environments
- **Data**: Isolated databases - MySQL for production, PostgreSQL for development

### **Current Status (August 2025)**
- ✅ **Production**: Stable PHP application serving live traffic at nmsnacks.com
- ✅ **Development**: Complete modern stack with authentication, analytics, and customer management
- ✅ **Infrastructure**: Separate AWS Lightsail instances properly configured
- ✅ **Git Workflow**: Clean branch separation with independent deployment pipelines
- 🔜 **Migration Planning**: Future transition from legacy to modern stack when ready

## 🏗️ **Architecture & Infrastructure**

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

# Production instance operations (Note: Instance name is "N_M_Snacks")
aws lightsail get-instance --instance-name "N_M_Snacks"

# Development instance operations  
aws lightsail get-instance --instance-name nmsnacks-dev

# List instances with tags for easier identification
aws lightsail get-instances --query 'instances[?tags[?key==`Project` && value==`NMSnacks`]].{Name:name,Environment:tags[?key==`Environment`].value|[0],State:state.name,PublicIp:publicIpAddress}' --output table
```

**Instance Names:**
- **Production**: `N_M_Snacks` (Cannot be renamed in Lightsail)
- **Development**: `nmsnacks-dev`
- **Tags**: Both instances tagged with Project=NMSnacks for identification

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

## 🌿 **Git Workflows & Branch Management**

### **Branch Strategy Overview**

The repository uses a **divergent dual-branch architecture** where branches serve completely different purposes and should **never be merged**:

```bash
# Repository Structure
nmsnacks/
├── main branch     → Production PHP application (nmsnacks.com)
├── dev branch      → Modern React/Node.js stack (dev.nmsnacks.com)  
└── legacy branch   → Archived historical PHP code (read-only)
```

### **Branch Details**

**🏠 `main` Branch - Production Environment**
```bash
git checkout main
# Purpose: Live production system
# Stack: PHP/MySQL/Apache (LAMP)
# Domain: https://nmsnacks.com
# Instance: N_M_Snacks (52.54.196.130)
# Path: /opt/bitnami/apache/htdocs/
# Status: Stable, serving live traffic
# Commits: Production-ready changes only
```

**🚀 `dev` Branch - Modern Development Stack**
```bash  
git checkout dev
# Purpose: Modern application development
# Stack: React/TypeScript + Node.js/Express/PostgreSQL
# Domain: https://dev.nmsnacks.com (when servers running)
# Instance: nmsnacks-dev (52.5.88.232)
# Path: /home/bitnami/nmsnacks/
# Status: Active development
# Commits: New features, documentation, modern architecture
```

**🏛️ `legacy` Branch - Historical Archive**
```bash
git checkout legacy
# Purpose: Permanent archive of original codebase
# Status: Frozen (never changes)
# Use: Historical reference and rollback point
# Access: Read-only
```

### **Git Operations & Commands**

**🔍 Repository Status & Information**
```bash
# Show all branches with last commits
git branch -a -v

# Show branch divergence
git log --oneline --graph --decorate main dev

# Current branch relationships
git log main..dev --oneline    # What dev has that main doesn't
git log dev..main --oneline    # What main has that dev doesn't

# Show branch tracking information
git remote show origin
```

**📥 Working with Branches**
```bash
# Switch between environments
git checkout main      # Switch to production environment
git checkout dev       # Switch to development environment

# Pull latest changes (always pull before working)
git pull origin main   # Update production branch
git pull origin dev    # Update development branch

# Check repository health
git status
git log --oneline -5
```

**💾 Making Changes**
```bash
# Production changes (main branch)
git checkout main
# Make necessary changes to PHP files
git add .
git commit -m "fix: description of production fix"
git push origin main

# Development changes (dev branch) 
git checkout dev
# Make changes to React/Node.js code or documentation
git add .
git commit -m "feat: description of new feature"
git push origin dev
```

**⚠️ Branch Management Rules**

1. **NEVER merge branches** - They serve different purposes
2. **Always specify branch** when pushing: `git push origin main` or `git push origin dev`
3. **Production changes** go only to `main` branch
4. **Development features** go only to `dev` branch
5. **Documentation updates** typically go to `dev` branch (they contain modern stack context)

### **Commit Message Conventions**

```bash
# Use conventional commits format
feat: add new customer management modal
fix: resolve authentication token refresh issue  
docs: update deployment procedures for separate instances
chore: cleanup development artifacts from production branch
security: implement rate limiting on login endpoints

# Examples of good commit messages
git commit -m "feat: implement sales trend charts with Chart.js integration"
git commit -m "fix: resolve customer credit balance calculation bug"
git commit -m "docs: update AWS CLI commands with correct instance names"
git commit -m "chore: remove development files from production branch"
```

### **Remote Repository Management**

```bash
# Repository details
Remote: https://github.com/chuckycastle/nmsnacks.git

# Check remote configuration
git remote -v
# Should show:
# origin  https://github.com/chuckycastle/nmsnacks.git (fetch)
# origin  https://github.com/chuckycastle/nmsnacks.git (push)

# Fetch latest information from GitHub
git fetch origin

# Sync all branches
git fetch --all
```

### **Conflict Resolution & Recovery**

```bash
# If branches accidentally get mixed up
git checkout main
git reset --hard origin/main      # Reset main to remote state

git checkout dev  
git reset --hard origin/dev       # Reset dev to remote state

# If you're on wrong branch
git stash                         # Save current work
git checkout correct-branch       # Switch to right branch
git stash pop                     # Restore work
```

### **Branch History & Tracking**

```bash
# View branch history and relationships
git log --oneline --graph --all --decorate

# Show branch divergence summary
echo "=== Main branch commits not in dev ==="
git log dev..main --oneline
echo "=== Dev branch commits not in main ==="  
git log main..dev --oneline

# Show detailed branch information
git show-branch main dev
```

## 🏗️ **AWS Infrastructure & Deployment**

### **AWS Lightsail Instance Overview**

The project uses **two separate AWS Lightsail instances** for complete environment isolation:

| **Aspect** | **Production Instance** | **Development Instance** |
|------------|------------------------|-------------------------|
| **Name** | `N_M_Snacks` | `nmsnacks-dev` |
| **IP Address** | `52.54.196.130` | `52.5.88.232` |
| **Domain** | nmsnacks.com | dev.nmsnacks.com |
| **Technology** | PHP/MySQL/Apache | React/Node.js/PostgreSQL |
| **Git Branch** | `main` | `dev` |
| **Environment** | Production | Development |

### **AWS CLI Instance Management**

**📋 Instance Information & Status**
```bash
# List all NMSnacks instances with tags
aws lightsail get-instances --query 'instances[?tags[?key==`Project` && value==`NMSnacks`]].{Name:name,Environment:tags[?key==`Environment`].value|[0],State:state.name,PublicIp:publicIpAddress}' --output table

# Expected output:
# Environment | Name         | PublicIp       | State
# Production  | N_M_Snacks   | 52.54.196.130  | running  
# Development | nmsnacks-dev | 52.5.88.232    | running

# Get specific instance details
aws lightsail get-instance --instance-name "N_M_Snacks"      # Production
aws lightsail get-instance --instance-name nmsnacks-dev      # Development
```

**🔧 Instance Operations**
```bash
# Start instances
aws lightsail start-instance --instance-name "N_M_Snacks"
aws lightsail start-instance --instance-name nmsnacks-dev

# Stop instances (use carefully!)
aws lightsail stop-instance --instance-name "N_M_Snacks"
aws lightsail stop-instance --instance-name nmsnacks-dev

# Reboot instances
aws lightsail reboot-instance --instance-name "N_M_Snacks"
aws lightsail reboot-instance --instance-name nmsnacks-dev

# Get instance metrics
aws lightsail get-instance-metric-data --instance-name "N_M_Snacks" --metric-name CPUUtilization --start-time 2025-08-01T00:00:00Z --end-time 2025-08-06T23:59:59Z --period 3600 --statistics Average
```

**🏷️ Instance Tagging**
```bash
# Both instances are tagged for easy identification:
# Production Instance Tags:
# - Project: NMSnacks
# - Environment: Production  
# - Type: ProductionServer

# Development Instance Tags:
# - Project: NMSnacks
# - Environment: Development
# - Type: DevelopmentServer

# View instance tags
aws lightsail get-instance --instance-name "N_M_Snacks" --query 'instance.tags' --output table
```

### **SSH Access & Server Management**

**🔐 SSH Connection**
```bash
# SSH to production instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@52.54.196.130
# Alternative using domain
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# SSH to development instance  
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@52.5.88.232
# Alternative using domain
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com

# SSH with no host key checking (for automation)
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem -o StrictHostKeyChecking=no bitnami@52.54.196.130
```

**📁 Directory Structure on Servers**

**Production Instance (`N_M_Snacks`):**
```bash
/opt/bitnami/apache/htdocs/          # Main application directory
├── .git/                           # Git repository (main branch)
├── ajax/                           # AJAX endpoints
├── css/                            # Stylesheets  
├── inc/                            # PHP includes
├── js/                             # JavaScript files
├── pages/                          # PHP pages
├── img/                            # Images
├── index.php                       # Main entry point
├── login.php                       # Login page
└── .env.example                    # Environment template
```

**Development Instance (`nmsnacks-dev`):**
```bash
/home/bitnami/nmsnacks/             # Main application directory
├── .git/                           # Git repository (dev branch)
├── client/                         # React frontend
├── server/                         # Node.js backend
├── docker-compose.yml              # Container orchestration
├── CLAUDE.md                       # This documentation
├── package.json                    # Root package config
└── .env.example                    # Environment template
```

---

**Last Updated**: August 6, 2025  
**Current Status**: Comprehensive documentation with full AWS CLI and Git context  
**Architecture**: Dual-branch system with separate Lightsail instances  
**Next Priority**: Continue modern stack development while maintaining production stability

## 💻 **Development Environments**

### **Local Development Setup**

**Prerequisites:**
```bash
# Required software
- Node.js 18+ with npm
- Docker & Docker Compose  
- Git configured with GitHub access
- Code editor (VS Code recommended)
```

**Complete Local Setup (Tested August 2025):**

```bash
# 1. Clone repository and checkout dev branch
git clone https://github.com/chuckycastle/nmsnacks.git
cd nmsnacks
git checkout dev

# 2. Start database services (PostgreSQL + Redis)
docker-compose -f docker-compose.dev.yml up -d
# Verify containers are running
docker ps | grep nmsnacks

# 3. Backend setup
cd server
npm install
# Create environment file with PostgreSQL connection
cp .env.example .env
# Edit .env to ensure DATABASE_URL points to PostgreSQL
# DATABASE_URL="postgresql://nmsnacks:nmsnacks@localhost:5432/nmsnacks_dev"

# Deploy database schema and seed data  
npx prisma generate
npx prisma migrate deploy
npx tsx src/scripts/seed.ts

# Start backend server (port 3001)
npm run dev

# 4. Frontend setup (new terminal)
cd ../client
npm install
# Start frontend server (port 3000)  
npm run dev
```

**Test Credentials (Created by Seeding):**
- **Admin User**: username=`admin`, password=`Admin123!`
- **Seller User**: username=`seller1`, password=`Seller123!`

**Development URLs:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### **Development Environment Management**

**🐳 Docker Services**
```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Stop database services
docker-compose -f docker-compose.dev.yml down

# Reset database (clean restart)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
cd server && npx prisma migrate deploy && npx tsx src/scripts/seed.ts

# View service logs
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis
```

**🏗️ Development Servers**
```bash
# Start backend server (development mode with hot reload)
cd server && npm run dev

# Start frontend server (development mode with hot reload)  
cd client && npm run dev

# Stop all Node.js servers
pkill -f "node.*3001" && pkill -f "node.*3000"

# Check running processes
ps aux | grep -E "(node|tsx|vite)" | grep -v grep
```

**🗄️ Database Operations**
```bash
# Database management (from server/ directory)
npx prisma studio              # Open database GUI
npx prisma generate            # Regenerate Prisma client
npx prisma migrate dev         # Create new migration
npx prisma migrate deploy      # Apply migrations
npx prisma db seed            # Seed database with test data

# Reset database completely
npx prisma migrate reset      # ⚠️ Destructive - removes all data
```

### **Remote Development (AWS Lightsail)**

**Development Instance Access:**
```bash
# SSH to development instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@dev.nmsnacks.com

# Navigate to project directory
cd /home/bitnami/nmsnacks

# Update codebase
git pull origin dev

# Install/update dependencies
cd server && npm install
cd ../client && npm install

# Start services (if needed)
cd server && npm run dev &
cd ../client && npm run dev &

# Access via public URL
# https://dev.nmsnacks.com (when servers are running)
```

## 🔧 **Production Operations**

### **Production Deployment (Legacy PHP)**

**Production Instance Access:**
```bash
# SSH to production instance
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Navigate to production directory
cd /opt/bitnami/apache/htdocs

# Update production code (ALWAYS pull before making changes)
git pull origin main

# Production is automatically served by Apache
# No restart needed for PHP changes
```

**Production System Information:**
- **Stack**: PHP 8 + MySQL + Apache (Bitnami LAMP)
- **Domain**: https://nmsnacks.com
- **Auto-deployment**: Apache serves PHP files directly
- **Logs**: Available in `/opt/bitnami/apache/logs/`

### **Production Service Management**

```bash
# SSH to production instance first
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Service operations
sudo /opt/bitnami/ctlscript.sh status      # Check all services
sudo /opt/bitnami/ctlscript.sh restart     # Restart all services
sudo /opt/bitnami/ctlscript.sh restart apache     # Restart Apache only
sudo /opt/bitnami/ctlscript.sh restart mariadb    # Restart MySQL only

# Check service health
curl -I https://nmsnacks.com              # Check website response
systemctl status bitnami                  # Check Bitnami stack status
```

## 🔍 **Monitoring & Troubleshooting**

### **Health Checks & Diagnostics**

**Local Development Health:**
```bash
# Check backend API health
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"...","uptime":"..."}

# Check frontend
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Check database connections
docker ps | grep nmsnacks                 # Verify containers running
cd server && npx prisma db push --preview-feature  # Test Prisma connection
```

**Production Health:**
```bash
# Check production website
curl -I https://nmsnacks.com
# Expected: HTTP/1.1 200 OK with PHP headers

# Check from production server
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com
curl -I http://localhost/                 # Internal check
tail -f /opt/bitnami/apache/logs/error.log    # Check for errors
```

**AWS Instance Health:**
```bash
# Check instance status via AWS CLI
aws lightsail get-instance-state --instance-name "N_M_Snacks"
aws lightsail get-instance-state --instance-name nmsnacks-dev

# Get instance metrics (CPU, Memory)
aws lightsail get-instance-metric-data --instance-name "N_M_Snacks" --metric-name CPUUtilization --start-time 2025-08-01T00:00:00Z --end-time 2025-08-06T23:59:59Z --period 3600 --statistics Average
```

### **Common Issues & Solutions**

**🔧 Development Environment Issues:**

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL container is running
   docker ps | grep postgres
   # If not running, start it
   docker-compose -f docker-compose.dev.yml up -d postgres
   
   # Check DATABASE_URL in server/.env
   cat server/.env | grep DATABASE_URL
   # Should be: DATABASE_URL="postgresql://nmsnacks:nmsnacks@localhost:5432/nmsnacks_dev"
   ```

2. **Port Already in Use (3000/3001)**
   ```bash
   # Find processes using ports
   lsof -i :3000
   lsof -i :3001
   
   # Kill processes
   kill -9 $(lsof -t -i :3000)
   kill -9 $(lsof -t -i :3001)
   ```

3. **Prisma Client Issues**
   ```bash
   # Regenerate Prisma client
   cd server
   npx prisma generate
   
   # Reset database if schema issues
   npx prisma migrate reset
   npx tsx src/scripts/seed.ts
   ```

**🔧 Production Issues:**

1. **Website Not Loading**
   ```bash
   # SSH to production instance
   ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com
   
   # Check Apache status
   sudo /opt/bitnami/ctlscript.sh status apache
   
   # Check error logs
   tail -f /opt/bitnami/apache/logs/error.log
   
   # Restart Apache if needed
   sudo /opt/bitnami/ctlscript.sh restart apache
   ```

2. **Database Issues (MySQL)**
   ```bash
   # Check MySQL status
   sudo /opt/bitnami/ctlscript.sh status mariadb
   
   # Check MySQL error logs
   tail -f /opt/bitnami/mysql/logs/mysqld.log
   
   # Restart MySQL
   sudo /opt/bitnami/ctlscript.sh restart mariadb
   ```

### **Log Files & Debugging**

**Development Logs:**
```bash
# Backend server logs (local)
cd server && npm run dev          # Shows logs in terminal

# Database logs (Docker containers)
docker-compose -f docker-compose.dev.yml logs -f postgres

# Frontend logs (browser console)
# Open browser dev tools at http://localhost:3000
```

**Production Logs:**
```bash
# SSH to production first
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Apache access logs
tail -f /opt/bitnami/apache/logs/access.log

# Apache error logs
tail -f /opt/bitnami/apache/logs/error.log

# MySQL error logs
tail -f /opt/bitnami/mysql/logs/mysqld.log

# System logs
journalctl -f                     # System service logs
dmesg | tail                      # Kernel messages
```

## 🛡️ **Security Considerations**

### **Development Environment Security**

**Database Security:**
- PostgreSQL container runs on localhost only
- Development credentials in `.env` files (not committed)
- Isolated Docker network for database containers

**API Security:**
- JWT tokens with expiration (15min access, 7d refresh)
- CORS enabled for localhost:3000 only
- Rate limiting configured for development
- Input validation on all endpoints

### **Production Environment Security**

**Production Checklist:**
- ✅ HTTPS enforced via domain configuration
- ✅ Database credentials not in source code
- ✅ Regular security updates via Bitnami stack
- ✅ Limited SSH access with key-based authentication
- ✅ Input validation and SQL injection prevention

**Regular Security Tasks:**
```bash
# Update production system (SSH to production)
sudo /opt/bitnami/updater.sh              # Update Bitnami stack
sudo apt update && sudo apt upgrade       # Update system packages
```

## 👥 **Team Development Guidelines**

### **Development Workflow**

1. **Before Starting Work:**
   ```bash
   git checkout dev
   git pull origin dev              # Always pull latest changes
   docker-compose -f docker-compose.dev.yml up -d    # Start services
   ```

2. **Making Changes:**
   ```bash
   # Make your changes to React/Node.js code
   # Test locally at http://localhost:3000
   # Ensure all tests pass
   ```

3. **Committing Changes:**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   git push origin dev
   ```

### **Code Review Process**

- All development work goes through `dev` branch
- Production updates go directly to `main` branch (emergency fixes only)
- Never merge `dev` into `main` or vice versa
- Document significant changes in commit messages

### **Testing Standards**

```bash
# Backend testing
cd server
npm run test                       # Unit tests
npm run lint                       # Code linting

# Frontend testing  
cd client
npm run test                       # Component tests
npm run type-check                 # TypeScript validation
```

## 📋 **Quick Reference Commands**

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
aws lightsail get-instance --instance-name "N_M_Snacks"      # Production
aws lightsail get-instance --instance-name nmsnacks-dev      # Development

# Instance operations (start/stop/reboot)
aws lightsail start-instance --instance-name "N_M_Snacks"
aws lightsail start-instance --instance-name nmsnacks-dev
aws lightsail stop-instance --instance-name "N_M_Snacks"
aws lightsail stop-instance --instance-name nmsnacks-dev
aws lightsail reboot-instance --instance-name "N_M_Snacks"
aws lightsail reboot-instance --instance-name nmsnacks-dev

# List NMSnacks instances by project tag
aws lightsail get-instances --query 'instances[?tags[?key==`Project` && value==`NMSnacks`]]' --output table
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