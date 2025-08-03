# CLAUDE.md - NMSnacks Point of Sale System

This file provides guidance to Claude Code when working with the NMSnacks point-of-sale and inventory management system.

## Project Overview

NMSnacks is a modern point-of-sale and inventory management system for a snack business, built with React + TypeScript frontend and Node.js + Express + Prisma backend. The system was migrated from legacy PHP to provide better mobile experience and modern features.

## Current Architecture (Modern Stack)

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state, Zustand for client state
- **UI Components**: Headless UI for accessibility
- **Icons**: Heroicons
- **Mobile-First**: Optimized for iPhone usage with responsive design

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: Prisma ORM with MySQL
- **Authentication**: JWT with secure session management
- **Security**: Helmet, CORS, rate limiting, input validation

## Live Environment Access

**Production Server Details:**
- **FQDN**: nmsnacks.com
- **SSH Access**: `ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem bitnami@nmsnacks.com`
- **Database**: MySQL running on same server
- **Application Path**: `/opt/bitnami/apache/htdocs/`
- **Database Access**: MySQL as bitnami user
- **PHP Version**: 7.4+ (Bitnami stack)

**Critical**: All data migration operations MUST reference the live AWS Lightsail environment to ensure no data loss during modernization.

**Technology Stack**:
- **Backend**: PHP 7.4+ with PDO for database operations
- **Frontend**: Bootstrap 5, jQuery, Chart.js
- **Database**: MySQL/MariaDB
- **Architecture**: Traditional LAMP stack with MVC-like structure
- **Authentication**: Session-based with role-based access control

## System Architecture

### Directory Structure
```
├── ajax/                  # AJAX endpoints for dynamic functionality
│   ├── bundles_ajax.php   # Bundle management operations
│   ├── charts_ajax.php    # Chart data endpoints
│   ├── products_ajax.php  # Product CRUD operations
│   ├── raffles_ajax.php   # Raffle management
│   ├── sales_ajax.php     # Sales transaction handling
│   ├── users_ajax.php     # User management operations
│   └── ...               # Additional AJAX endpoints
├── css/                   # Stylesheets
├── img/                   # Product images and logos
├── inc/                   # Core PHP includes
│   ├── auth.php          # Authentication logic
│   ├── config.php        # Database configuration
│   ├── functions.php     # Utility functions
│   └── partials/         # Reusable UI components
│       ├── header.php    # HTML head and navigation
│       ├── footer.php    # Footer and closing tags
│       ├── navbar.php    # Navigation bar
│       └── modals/       # Bootstrap modal dialogs
├── js/                   # JavaScript modules
│   ├── main.js          # Core utilities and chart functions
│   ├── pos.js           # Point of sale functionality
│   ├── inventory.js     # Inventory management
│   └── ...              # Page-specific JavaScript
├── pages/                # Main application pages
│   ├── dashboard.php    # Main dashboard
│   ├── pos.php          # Point of sale interface
│   ├── inventory.php    # Product management
│   ├── sales.php        # Sales history and management
│   └── ...              # Additional feature pages
├── *.sql                # Database schema and updates
├── index.php            # Front controller
└── login.php            # Authentication entry point
```

### Core Architecture Patterns

**Front Controller Pattern**:
- `index.php` serves as the single entry point for authenticated pages
- Routes requests based on `?page=` parameter to appropriate page files
- Handles AJAX vs regular request detection

**Authentication Layer**:
- `inc/auth.php` validates session and role-based access
- Three user roles: admin, seller, customer
- Session regeneration on login for security

**Data Access Pattern**:
- PDO with prepared statements throughout application
- Database configuration centralized in `inc/config.php`
- Consistent error handling with try-catch blocks

## Security Architecture

### Current Security Measures

**✅ Strong Authentication**:
- Password hashing with `password_hash(PASSWORD_DEFAULT)`
- Session regeneration on login
- Role-based access control
- Session timeout protection

**✅ SQL Injection Prevention**:
- Consistent use of PDO prepared statements
- No direct SQL string concatenation found
- Proper parameter binding throughout

**✅ Output Escaping**:
- `htmlspecialchars()` used extensively in templates
- XSS prevention in user-generated content
- Proper encoding of dynamic values

**✅ Access Control**:
- Authentication required for all admin pages
- Role-based restrictions (customer blocked from admin)
- Session validation on each request

### Known Security Vulnerabilities

**🚨 CRITICAL: File Upload Security (ajax/products_ajax.php:31-50)**
```php
// VULNERABLE CODE - DO NOT REPLICATE
if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] == UPLOAD_ERR_OK) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    // Only checks file extension, not content type or file signature
}
```
**Issues**: No MIME type validation, no file content verification, uploads stored in web-accessible directory
**Impact**: Potential remote code execution via PHP shell upload

**🚨 HIGH: Configuration Security (inc/config.php:7)**
```php
// SECURITY ISSUE - HARDCODED CREDENTIALS
$pass = 'your_strong_password'; // Replace with your actual password
```
**Issues**: Database credentials in source code, committed to version control
**Impact**: Credential exposure, potential database compromise

**⚠️ MEDIUM: CSRF Protection Missing**
- All forms lack CSRF token validation
- State-changing operations vulnerable to cross-site request forgery
- Particularly concerning for admin operations (user creation, product management)

**⚠️ MEDIUM: Session Management Issues**
- Multiple `session_start()` calls without proper status checking
- Potential for session fixation attacks
- No session timeout configuration

## Development Guidelines

### Security Best Practices

**File Upload Security**:
```php
// CORRECT: Secure file upload implementation
function validateFileUpload($file) {
    // 1. Check file type by MIME and content
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type');
    }
    
    // 2. Validate file signature/magic bytes
    // 3. Store outside web root or with .htaccess protection
    // 4. Generate unique filename
}
```

**Configuration Security**:
```php
// CORRECT: Environment-based configuration
$host = $_ENV['DB_HOST'] ?? 'localhost';
$db   = $_ENV['DB_NAME'] ?? 'nmsnacks';
$user = $_ENV['DB_USER'] ?? 'nmsnacks_user';
$pass = $_ENV['DB_PASS'] ?? '';
```

**CSRF Protection**:
```php
// CORRECT: CSRF token implementation
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}
```

### Database Patterns

**Consistent PDO Usage**:
```php
// CORRECT: Always use prepared statements
$stmt = $pdo->prepare("SELECT * FROM products WHERE category = ? AND stock > ?");
$stmt->execute([$category, $minStock]);
$products = $stmt->fetchAll();

// NEVER: Direct string concatenation
// $query = "SELECT * FROM products WHERE category = '$category'"; // VULNERABLE
```

**Transaction Handling for Complex Operations**:
```php
// CORRECT: Use transactions for multi-table operations
try {
    $pdo->beginTransaction();
    
    // Multiple related operations
    $stmt1 = $pdo->prepare("INSERT INTO sales ...");
    $stmt1->execute($data1);
    
    $stmt2 = $pdo->prepare("UPDATE products SET stock = stock - ? ...");
    $stmt2->execute($data2);
    
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollback();
    throw $e;
}
```

### Code Organization Patterns

**AJAX Endpoint Structure**:
```php
// Standard AJAX endpoint pattern
<?php
require '../inc/config.php';
require '../inc/auth.php';
require '../inc/functions.php';

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Read operations
        break;
    case 'POST':
        // Create operations
        break;
    case 'PUT':
        // Update operations
        break;
    case 'DELETE':
        // Delete operations
        break;
    default:
        sendResponse(false, [], 'Method not allowed');
}
```

**Error Handling Pattern**:
```php
// Use the sendResponse() function consistently
function sendResponse($success, $data = [], $message = '') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}
```

## Database Schema

### Core Tables

**users**: System users (admin, seller roles)
- `user_id` (PK), `username`, `password`, `email`, `name`, `role`, `created_at`

**customers**: Customer records for sales tracking
- `customer_id` (PK), `name`, `credit_balance`, `created_at`

**products**: Inventory items
- `product_id` (PK), `name`, `sale_price`, `cost`, `stock`, `category`, `image_link`

**sales**: Individual sale transactions
- `sale_id` (PK), `product_id` (FK), `buyer`, `quantity`, `unit_sale_price`, `payment_status`, `sale_date`, `seller`, `pos_batch`

**raffles**: Raffle management
- `raffle_id` (PK), `name`, `description`, `start_date`, `end_date`, `ticket_price`, `status`, `created_by`

**Key Relationships**:
- Sales → Products (many-to-one)
- Sales → Customers (many-to-one, optional)
- Raffle Items → Products (many-to-many through raffle_items)
- Raffle Tickets → Raffles (many-to-one)

### Database Operations

**Common Query Patterns**:
```sql
-- Inventory management
SELECT p.*, 
       COALESCE(SUM(s.quantity), 0) as total_sold,
       (p.stock - COALESCE(SUM(s.quantity), 0)) as available_stock
FROM products p
LEFT JOIN sales s ON p.product_id = s.product_id
GROUP BY p.product_id;

-- Sales analytics
SELECT DATE(sale_date) as sale_day,
       SUM(quantity * unit_sale_price) as daily_revenue,
       COUNT(DISTINCT pos_batch) as transaction_count
FROM sales 
WHERE sale_date >= ?
GROUP BY DATE(sale_date)
ORDER BY sale_day;
```

## Frontend Architecture

### JavaScript Organization

**main.js**: Core utilities and shared functions
- Chart creation and management
- Alert system for user feedback
- Common AJAX helpers

**Page-specific modules**:
- `pos.js`: Point of sale cart management and checkout
- `inventory.js`: Product management and bulk operations
- `sales.js`: Sales history and analytics
- `users.js`: User management interface

### UI Patterns

**Bootstrap Modal Integration**:
- Modals for all CRUD operations
- Consistent form validation and submission
- AJAX-based updates with user feedback

**Chart.js Usage**:
- Sales analytics dashboard
- Inventory level monitoring
- Revenue tracking over time

## Testing Guidelines

### Manual Testing Checklist

**Authentication & Authorization**:
- [ ] Login with valid/invalid credentials
- [ ] Session timeout behavior
- [ ] Role-based access restrictions
- [ ] Logout functionality

**Point of Sale Operations**:
- [ ] Product selection and cart management
- [ ] Stock validation during checkout
- [ ] Payment processing and receipt generation
- [ ] Customer creation and credit tracking

**Inventory Management**:
- [ ] Product CRUD operations
- [ ] Image upload functionality
- [ ] Stock level updates
- [ ] Category management

**Security Testing**:
- [ ] File upload with various file types
- [ ] SQL injection attempts in forms
- [ ] XSS payload injection
- [ ] CSRF attack simulation

### Performance Testing

**Database Performance**:
```bash
# Test with large datasets
# Monitor query execution time for:
# - Product listing with images
# - Sales history queries
# - Chart data aggregation
```

**Load Testing Scenarios**:
- Multiple concurrent POS transactions
- Bulk inventory updates
- Chart data generation with large datasets

## Deployment & Operations

### Environment Setup

**Required PHP Extensions**:
- PDO MySQL
- GD or ImageMagick (for image processing)
- Session support
- JSON support

**Database Setup**:
```sql
-- Create database and user
CREATE DATABASE nmsnacks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nmsnacks_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON nmsnacks.* TO 'nmsnacks_user'@'localhost';

-- Import schema files in order:
-- 1. Base tables
-- 2. raffle_tables.sql
-- 3. update.sql (if applicable)
```

**Web Server Configuration**:
```apache
# Apache .htaccess recommendations
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Security Hardening Checklist

**File System Security**:
- [ ] Move uploads outside web root
- [ ] Set proper file permissions (644 for files, 755 for directories)
- [ ] Create .htaccess to block direct access to sensitive files
- [ ] Remove or secure SQL files from web-accessible location

**Configuration Security**:
- [ ] Move database credentials to environment variables
- [ ] Enable HTTPS for all traffic
- [ ] Configure secure session settings
- [ ] Set up proper error logging (not displayed to users)

**Application Security**:
- [ ] Implement CSRF protection
- [ ] Add input validation framework
- [ ] Set up file upload security
- [ ] Configure session timeout

## Performance Optimization

### Database Optimization

**Recommended Indexes**:
```sql
-- Sales performance
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_batch ON sales(pos_batch);
CREATE INDEX idx_sales_product ON sales(product_id);

-- Product lookups
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);

-- User operations
CREATE INDEX idx_customers_name ON customers(name);
```

**Query Optimization**:
- Use LIMIT clauses for large result sets
- Implement pagination for product listings
- Cache frequently accessed data (categories, user sessions)

### Frontend Optimization

**Asset Management**:
- Minify CSS and JavaScript files
- Optimize product images (WebP format, appropriate sizing)
- Use CDN for external libraries
- Implement browser caching headers

**JavaScript Performance**:
- Debounce search inputs
- Lazy load product images
- Use event delegation for dynamic content
- Minimize DOM manipulations

## Common Development Tasks

### Adding New Features

**New Page Creation**:
1. Create page file in `pages/` directory
2. Add route case in `index.php`
3. Create corresponding JavaScript file if needed
4. Add navigation link in `inc/partials/navbar.php`
5. Create any required AJAX endpoints in `ajax/`

**Database Schema Changes**:
1. Create migration SQL file
2. Test on development environment
3. Update `CLAUDE.md` with schema changes
4. Plan rollback strategy for production

### Debugging Guidelines

**Common Error Patterns**:
- Check session status before operations
- Verify database connection in `config.php`
- Validate file permissions for uploads
- Check for JavaScript console errors

**Logging Strategy**:
```php
// Add error logging (implement centrally)
error_log("NMSnacks Error: " . $message, 3, "/path/to/app.log");
```

## Security Incident Response

### File Upload Compromise
1. Immediately disable file upload functionality
2. Scan `/img` directory for suspicious files
3. Check web server logs for unusual requests
4. Implement proper file validation before re-enabling

### Database Breach Indicators
1. Monitor for unusual query patterns
2. Check for unauthorized user accounts
3. Audit sales data for anomalies
4. Reset all user passwords if compromise confirmed

## Future Development Roadmap

### Short-term Improvements (1-3 months)
- Fix critical security vulnerabilities
- Implement CSRF protection
- Add comprehensive input validation
- Improve error handling and logging

### Medium-term Enhancements (3-6 months)
- Code refactoring and modernization
- API development for mobile integration
- Advanced analytics and reporting
- Automated testing framework

### Long-term Vision (6+ months)
- Framework migration (Laravel/Symfony)
- Real-time notifications system
- Multi-location support
- Integration with payment processors

## Development Environment Setup

### Local Development
```bash
# Using XAMPP/MAMP or Docker
docker run -d \
  --name nmsnacks-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=nmsnacks \
  -e MYSQL_USER=nmsnacks_user \
  -e MYSQL_PASSWORD=dev_password \
  -p 3306:3306 \
  mysql:8.0

# Start PHP development server
php -S localhost:8000 -t /path/to/nmsnacks
```

### Git Workflow
- Use feature branches for all changes
- Test security fixes thoroughly
- Never commit configuration files with real credentials
- Use descriptive commit messages referencing security fixes

---

**Last Updated**: [Current Date]  
**Security Review**: Required before any production deployment  
**Performance Baseline**: Supports ~50 concurrent users, ~1000 products  
**Backup Strategy**: Daily database backups, weekly full system backup  

## Emergency Contacts & Resources
- **Security Issues**: Address immediately, document in this file
- **Performance Issues**: Monitor database query times, implement indexing
- **Data Backup**: Automated daily backups recommended
- **SSL Certificate**: Renewal every 90 days (Let's Encrypt recommended)