import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'system', name: 'System', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors duration-200">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <ProfileSettings user={user} isLoading={isLoading} />
          )}
          {activeTab === 'system' && (
            <SystemSettings />
          )}
          {activeTab === 'security' && (
            <SecuritySettings />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ user, isLoading }: { user: any; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your account profile information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          />
        </div>

        <div>
          <label className="form-label">Role</label>
          <input
            type="text"
            className="form-input bg-gray-50 dark:bg-gray-700"
            value={user?.role || ''}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">System Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure system-wide settings and preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Low Stock Threshold</label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Alert when product stock falls below this number</p>
          </div>
          <input
            type="number"
            className="form-input w-20"
            defaultValue="10"
            min="1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Tax Rate (%)</label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Default tax rate for sales</p>
          </div>
          <input
            type="number"
            className="form-input w-20"
            defaultValue="8.5"
            min="0"
            step="0.1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Currency</label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Display currency</p>
          </div>
          <select className="form-input w-32">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account security and password.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Change Password</button>
      </div>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose what notifications you want to receive.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'low-stock', label: 'Low Stock Alerts', description: 'Get notified when products are running low' },
          { id: 'daily-reports', label: 'Daily Sales Reports', description: 'Receive daily sales summary emails' },
          { id: 'new-customers', label: 'New Customer Alerts', description: 'Get notified when new customers register' },
          { id: 'system-updates', label: 'System Updates', description: 'Receive notifications about system updates' },
        ].map((notification) => (
          <div key={notification.id} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.label}</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              defaultChecked
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Save Preferences</button>
      </div>
    </div>
  )
}