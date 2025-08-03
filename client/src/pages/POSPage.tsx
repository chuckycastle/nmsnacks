import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, salesApi, customersApi } from '../services/api'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  XMarkIcon,
  UserIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  imageUrl?: string
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [customerSearch, setCustomerSearch] = useState('')
  const queryClient = useQueryClient()

  // Fetch products with search
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['pos-products', searchTerm],
    queryFn: () => productsApi.getProducts({ 
      q: searchTerm,
      inStock: true,
      limit: 20 
    }),
  })

  // Customer search
  const { data: customerResults } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: () => customersApi.searchCustomers(customerSearch),
    enabled: customerSearch.length >= 2,
  })

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: (saleData: any) => salesApi.createSale(saleData),
    onSuccess: (response) => {
      toast.success('Sale completed successfully!')
      setCart([])
      setSelectedCustomer(null)
      setSearchTerm('')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Sale failed')
    }
  })

  const addToCart = useCallback((product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id)
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error(`Only ${product.stock} items available`)
          return prevCart
        }
        return prevCart.map(item =>
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      return [...prevCart, {
        productId: product.id,
        name: product.name,
        price: Number(product.salePrice),
        quantity: 1,
        stock: product.stock,
        imageUrl: product.imageLink
      }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.productId !== productId))
      return
    }
    
    setCart(prevCart => 
      prevCart.map(item =>
        item.productId === productId 
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId))
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const processSale = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitSalePrice: item.price
      })),
      customerId: selectedCustomer?.id,
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : paymentMethod,
    }

    processSaleMutation.mutate(saleData)
  }

  const products = productsData?.data || []

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              className="form-input pl-10 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loadingProducts ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="pos-grid">
              {products.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart (Mobile: Full width, Desktop: Fixed width) */}
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Cart ({cartItemCount})
            </h2>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${cartTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="form-label">Customer (Optional)</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedCustomer.name}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                className="form-input text-base"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerResults?.data?.length > 0 && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1">
                  {customerResults.data.slice(0, 5).map((customer: any) => (
                    <button
                      key={customer.id}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors duration-200"
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setCustomerSearch('')
                      }}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                      {customer.creditBalance > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Credit: ${Number(customer.creditBalance).toFixed(2)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
              <ShoppingCartIcon className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-center">Add products to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cart.map((item) => (
                <CartItemComponent
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Payment Method & Checkout */}
        {cart.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 space-y-4">
            <div>
              <label className="form-label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`p-3 rounded-lg border-2 flex items-center justify-center transition-colors duration-200 ${
                    paymentMethod === 'cash' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <BanknotesIcon className="h-4 w-4 mr-1" />
                  Cash
                </button>
                <button
                  className={`p-3 rounded-lg border-2 flex items-center justify-center transition-colors duration-200 ${
                    paymentMethod === 'card' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCardIcon className="h-4 w-4 mr-1" />
                  Card
                </button>
              </div>
            </div>

            <button
              onClick={processSale}
              disabled={processSaleMutation.isPending}
              className="w-full btn-success text-lg py-3"
            >
              {processSaleMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                `Complete Sale - $${cartTotal.toFixed(2)}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, onAddToCart }: { product: any; onAddToCart: (product: any) => void }) {
  return (
    <div 
      className="product-card"
      onClick={() => onAddToCart(product)}
    >
      {product.imageLink && (
        <img
          src={product.imageLink}
          alt={product.name}
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
      )}
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-green-600 dark:text-green-400">
          ${Number(product.salePrice).toFixed(2)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {product.stock} in stock
        </span>
      </div>
    </div>
  )
}

function CartItemComponent({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem; 
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="cart-item">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200"
        >
          -
        </button>
        <span className="w-8 text-center font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={item.quantity >= item.stock}
        >
          +
        </button>
        <button
          onClick={() => onRemove(item.productId)}
          className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors duration-200"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}