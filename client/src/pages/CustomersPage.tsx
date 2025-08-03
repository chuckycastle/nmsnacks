import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EditCustomerModal } from '../components/modals/EditCustomerModal'
import { CreditManagementModal } from '../components/modals/CreditManagementModal'
import { Customer } from '../types'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, page],
    queryFn: () => customersApi.getCustomers({
      q: searchTerm,
      page,
      limit: 20
    }),
  })

  const customers = Array.isArray(customersData?.data) ? customersData.data : []

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }

  const handleManageCredit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCreditModalOpen(true)
  }

  const closeModals = () => {
    setEditModalOpen(false)
    setCreditModalOpen(false)
    setSelectedCustomer(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search customers..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Credit Balance</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                  <th>Last Purchase</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: any) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {customer.name}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {customer.email && (
                          <div>{customer.email}</div>
                        )}
                        {customer.phone && (
                          <div className="text-gray-500 dark:text-gray-400">{customer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        Number(customer.creditBalance) > 0
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        ${Number(customer.creditBalance).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {customer.purchaseCount || 0}
                    </td>
                    <td className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${Number(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="text-sm text-gray-900 dark:text-gray-100">
                      {customer.lastPurchaseDate 
                        ? new Date(customer.lastPurchaseDate).toLocaleDateString() 
                        : '-'
                      }
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded"
                          title="Edit customer"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleManageCredit(customer)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1 rounded"
                          title="Manage credit"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditCustomerModal
        isOpen={editModalOpen}
        onClose={closeModals}
        customer={selectedCustomer}
      />
      <CreditManagementModal
        isOpen={creditModalOpen}
        onClose={closeModals}
        customer={selectedCustomer}
      />
    </div>
  )
}