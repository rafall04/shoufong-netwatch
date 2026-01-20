"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface RoomFormModalProps {
  isOpen: boolean
  onClose: () => void
  room?: {
    id: string
    name: string
    description: string | null
    color: string
  }
  onSuccess: (message: string, description: string) => void
  onError: (message: string, description: string) => void
}

export default function RoomFormModal({ 
  isOpen, 
  onClose, 
  room, 
  onSuccess,
  onError
}: RoomFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: room?.name || '',
    description: room?.description || '',
    color: room?.color || '#3b82f6'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Predefined color options
  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
  ]

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        description: room.description || '',
        color: room.color
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6'
      })
    }
  }, [room, isOpen])

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
      const url = room ? `/api/rooms/${room.id}` : '/api/rooms'
      const method = room ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSuccess(
          room ? 'Room Updated' : 'Room Created',
          room ? 'Room has been updated successfully.' : 'New room has been created successfully.'
        )
        onClose()
      } else {
        const data = await res.json()
        onError('Failed to Save Room', data.error || 'An error occurred while saving the room.')
      }
    } catch (error) {
      console.error('Error saving room:', error)
      onError('Failed to Save Room', 'An unexpected error occurred. Please try again.')
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
            className="relative bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">
                {room ? 'Edit Room' : 'Add New Room'}
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
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    placeholder="e.g., Server Room, Office"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Enter room description"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-full h-10 rounded-lg transition-all ${
                          formData.color === color.value
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm text-gray-600">Selected: {formData.color}</span>
                  </div>
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
                  {isSubmitting ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
