import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {showLabel && <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Dark</span>}
        </>
      ) : (
        <>
          <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {showLabel && <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>}
        </>
      )}
    </button>
  )
}