import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function SalesPage() {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [page, setPage] = useState(1)

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', dateRange, page],
    queryFn: () => salesApi.getSales({
      ...dateRange,
      page,
      limit: 20
    }),
  })

  const sales = salesData?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales History</h1>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary">Filter</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors duration-200">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Customer</th>
                  <th>Seller</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {sale.product.name}
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {sale.quantity}
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      ${Number(sale.unitSalePrice).toFixed(2)}
                    </td>
                    <td className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${Number(sale.totalAmount).toFixed(2)}
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {sale.customer?.name || sale.buyer || '-'}
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {sale.seller?.name || '-'}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.paymentStatus === 'PAID'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : sale.paymentStatus === 'REFUNDED'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}