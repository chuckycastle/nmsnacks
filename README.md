# NMSnacks - Point of Sale System

NMSnacks is a comprehensive point-of-sale and inventory management system built with PHP and MySQL. Originally hosted on AWS Lightsail, this system manages product sales, inventory tracking, raffles, and business analytics for a snack business.

## Features

- **Point of Sale (POS)** - Process sales transactions
- **Inventory Management** - Track products, stock levels, and restocking
- **User Management** - Multi-user system with authentication
- **Sales Analytics** - Charts and reporting dashboard
- **Raffle System** - Manage and track raffle sales
- **Bookkeeping** - Financial tracking and reporting

## System Architecture

- **Frontend**: PHP with Bootstrap, jQuery, and Chart.js
- **Backend**: PHP with PDO for database operations
- **Database**: MySQL/MariaDB
- **Authentication**: Session-based user authentication

## Directory Structure

```
├── ajax/                  # AJAX endpoints for dynamic functionality
├── css/                   # Stylesheets
├── img/                   # Product images and logos
├── inc/                   # Core PHP includes
│   ├── auth.php          # Authentication logic
│   ├── config.php        # Database configuration
│   ├── functions.php     # Utility functions
│   └── partials/         # Reusable UI components
├── js/                   # JavaScript files
├── pages/                # Main application pages
├── *.sql                 # Database schema and updates
├── index.php            # Front controller
└── login.php            # Authentication entry point
```

## Installation

### Prerequisites

- PHP 7.4+ with PDO MySQL extension
- MySQL/MariaDB database
- Web server (Apache/Nginx)

### Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd nmsnacks
   ```

2. Create database and import schema:
   ```sql
   CREATE DATABASE nmsnacks;
   -- Import the SQL files to set up tables
   ```

3. Configure database connection:
   - Copy `inc/config.php` and update database credentials
   - Consider using environment variables for production

4. Set up web server to serve from project root
   - Ensure `index.php` is the default document
   - Configure proper permissions for web server

## Security Considerations

⚠️ **Important Security Notes:**

- Update database credentials in `inc/config.php`
- Use environment variables for sensitive configuration
- Ensure proper file permissions (readable by web server only)
- Regularly update PHP and dependencies
- Use HTTPS in production

## Development

This application follows a traditional PHP MVC-like pattern:

- **Controllers**: `index.php` (front controller) and `pages/*.php`
- **Models**: Database operations in `inc/functions.php` and AJAX files
- **Views**: HTML templates in `inc/partials/` and page files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add appropriate license]

## Migration Notes

This application was migrated from AWS Lightsail. Original hosting configuration:
- Bitnami LAMP stack
- Apache web server
- MySQL database
- SSL via Let's Encrypt (nmsnacks.com)