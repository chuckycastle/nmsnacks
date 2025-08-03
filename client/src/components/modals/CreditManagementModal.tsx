import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../../services/api'
import { Modal } from '../ui/Modal'
import { Customer } from '../../types'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

interface CreditManagementModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export function CreditManagementModal({ isOpen, onClose, customer }: CreditManagementModalProps) {
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const updateCreditMutation = useMutation({
    mutationFn: (data: { id: string; amount: number; operation: 'add' | 'subtract'; reason: string }) => 
      customersApi.updateCredit(data.id, data.amount, data.operation, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      setAmount('')
      setReason('')
      setErrors({})
    },
    onError: (error: any) => {
      console.error('Failed to update credit:', error)
      setErrors({ submit: 'Failed to update credit balance. Please try again.' })
    }
  })

  useEffect(() => {
    if (isOpen) {
      setOperation('add')
      setAmount('')
      setReason('')
      setErrors({})
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    // Basic validation
    const newErrors: Record<string, string> = {}
    const amountNum = parseFloat(amount)
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid positive amount'
    }
    
    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for this credit adjustment'
    }

    // Check if subtraction would result in negative balance
    if (operation === 'subtract' && customer.creditBalance && amountNum > Number(customer.creditBalance)) {
      newErrors.amount = 'Cannot subtract more than current credit balance'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateCreditMutation.mutate({
      id: customer.id,
      amount: amountNum,
      operation,
      reason: reason.trim()
    })
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }))
    }
  }

  const handleReasonChange = (value: string) => {
    setReason(value)
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: '' }))
    }
  }

  const currentBalance = customer ? Number(customer.creditBalance) || 0 : 0
  const amountNum = parseFloat(amount) || 0
  const newBalance = operation === 'add' 
    ? currentBalance + amountNum 
    : Math.max(0, currentBalance - amountNum)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Credit Balance">
      <div className="space-y-4">
        {customer && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Current Credit Balance: <span className="font-semibold text-green-600 dark:text-green-400">${currentBalance.toFixed(2)}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operation
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-900 dark:text-gray-100">
                <input
                  type="radio"
                  name="operation"
                  value="add"
                  checked={operation === 'add'}
                  onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')}
                  className="mr-2"
                />
                <PlusIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                Add Credit
              </label>
              <label className="flex items-center text-gray-900 dark:text-gray-100">
                <input
                  type="radio"
                  name="operation"
                  value="subtract"
                  checked={operation === 'subtract'}
                  onChange={(e) => setOperation(e.target.value as 'add' | 'subtract')}
                  className="mr-2"
                />
                <MinusIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                Subtract Credit
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`form-input pl-8 ${errors.amount ? 'border-red-500 dark:border-red-400' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            {errors.amount && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className={`form-input ${errors.reason ? 'border-red-500 dark:border-red-400' : ''}`}
              placeholder="Enter reason for credit adjustment..."
              rows={3}
              required
            />
            {errors.reason && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.reason}</p>}
          </div>

          {amountNum > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Preview:</span> New balance will be{' '}
                <span className={`font-semibold ${newBalance >= currentBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${newBalance.toFixed(2)}
                </span>
                {operation === 'add' ? (
                  <span className="text-green-600 dark:text-green-400"> (+${amountNum.toFixed(2)})</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400"> (-${amountNum.toFixed(2)})</span>
                )}
              </p>
            </div>
          )}

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
              disabled={updateCreditMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${operation === 'subtract' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              disabled={updateCreditMutation.isPending}
            >
              {updateCreditMutation.isPending ? 'Processing...' : 
                operation === 'add' ? 'Add Credit' : 'Subtract Credit'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}