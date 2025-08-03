import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCartIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Sales', href: '/sales', icon: BanknotesIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout()
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transform ease-in-out duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow transition-colors duration-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {navigation.find(item => item.href === location.pathname)?.name || 'NMSnacks POS'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center space-x-2 md:ml-6">
              <ThemeToggle />
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.toLowerCase()}</span>
                  </div>
                  <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )

  function SidebarContent() {
    return (
      <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="h-8 w-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
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
            <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-gray-100">NMSnacks</span>
          </div>
          
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 transition-colors ${
                      isActive 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div>
              <UserCircleIcon className="inline-block h-9 w-9 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                {user?.role.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}