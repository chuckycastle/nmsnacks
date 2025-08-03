import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../../services/api'
import { Modal } from '../ui/Modal'
import { Customer } from '../../types'

interface EditCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export function EditCustomerModal({ isOpen, onClose, customer }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    creditBalance: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const updateCustomerMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => 
      customersApi.updateCustomer(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      setErrors({})
    },
    onError: (error: any) => {
      console.error('Failed to update customer:', error)
      setErrors({ submit: 'Failed to update customer. Please try again.' })
    }
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        creditBalance: Number(customer.creditBalance) || 0
      })
    }
    setErrors({})
  }, [customer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }
    if (formData.creditBalance < 0) {
      newErrors.creditBalance = 'Credit balance cannot be negative'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateCustomerMutation.mutate({
      id: customer.id,
      updates: {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        creditBalance: formData.creditBalance
      }
    })
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="form-label">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`form-input ${errors.name ? 'border-red-500 dark:border-red-400' : ''}`}
            placeholder="Customer name"
            required
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`form-input ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
            placeholder="customer@example.com"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="form-label">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`form-input ${errors.phone ? 'border-red-500 dark:border-red-400' : ''}`}
            placeholder="+1234567890"
          />
          {errors.phone && <p className="form-error">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="creditBalance" className="form-label">
            Credit Balance
          </label>
          <input
            type="number"
            id="creditBalance"
            value={formData.creditBalance}
            onChange={(e) => handleChange('creditBalance', parseFloat(e.target.value) || 0)}
            className={`form-input ${errors.creditBalance ? 'border-red-500 dark:border-red-400' : ''}`}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          {errors.creditBalance && <p className="form-error">{errors.creditBalance}</p>}
        </div>

        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-600 dark:text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={updateCustomerMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={updateCustomerMutation.isPending}
          >
            {updateCustomerMutation.isPending ? 'Updating...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}