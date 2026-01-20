"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    id: string
    username: string
    name: string
    role: string
  }
  onSuccess: (message: string, description: string) => void
  onError: (message: string, description: string) => void
}

export default function UserFormModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess,
  onError
}: UserFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    name: user?.name || '',
    role: user?.role || 'VIEWER'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role
      })
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'VIEWER'
      })
    }
  }, [user, isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSuccess(
          user ? 'User Updated' : 'User Created',
          user ? 'User has been updated successfully.' : 'New user has been created successfully.'
        )
        onClose()
      } else {
        const data = await res.json()
        onError('Failed to Save User', data.error || 'An error occurred while saving the user.')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      onError('Failed to Save User', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">
                {user ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    required
                    disabled={!!user}
                    placeholder="Enter username"
                  />
                  {user && (
                    <p className="text-xs text-gray-500">Username cannot be changed</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password {user && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                    {!user && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required={!user}
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="VIEWER">Viewer (Read Only)</option>
                    <option value="OPERATOR">Operator (Can Edit)</option>
                    <option value="ADMIN">Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
