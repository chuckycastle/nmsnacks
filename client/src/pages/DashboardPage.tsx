import { useQuery } from '@tanstack/react-query'
import { salesApi, productsApi, customersApi } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  BanknotesIcon,
  CubeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: dailySummary, isLoading: loadingDaily } = useQuery({
    queryKey: ['dashboard', 'daily-summary'],
    queryFn: () => salesApi.getDailySummary(),
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => salesApi.getAnalytics(),
  })

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => productsApi.getLowStock(10),
  })

  const { data: recentTransactions, isLoading: loadingRecent } = useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: () => salesApi.getRecentTransactions(5),
  })

  const { data: topCustomers, isLoading: loadingTopCustomers } = useQuery({
    queryKey: ['dashboard', 'top-customers'],
    queryFn: () => customersApi.getTopCustomers(5),
  })

  const isLoading = loadingDaily || loadingAnalytics || loadingLowStock

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const todayStats = dailySummary?.data || {}
  const overallStats = analytics?.data?.summary || {}
  const lowStockProducts = lowStock?.data || []
  const recent = recentTransactions?.data || []
  const topCustomersList = topCustomers?.data || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full">
                <ShoppingCartIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Welcome to NMSnacks POS
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </dd>
              </dl>
            </div>
            <div className="ml-5 flex-shrink-0">
              <Link
                to="/pos"
                className="btn-primary"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Today's Performance</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Sales"
            value={todayStats.totalSales || 0}
            icon={ShoppingCartIcon}
            color="blue"
            subtitle="transactions"
          />
          <StatCard
            title="Revenue"
            value={`$${(todayStats.totalRevenue || 0).toFixed(2)}`}
            icon={BanknotesIcon}
            color="green"
            subtitle="total sales"
          />
          <StatCard
            title="Items Sold"
            value={todayStats.totalQuantity || 0}
            icon={CubeIcon}
            color="purple"
            subtitle="products"
          />
          <StatCard
            title="Avg Order"
            value={`$${(todayStats.avgOrderValue || 0).toFixed(2)}`}
            icon={ArrowTrendingUpIcon}
            color="yellow"
            subtitle="per transaction"
          />
        </div>
      </div>

      {/* Overall Stats */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Overall Performance</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Sales"
            value={overallStats.totalSales || 0}
            icon={ShoppingCartIcon}
            color="blue"
            subtitle="all time"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(overallStats.totalRevenue || 0).toFixed(2)}`}
            icon={BanknotesIcon}
            color="green"
            subtitle="all time"
          />
          <StatCard
            title="Products Sold"
            value={overallStats.totalQuantity || 0}
            icon={CubeIcon}
            color="purple"
            subtitle="items"
          />
          <StatCard
            title="Avg Order Value"
            value={`$${(overallStats.avgOrderValue || 0).toFixed(2)}`}
            icon={ArrowTrendingUpIcon}
            color="yellow"
            subtitle="average"
          />
        </div>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 dark:text-yellow-300" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Low Stock Alert
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lowStockProducts.length} products need restocking
                </p>
              </div>
            </div>
            
            {lowStockProducts.length > 0 ? (
              <div className="mt-4">
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {product.stock} left
                      </span>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    +{lowStockProducts.length - 3} more items
                  </p>
                )}
                <div className="mt-4">
                  <Link
                    to="/products?lowStock=true"
                    className="text-sm btn-outline"
                  >
                    View All Low Stock
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                All products are well stocked!
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Recent Transactions
              </h3>
              <Link
                to="/sales"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                View all
              </Link>
            </div>
            
            {recent.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recent.map((transaction: any) => (
                  <div key={transaction.posBatch} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {transaction.itemCount} items
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.saleDate).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${transaction.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.seller.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                No recent transactions
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomersList.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Top Customers</h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors duration-200">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {topCustomersList.map((customer: any, index: number) => (
                <li key={customer.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.purchaseCount} purchases
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${customer.totalSpent?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        total spent
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'yellow'
  subtitle?: string
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {value}
              </dd>
              {subtitle && (
                <dd className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}