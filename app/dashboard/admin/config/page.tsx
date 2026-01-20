'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, Wifi, Clock, Shield, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface SystemConfig {
  id: number
  pollingInterval: number
  mikrotikIp: string
  mikrotikUser: string
  mikrotikPass: string
  mikrotikPort: number
  defaultNetwatchTimeout: number
  defaultNetwatchInterval: number
  updatedAt: string
}

export default function SystemConfigPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const toast = useToast()
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{ 
    success: boolean
    message: string
    details?: any
  } | null>(null)
  
  const [formData, setFormData] = useState({
    pollingInterval: 30,
    mikrotikIp: '',
    mikrotikUser: '',
    mikrotikPass: '',
    mikrotikPort: 8728,
    defaultNetwatchTimeout: 1000,
    defaultNetwatchInterval: 5
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard/map')
      return
    }
    
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchConfig()
    }
  }, [status, session, router])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      
      if (!response.ok) {
        throw new Error('Failed to fetch configuration')
      }
      
      const data = await response.json()
      setConfig(data.config)
      setFormData({
        pollingInterval: data.config.pollingInterval,
        mikrotikIp: data.config.mikrotikIp,
        mikrotikUser: data.config.mikrotikUser,
        mikrotikPass: data.config.mikrotikPass,
        mikrotikPort: data.config.mikrotikPort,
        defaultNetwatchTimeout: data.config.defaultNetwatchTimeout,
        defaultNetwatchInterval: data.config.defaultNetwatchInterval
      })
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Failed to Load', 'Could not load configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.pollingInterval || formData.pollingInterval <= 0) {
      newErrors.pollingInterval = 'Polling interval must be a positive number'
    } else if (!Number.isInteger(formData.pollingInterval)) {
      newErrors.pollingInterval = 'Polling interval must be an integer'
    }
    
    if (formData.mikrotikPort && (formData.mikrotikPort <= 0 || formData.mikrotikPort > 65535)) {
      newErrors.mikrotikPort = 'Port must be between 1 and 65535'
    }
    
    if (!formData.defaultNetwatchTimeout || formData.defaultNetwatchTimeout < 100 || formData.defaultNetwatchTimeout > 10000) {
      newErrors.defaultNetwatchTimeout = 'Timeout must be between 100ms and 10000ms'
    }
    
    if (!formData.defaultNetwatchInterval || formData.defaultNetwatchInterval < 5 || formData.defaultNetwatchInterval > 3600) {
      newErrors.defaultNetwatchInterval = 'Interval must be between 5s and 3600s'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Validation Error', 'Please check all fields and try again.')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update configuration')
      }
      
      const data = await response.json()
      setConfig(data.config)
      toast.success('Configuration Saved', 'System configuration has been updated successfully.')
    } catch (error) {
      console.error('Error updating config:', error)
      toast.error('Save Failed', error instanceof Error ? error.message : 'Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Convert to number for numeric fields
    const processedValue = ['pollingInterval', 'mikrotikPort', 'defaultNetwatchTimeout', 'defaultNetwatchInterval'].includes(name)
      ? parseInt(value) || 0
      : value
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    
    // Clear connection status when config changes
    if (connectionStatus) {
      setConnectionStatus(null)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setConnectionStatus(null)
    
    try {
      const response = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setConnectionStatus(data)
        if (data.success) {
          let details = 'Connection established successfully'
          if (data.details) {
            if (data.details.identity) details += ` to ${data.details.identity}`
            if (data.details.version) details += ` (${data.details.version})`
          }
          toast.success('Connection Successful', details)
        } else {
          const errorText = data.details 
            ? `${data.error}: ${data.details}` 
            : data.error || 'Connection test failed'
          toast.error('Connection Failed', errorText)
        }
      } else {
        const errorText = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to test connection'
        toast.error('Connection Failed', errorText)
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast.error('Connection Error', 'Failed to test connection. Please check your network.')
    } finally {
      setTesting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">System Configuration</h1>
            </div>
            <p className="text-gray-600">Configure MikroTik connection and monitoring settings</p>
          </div>

        {/* Main Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* MikroTik Connection Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">MikroTik Connection</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="mikrotikIp" className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="mikrotikIp"
                  name="mikrotikIp"
                  value={formData.mikrotikIp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                  placeholder="192.168.1.1"
                />
                {errors.mikrotikIp && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.mikrotikIp}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="mikrotikUser" className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="mikrotikUser"
                  name="mikrotikUser"
                  value={formData.mikrotikUser}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="admin"
                />
                {errors.mikrotikUser && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.mikrotikUser}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="mikrotikPass" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="mikrotikPass"
                  name="mikrotikPass"
                  value={formData.mikrotikPass}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                {errors.mikrotikPass && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.mikrotikPass}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="mikrotikPort" className="block text-sm font-medium text-gray-700 mb-1">
                  API Port
                </label>
                <input
                  type="number"
                  id="mikrotikPort"
                  name="mikrotikPort"
                  value={formData.mikrotikPort}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="8728"
                  min="1"
                  max="65535"
                />
                {errors.mikrotikPort && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.mikrotikPort}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pollingInterval" className="block text-sm font-medium text-gray-700 mb-1">
                  Polling Interval (seconds)
                </label>
                <input
                  type="number"
                  id="pollingInterval"
                  name="pollingInterval"
                  value={formData.pollingInterval}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="30"
                  min="1"
                />
                {errors.pollingInterval && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.pollingInterval}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  How often to poll MikroTik for status updates
                </p>
              </div>
            </div>
          </div>

          {/* Default Netwatch Configuration Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Default Netwatch Settings</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Default values for new devices added to MikroTik Netwatch
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="defaultNetwatchTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (milliseconds)
                </label>
                <input
                  type="number"
                  id="defaultNetwatchTimeout"
                  name="defaultNetwatchTimeout"
                  value={formData.defaultNetwatchTimeout}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="1000"
                  min="100"
                  max="10000"
                  step="100"
                />
                {errors.defaultNetwatchTimeout && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.defaultNetwatchTimeout}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Response timeout (100-10000ms)
                </p>
              </div>

              <div>
                <label htmlFor="defaultNetwatchInterval" className="block text-sm font-medium text-gray-700 mb-1">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  id="defaultNetwatchInterval"
                  name="defaultNetwatchInterval"
                  value={formData.defaultNetwatchInterval}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="5"
                  min="5"
                  max="3600"
                  step="5"
                />
                {errors.defaultNetwatchInterval && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span> {errors.defaultNetwatchInterval}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Check interval (5-3600s)
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Recommended Settings
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Fast (1000ms / 5s):</strong> Quick detection for critical devices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Balanced (2000ms / 30s):</strong> Standard monitoring for most devices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Conservative (3000ms / 60s):</strong> Low network load, slower detection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>
              
              <button
                type="submit"
                disabled={saving || testing}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Last Updated Info */}
        {config && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date(config.updatedAt).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
        </div>
      </div>
    </>
  )
}
