import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [page, setPage] = useState(1)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, page],
    queryFn: () => productsApi.getProducts({
      q: searchTerm,
      category: selectedCategory,
      page,
      limit: 20
    }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  const products = productsData?.data || []
  const categories = categoriesData?.data || []
  const pagination = productsData?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="flex space-x-2">
            <button className="btn-outline">
              Low Stock
            </button>
            <button className="btn-outline">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors duration-200">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Cost</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.imageLink ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={product.imageLink}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <PhotoIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {product.name}
                            </div>
                            {product.sku && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-900 dark:text-gray-100">
                        {product.category}
                      </td>
                      <td className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${Number(product.salePrice).toFixed(2)}
                      </td>
                      <td className="text-sm text-gray-900 dark:text-gray-100">
                        ${Number(product.cost).toFixed(2)}
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock <= (product.minStock || 5)
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : product.stock <= 20
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="btn-outline"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                      className="btn-outline"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {(page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                              pageNum === page
                                ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}