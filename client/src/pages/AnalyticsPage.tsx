import { useQuery } from '@tanstack/react-query'
import { salesApi, productsApi } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SalesTrendChart } from '../components/charts'

export default function AnalyticsPage() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => salesApi.getAnalytics(),
  })

  const { data: bestSellers, isLoading: loadingBestSellers } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: () => productsApi.getBestSellers(10),
  })

  if (loadingAnalytics || loadingBestSellers) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const summary = analytics?.data?.summary || {}
  const topProducts = analytics?.data?.topProducts || []
  const salesByDate = analytics?.data?.salesByDate || []
  const bestSellingProducts = bestSellers?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="stat-value text-blue-600">
            {summary.totalSales || 0}
          </div>
          <div className="stat-label">Total Sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-green-600">
            ${(summary.totalRevenue || 0).toFixed(2)}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-purple-600">
            {summary.totalQuantity || 0}
          </div>
          <div className="stat-label">Items Sold</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-yellow-600">
            ${(summary.avgOrderValue || 0).toFixed(2)}
          </div>
          <div className="stat-label">Avg Order Value</div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Sales */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
              Top Products by Sales
            </h3>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 10).map((product: any, index: number) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.quantity} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    ${Number(product.totalAmount || 0).toFixed(2)}
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No sales data available yet.</p>
                  <p className="text-sm mt-2">Sales will appear here once transactions are made.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Best Sellers by Revenue */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
              Best Sellers by Revenue
            </h3>
            <div className="space-y-3">
              {bestSellingProducts.length > 0 ? (
                bestSellingProducts.slice(0, 10).map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.totalQuantitySold} units • {product.salesCount} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    ${product.totalRevenue.toFixed(2)}
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No best-selling products data available yet.</p>
                  <p className="text-sm mt-2">Product rankings will appear here once sales are made.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <SalesTrendChart data={salesByDate} loading={loadingAnalytics} />
    </div>
  )
}