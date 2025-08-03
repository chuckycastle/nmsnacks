# NMSnacks - Point of Sale System

NMSnacks is a modern point-of-sale and inventory management system built with React and Node.js. This system manages product sales, inventory tracking, raffles, and business analytics for a snack business.

## Features

- **Point of Sale (POS)** - Process sales transactions with modern UI
- **Inventory Management** - Track products, stock levels, and restocking
- **Customer Management** - Customer database with credit tracking
- **Sales Analytics** - Interactive charts and reporting dashboard
- **User Management** - Multi-user system with JWT authentication
- **Raffle System** - Manage and track raffle sales (planned)
- **Mobile-First Design** - Optimized for iPhone and tablet usage

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state, Zustand for client state
- **Charts**: Chart.js with react-chartjs-2
- **UI Components**: Headless UI for accessibility
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with secure session management
- **Security**: Helmet, CORS, rate limiting, input validation

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

## Installation

### Prerequisites

- Node.js 18+ with npm
- PostgreSQL 14+
- Git

### Development Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd nmsnacks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL database:
   ```bash
   # Using Docker (recommended)
   docker-compose up -d postgres

   # Or install PostgreSQL locally and create database
   createdb nmsnacks
   ```

4. Configure environment variables:
   ```bash
   # Copy example files
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env

   # Update database connection in server/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/nmsnacks"
   ```

5. Initialize database:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

6. Start development servers:
   ```bash
   # Backend (runs on :3001)
   cd server && npm run dev

   # Frontend (runs on :3000)
   cd client && npm run dev
   ```

### Production Deployment

1. Build the applications:
   ```bash
   npm run build
   ```

2. Set up environment variables for production
3. Run database migrations:
   ```bash
   cd server && npx prisma migrate deploy
   ```

4. Start production servers:
   ```bash
   cd server && npm start
   cd client && npm run preview
   ```

## API Documentation

The backend provides a RESTful API with the following main endpoints:

- **Authentication**: `/api/v1/auth/*`
- **Products**: `/api/v1/products/*`
- **Sales**: `/api/v1/sales/*`
- **Customers**: `/api/v1/customers/*`
- **Analytics**: `/api/v1/sales/analytics`

API documentation is available at `/api/v1/docs` when running the development server.

## Development

### Frontend Development
- Uses React 18 with TypeScript for type safety
- Tailwind CSS for responsive styling with dark mode
- React Query for efficient data fetching and caching
- Chart.js for interactive data visualization

### Backend Development
- Express.js with TypeScript
- Prisma ORM for type-safe database operations
- JWT authentication with refresh tokens
- Comprehensive input validation and error handling

### Database Schema
The application uses PostgreSQL with Prisma ORM. Key entities include:
- Users (admin, seller roles)
- Customers (with credit tracking)
- Products (inventory management)
- Sales (transaction records)
- Analytics (aggregated reporting data)

## Testing

```bash
# Run frontend tests
cd client && npm test

# Run backend tests
cd server && npm test

# Type checking
npm run type-check
```

## Security Features

- JWT-based authentication with refresh tokens
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection with proper output encoding
- CORS configuration
- Rate limiting
- Secure session management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes with proper TypeScript types
4. Test your changes thoroughly
5. Submit a pull request

## License

[Add appropriate license]

## Migration History

This application was completely rewritten from a legacy PHP/MySQL system to provide:
- Modern development experience with TypeScript
- Better mobile responsiveness
- Real-time data updates
- Enhanced security
- Scalable architecture

The legacy PHP codebase has been fully replaced and is no longer in use.