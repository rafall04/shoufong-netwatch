'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'

interface Device {
  id: string
  name: string
  ip: string
  status: string
}

interface ConnectionFormModalProps {
  devices: Device[]
  onClose: () => void
  onSubmit: (data: {
    sourceId: string
    targetId: string
    label?: string
    type: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
    animated: boolean
  }) => Promise<void>
  preselectedSourceId?: string
}

export default function ConnectionFormModal({
  devices,
  onClose,
  onSubmit,
  preselectedSourceId
}: ConnectionFormModalProps) {
  const [sourceId, setSourceId] = useState(preselectedSourceId || '')
  const [targetId, setTargetId] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'CABLE' | 'WIRELESS' | 'VIRTUAL'>('CABLE')
  const [animated, setAnimated] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!sourceId || !targetId) {
      setError('Please select both source and target devices')
      return
    }

    if (sourceId === targetId) {
      setError('Source and target must be different devices')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        sourceId,
        targetId,
        label: label.trim() || undefined,
        type,
        animated
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create connection')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-auto md:max-w-md bg-white rounded-none md:rounded-lg z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Connection</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Device */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Device <span className="text-red-500">*</span>
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={!!preselectedSourceId}
              >
                <option value="">Select source device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.ip})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Device */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Device <span className="text-red-500">*</span>
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Select target device</option>
                {devices
                  .filter(d => d.id !== sourceId)
                  .map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.ip})
                    </option>
                  ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label (Optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Fiber, Cat6, WiFi"
                maxLength={50}
              />
            </div>

            {/* Connection Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('CABLE')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'CABLE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cable
                </button>
                <button
                  type="button"
                  onClick={() => setType('WIRELESS')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'WIRELESS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Wireless
                </button>
                <button
                  type="button"
                  onClick={() => setType('VIRTUAL')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === 'VIRTUAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Virtual
                </button>
              </div>
            </div>

            {/* Animated */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="animated"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="animated" className="text-sm text-gray-700">
                Show animated flow (recommended for active connections)
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Connection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
