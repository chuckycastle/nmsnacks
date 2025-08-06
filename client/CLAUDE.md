# CLAUDE.md - NMSnacks Client Application

This file provides guidance to Claude Code when working with the React frontend of the NMSnacks point-of-sale system.

## 🎯 **Client Application Context**

**NMSnacks Client** is the React-based frontend of the modern development stack (`dev` branch). This client application provides a modern, mobile-first interface for the point-of-sale system.

### **Important Architecture Notes**
- **Environment**: Development stack only (`dev` branch)
- **Technology**: React 18 + TypeScript + Vite + Tailwind CSS
- **API Backend**: Node.js/Express server (port 3001)
- **Database**: Connects to PostgreSQL via backend API
- **Deployment**: Development instance at dev.nmsnacks.com

### **Relationship to Production**
- **Production System**: Uses separate legacy PHP frontend (completely different)
- **Development System**: This React client + Node.js backend
- **No Cross-Compatibility**: Client only works with modern backend API

## Recent Development Work

### Sales Trend Charts Implementation (Completed - August 2025)

**Feature**: Interactive sales trend visualization in the analytics page showing revenue and transaction patterns over time.

**Implementation Details**:
- **Files Created**:
  - `/src/components/charts/SalesTrendChart.tsx` - Main chart component using Chart.js
  - `/src/components/charts/index.ts` - Export barrel for chart components
- **Files Modified**:
  - `/src/pages/AnalyticsPage.tsx` - Integrated chart with existing analytics data

**Key Features Implemented**:
1. **Dual-Axis Line Chart**:
   - Revenue trend (blue line, left y-axis) with filled area
   - Transaction count trend (green line, right y-axis)
   - Smooth curve interpolation with tension: 0.4

2. **Interactive Features**:
   - Hover tooltips showing date, revenue, transactions, and items sold
   - Responsive design that adapts to container size
   - Dark mode support matching application theme
   - Loading states with spinner animation

3. **Data Visualization**:
   - Chronological sorting of sales data (oldest to newest)
   - Date formatting for readability (e.g., "Jan 15")
   - Summary statistics below chart (total revenue, transactions, items)
   - Empty state handling with informative messages

4. **Technical Implementation**:
   - Built with Chart.js v4.4.1 and react-chartjs-2 v5.2.0
   - TypeScript interfaces for type safety
   - Uses existing `salesApi.getAnalytics()` endpoint
   - Extracts `salesByDate` data from backend analytics

**Backend Integration**:
- Utilizes existing `/api/v1/sales/analytics` endpoint
- Backend already provides `salesByDate` array with daily aggregations
- No additional API endpoints required - leveraged existing sales service

### Customer Management Implementation (Completed)

**Issue Resolved**: Customer action buttons (pencil/edit and credit card/credit management) were non-functional on the customers page.

**Implementation Details**:
- **Files Modified**:
  - `/src/pages/CustomersPage.tsx` - Added modal state management and onClick handlers
  - Created `/src/components/modals/EditCustomerModal.tsx` - Customer editing modal
  - Created `/src/components/modals/CreditManagementModal.tsx` - Credit management modal  
  - Created `/src/components/ui/Modal.tsx` - Base modal component using Headless UI
  - Created `/src/types.ts` - Comprehensive TypeScript definitions
  - Updated `/src/services/api.ts` - Fixed environment variable access and API interfaces

**Key Features Implemented**:
1. **Edit Customer Modal**:
   - Form validation with real-time feedback
   - Updates customer name, email, phone, and credit balance
   - React Query integration for cache invalidation
   - Error handling with toast notifications

2. **Credit Management Modal**:
   - Add/subtract credit operations
   - Balance preview with validation (prevents negative balances)
   - Reason tracking for credit changes
   - Real-time balance calculations

3. **Base Modal Component**:
   - Built with Headless UI for accessibility
   - Smooth transitions and animations
   - Multiple size options (sm, md, lg, xl)
   - Consistent styling across the application

**Technical Stack Used**:
- React Query (@tanstack/react-query) for data fetching/caching
- Headless UI (@headlessui/react) for accessible modal components
- Heroicons for consistent iconography
- Tailwind CSS for responsive styling
- TypeScript for type safety

**Backend Integration**:
- Utilizes existing REST endpoints:
  - `PUT /api/v1/customers/:id` - Update customer details
  - `PATCH /api/v1/customers/:id/credit` - Manage customer credit
- Backend endpoints were already properly implemented in Express/Prisma stack

## Project Architecture

### Frontend Structure
```
src/
├── components/
│   ├── charts/          # Chart components using Chart.js
│   │   ├── SalesTrendChart.tsx
│   │   └── index.ts
│   ├── modals/          # Modal dialog components
│   │   ├── EditCustomerModal.tsx
│   │   └── CreditManagementModal.tsx
│   └── ui/              # Reusable UI components
│       └── Modal.tsx
├── pages/               # Main application pages
│   ├── AnalyticsPage.tsx
│   └── CustomersPage.tsx
├── services/            # API integration
│   └── api.ts
├── types.ts            # TypeScript definitions
└── ...
```

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state
- **Charts**: Chart.js v4.4.1 with react-chartjs-2 v5.2.0
- **UI Components**: Headless UI for accessibility
- **Icons**: Heroicons
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Vite

### API Integration Patterns

**Standard API Response Format**:
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

**React Query Usage Pattern**:
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiEndpoint(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] })
    onClose()
    toast.success('Operation successful')
  },
  onError: (error) => {
    toast.error(error.response?.data?.message || 'Operation failed')
  }
})
```

## Development Patterns

### Chart Component Pattern
All chart components follow a consistent pattern:
1. Import and register Chart.js components at module level
2. Accept data, loading, and className props
3. Handle loading states with spinner animation
4. Handle empty data states with informative messages
5. Sort and format data appropriately for visualization
6. Use responsive design with maintainAspectRatio: false
7. Support dark mode with theme-aware colors
8. Include interactive tooltips with custom formatting

**Example Chart Component Structure**:
```typescript
interface ChartProps {
  data: DataType[]
  loading?: boolean
  className?: string
}

export default function ChartComponent({ data, loading, className }: ChartProps) {
  if (loading) return <LoadingState />
  if (!data?.length) return <EmptyState />
  
  const chartData = { /* processed data */ }
  const options = { /* Chart.js configuration */ }
  
  return <ChartJSComponent data={chartData} options={options} />
}
```

### Modal Component Pattern
All modals follow a consistent pattern:
1. Use base `Modal` component for layout and accessibility
2. Local state management for form data
3. React Query mutations for API calls
4. Toast notifications for user feedback
5. Query cache invalidation on success

### Form Validation Pattern
```typescript
const [errors, setErrors] = useState<Record<string, string>>({})

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  if (!formData.name.trim()) {
    newErrors.name = 'Name is required'
  }
  
  if (formData.email && !isValidEmail(formData.email)) {
    newErrors.email = 'Invalid email format'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

### Error Handling Pattern
- API errors are intercepted globally in `api.ts`
- Toast notifications for user feedback
- Form-specific validation errors displayed inline
- Loading states managed per component

## Type Definitions

### Core Customer Interface
```typescript
interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  creditBalance: number | string
  purchaseCount?: number
  totalSpent?: number | string
  lastPurchaseDate?: string | null
  createdAt: string
  updatedAt: string
}
```

## Security Considerations

### Input Validation
- All form inputs are validated client-side and server-side
- Email format validation using regex
- Numeric inputs are parsed and validated
- Credit balance cannot go negative

### Authentication
- JWT tokens managed via axios interceptors
- Automatic token refresh on 401 responses
- Secure token storage in localStorage
- Redirect to login on authentication failure

## Testing Considerations

### Manual Testing Checklist
- [ ] Edit customer modal opens and displays current data
- [ ] Customer details update successfully
- [ ] Credit management modal calculates balances correctly
- [ ] Credit operations (add/subtract) work properly
- [ ] Form validation prevents invalid submissions
- [ ] Toast notifications appear for success/error states
- [ ] Modal closes after successful operations
- [ ] Customer list refreshes after updates

### Performance Notes
- React Query caching reduces API calls
- Modal components only render when needed
- Form validation is debounced to prevent excessive re-renders
- Images and assets are optimized for web delivery

## Common Development Tasks

### Adding New Chart Components
1. Create chart component in `/src/components/charts/`
2. Import and register required Chart.js components
3. Follow consistent prop interface (data, loading, className)
4. Implement loading and empty states
5. Add responsive design and dark mode support
6. Export from `/src/components/charts/index.ts`
7. Use descriptive TypeScript interfaces for data

### Adding New Modal Components
1. Create modal component in `/src/components/modals/`
2. Use base `Modal` component for consistency
3. Implement form validation and error handling
4. Add React Query mutation for API integration
5. Add modal state management to parent component
6. Include onClick handlers for trigger buttons

### API Integration Updates
1. Update type definitions in `/src/types.ts`
2. Add/modify API methods in `/src/services/api.ts`
3. Ensure proper error handling and response types
4. Update React Query keys for cache management

### UI Component Updates
1. Follow Tailwind CSS utility classes
2. Maintain responsive design patterns
3. Use Heroicons for consistent iconography
4. Implement proper accessibility attributes

## Environment Configuration

### Required Environment Variables
```bash
VITE_API_URL=http://localhost:3001  # Backend API URL
```

### Development Setup
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run type-check  # TypeScript compilation check
```

## Future Enhancements

### Planned Analytics Enhancements
- [ ] Product performance charts (bar/pie charts for category breakdown)
- [ ] Customer analytics (top customers, purchase patterns)
- [ ] Inventory turnover visualization
- [ ] Profit margin analysis charts
- [ ] Time range selectors for all charts
- [ ] Export chart data functionality

### Planned Customer Enhancements
- [ ] Add customer creation modal
- [ ] Implement customer deletion with confirmation
- [ ] Add customer purchase history view
- [ ] Implement bulk operations for customers
- [ ] Add customer export functionality
- [ ] Enhance search and filtering capabilities

### Technical Debt
- Add comprehensive unit tests for chart and modal components
- Implement proper error boundaries for better error handling
- Consider virtualization for large customer lists
- Add Chart.js performance optimizations for large datasets
- Implement chart data caching strategies

## Troubleshooting

### Common Issues
1. **Charts not rendering**: Verify Chart.js components are registered properly at module level
2. **Chart data not updating**: Check React Query cache invalidation and data dependencies
3. **Dark mode styling issues**: Ensure chart colors use theme-aware Tailwind classes
4. **Modal not opening**: Check modal state management and onClick handlers
5. **API calls failing**: Verify backend is running and VITE_API_URL is correct
6. **Type errors**: Ensure all interfaces are properly defined in types.ts
7. **Toast not showing**: Verify react-hot-toast is properly configured
8. **Responsive chart issues**: Check container sizing and maintainAspectRatio settings

### Debug Commands
```bash
npm run type-check    # Check TypeScript compilation
npm run dev          # Start with hot reload for debugging
```

---

**Last Updated**: August 2025
**Status**: 
- ✅ Customer management functionality fully implemented and tested
- ✅ Sales trend charts implemented with Chart.js integration
- ✅ Analytics page enhanced with interactive data visualization

**Architecture**: Modern React/Node.js stack with PostgreSQL (no legacy PHP dependencies)  
**Environment**: Development stack only (`dev` branch, dev.nmsnacks.com)  
**Backend Integration**: Node.js/Express API on port 3001  
**Next Session**: Ready for additional analytics charts or new feature development

---

## 📚 **Documentation Links**

- **[Main Documentation](../CLAUDE.md)** - Complete project documentation with Git workflows and AWS CLI
- **[README.md](../README.md)** - Project overview and quick start guide  
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Migration history from legacy PHP

For comprehensive development guidance including Git workflows, AWS instance management, and deployment procedures, refer to the main [CLAUDE.md](../CLAUDE.md) file.