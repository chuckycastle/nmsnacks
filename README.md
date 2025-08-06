# NMSnacks - Point of Sale System

**NMSnacks** is a dual-architecture point-of-sale and inventory management system for a snack business. The project maintains both a production-ready legacy PHP system and a modern React/Node.js development stack with separate AWS Lightsail instances.

## 🏗️ **Architecture Overview**

This repository uses a **dual-branch architecture** where branches serve completely different purposes:

- **`main` branch**: Production PHP/MySQL application serving live traffic at [nmsnacks.com](https://nmsnacks.com)
- **`dev` branch**: Modern React/TypeScript + Node.js/Express/PostgreSQL development stack
- **`legacy` branch**: Historical archive of original codebase (read-only)

⚠️ **Important**: Branches are **never merged** - they serve independent environments with different technology stacks.

## 🌟 **Features**

### **Production System (PHP - nmsnacks.com)**
- ✅ **Point of Sale (POS)** - Live transaction processing
- ✅ **Inventory Management** - Product and stock tracking
- ✅ **Customer Management** - Customer database with credit system
- ✅ **User Management** - Multi-user access control
- ✅ **Sales Reporting** - Business analytics and reporting
- ✅ **Raffle System** - Ticket sales and management

### **Development System (React/Node.js - dev.nmsnacks.com)**
- ✅ **Modern UI Components** - React 18 with TypeScript
- ✅ **Interactive Analytics** - Chart.js sales trend visualization
- ✅ **Customer Management** - Modal-based editing with credit management
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Real-time Updates** - React Query for efficient data fetching
- ✅ **Mobile-First Design** - Responsive Tailwind CSS interface

## 🏛️ **Infrastructure**

### **AWS Lightsail Instances**

| **Environment** | **Instance Name** | **Domain** | **Technology Stack** |
|----------------|-------------------|------------|----------------------|
| **Production** | `N_M_Snacks` | [nmsnacks.com](https://nmsnacks.com) | PHP 8 + MySQL + Apache |
| **Development** | `nmsnacks-dev` | [dev.nmsnacks.com](https://dev.nmsnacks.com) | React + Node.js + PostgreSQL |

### **Technology Stacks**

**Production Stack (main branch):**
- **Backend**: PHP 8 with PDO MySQL
- **Database**: MySQL/MariaDB
- **Server**: Apache with Bitnami LAMP
- **Frontend**: jQuery + Bootstrap + Chart.js

**Development Stack (dev branch):**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 15 + Redis
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, rate limiting

## Directory Structure

```
├── client/                # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── charts/    # Chart.js components
│   │   │   ├── modals/    # Modal dialog components
│   │   │   └── ui/        # Base UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API integration layer
│   │   └── types.ts       # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic layer
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API route definitions
│   │   └── utils/         # Utility functions
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json
├── docker-compose.yml     # Development environment
└── package.json          # Root package.json
```

## 🚀 **Quick Start**

### **Development Environment (Modern Stack)**

**Prerequisites:**
- Node.js 18+ with npm
- Docker & Docker Compose
- Git configured with GitHub access

**Setup (5 minutes):**
```bash
# 1. Clone and switch to development branch
git clone https://github.com/chuckycastle/nmsnacks.git
cd nmsnacks
git checkout dev

# 2. Start database services
docker-compose -f docker-compose.dev.yml up -d

# 3. Backend setup
cd server
npm install
cp .env.example .env
npx prisma migrate deploy
npx tsx src/scripts/seed.ts
npm run dev &

# 4. Frontend setup
cd ../client
npm install
npm run dev
```

**Access Points:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5432

**Test Credentials:**
- **Admin**: `admin` / `Admin123!`
- **Seller**: `seller1` / `Seller123!`

### **Production Environment (Legacy PHP)**

**Access:**
- **Website**: https://nmsnacks.com
- **Admin Panel**: https://nmsnacks.com/login.php

**Management:**
```bash
# SSH to production server
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com

# Update production code
cd /opt/bitnami/apache/htdocs
git pull origin main
```

## 📚 **Documentation**

### **Comprehensive Documentation**
- **[CLAUDE.md](./CLAUDE.md)** - Complete development guide with Git workflows, AWS CLI, and deployment procedures
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration history from legacy PHP to modern stack
- **[client/CLAUDE.md](./client/CLAUDE.md)** - Frontend-specific development documentation

### **API Documentation (Development Stack)**
**Modern API Endpoints** (`dev` branch - Node.js/Express):
- **Authentication**: `/api/v1/auth/*` (login, refresh, profile)
- **Products**: `/api/v1/products/*` (CRUD operations)
- **Sales**: `/api/v1/sales/*` (transaction processing)
- **Customers**: `/api/v1/customers/*` (customer management)
- **Analytics**: `/api/v1/sales/analytics` (sales trend data)
- **Health Check**: `/health` (service status)

**Legacy API Endpoints** (`main` branch - PHP):
- **AJAX Endpoints**: `/ajax/*.php` (legacy PHP endpoints)
- **Pages**: Direct PHP page routing

## 🔧 **Development**

### **Branch Management**
```bash
# Production work (PHP)
git checkout main
git pull origin main

# Development work (React/Node.js)
git checkout dev  
git pull origin dev

# NEVER merge branches - they serve different purposes
```

### **AWS Infrastructure Management**
```bash
# List NMSnacks instances
aws lightsail get-instances --query 'instances[?tags[?key==`Project` && value==`NMSnacks`]]'

# Instance operations
aws lightsail start-instance --instance-name "N_M_Snacks"      # Production
aws lightsail start-instance --instance-name nmsnacks-dev      # Development
```

### **Testing & Validation**
```bash
# Development stack testing
cd server && npm run test && npm run lint
cd client && npm run test && npm run type-check

# Health checks
curl http://localhost:3001/health                 # Backend API
curl -I http://localhost:3000                     # Frontend
curl -I https://nmsnacks.com                      # Production
```

## 🛡️ **Security & Best Practices**

### **Development Security**
- ✅ JWT tokens with refresh rotation
- ✅ Input validation with Zod schemas
- ✅ CORS configured for localhost only
- ✅ Rate limiting on all endpoints
- ✅ Environment-based configuration

### **Production Security**
- ✅ HTTPS enforced via domain
- ✅ Key-based SSH authentication
- ✅ SQL injection prevention (PDO prepared statements)
- ✅ XSS protection with output escaping
- ✅ Regular security updates

## 🌿 **Git Workflow**

### **Branch Strategy**
- **`main`**: Production PHP application (never merge into)
- **`dev`**: Modern React/Node.js development (never merge into)
- **`legacy`**: Historical archive (read-only)

### **Contribution Guidelines**
1. **Development features**: Work on `dev` branch only
2. **Production fixes**: Work on `main` branch only
3. **Use conventional commits**: `feat:`, `fix:`, `docs:`, etc.
4. **Test thoroughly**: Ensure changes work in target environment
5. **Update documentation**: Keep docs current with changes

## 📊 **Project Status**

### **✅ Completed**
- Dual-branch architecture with separate AWS instances
- Modern React/TypeScript + Node.js/Express development stack
- Customer management with credit system and modal interfaces  
- Sales analytics with interactive Chart.js visualizations
- JWT-based authentication with refresh tokens
- Comprehensive development environment with Docker

### **🔄 Current Focus**
- Continuing modern stack feature development
- Maintaining production system stability
- Enhanced documentation and developer experience

### **🔮 Future Plans**
- Complete feature parity between stacks
- Migration strategy from legacy to modern system
- Enhanced mobile responsiveness and offline capabilities

## 📞 **Support & Contact**

- **Repository**: [GitHub - chuckycastle/nmsnacks](https://github.com/chuckycastle/nmsnacks)
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: See [CLAUDE.md](./CLAUDE.md) for comprehensive development guide

---

**Last Updated**: August 6, 2025  
**Architecture**: Dual-branch system with separate Lightsail instances  
**Status**: Active development with stable production system