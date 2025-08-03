import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import ThemeToggle from '../components/ui/ThemeToggle'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password')
      return
    }

    setIsLoading(true)
    try {
      await login(username.trim(), password)
    } catch (error) {
      // Error is handled in AuthContext with toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.4-1.2M7 13l2.4 1.2M17 17h2a2 2 0 002-2V7a2 2 0 00-2-2h-2M17 17v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4M17 17H7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">NMSnacks POS</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Demo credentials info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Admin:</strong> username=admin, password=Admin123!</p>
              <p><strong>Seller:</strong> username=seller1, password=Seller123!</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}