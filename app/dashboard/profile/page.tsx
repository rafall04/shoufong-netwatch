'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Lock, Shield } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface ValidationErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const toast = useToast()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if not authenticated (only after loading completes)
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate current password
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters'
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasErrors = validateForm()
    if (hasErrors) {
      toast.error('Validation Error', 'Please check all fields and try again.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 400 && result.error === 'Invalid current password') {
          setErrors({ currentPassword: 'Current password is incorrect' })
          toast.error('Invalid Password', 'Current password is incorrect.')
        } else {
          toast.error('Update Failed', 'Failed to update password. Please try again.')
        }
        return
      }

      toast.success('Password Updated', 'Your password has been changed successfully.')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Update Failed', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile Settings</h1>
          </div>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage your account information and security</p>
        </div>
        
        <div className="bg-white border rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <span className="text-sm text-gray-900">{session.user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">Role</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                session.user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                session.user?.role === 'OPERATOR' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {session.user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.currentPassword}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.newPassword}
                </p>
              )}
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 md:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </>
  )
}