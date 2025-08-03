import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SalesDataPoint {
  date: string
  transaction_count: number
  revenue: number
  quantity_sold: number
}

interface SalesTrendChartProps {
  data: SalesDataPoint[]
  loading?: boolean
  className?: string
}

export default function SalesTrendChart({ data, loading, className = '' }: SalesTrendChartProps) {
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 ${className}`}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Sales Trend
          </h3>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Sort data by date (oldest first for proper trend display)
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Format dates for display
  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue ($)',
        data: sortedData.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Transactions',
        data: sortedData.map(item => item.transaction_count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          },
        },
        title: {
          display: true,
          text: 'Revenue ($)',
          color: 'rgb(59, 130, 246)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
        },
        title: {
          display: true,
          text: 'Transactions',
          color: 'rgb(16, 185, 129)',
        },
      },
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(107, 114, 128)',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(0, 0, 0, 0.8)',
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex
            const date = new Date(sortedData[dataIndex].date)
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric' 
            })
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex
            const dataPoint = sortedData[dataIndex]
            return [`Items Sold: ${dataPoint.quantity_sold}`]
          },
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            
            if (label === 'Revenue ($)') {
              return `${label}: $${value.toLocaleString()}`
            }
            return `${label}: ${value}`
          },
        },
      },
    },
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 ${className}`}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Sales Trend
          </h3>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No sales data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Sales trends will appear here once transactions are made
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Sales Trend
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last {data.length} days
          </div>
        </div>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
        
        {/* Summary stats below chart */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              ${sortedData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {sortedData.reduce((sum, item) => sum + item.transaction_count, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {sortedData.reduce((sum, item) => sum + item.quantity_sold, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Items Sold</div>
          </div>
        </div>
      </div>
    </div>
  )
}