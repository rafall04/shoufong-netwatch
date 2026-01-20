'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

interface ConnectionEditModalProps {
  connection: {
    id: string
    sourceId: string
    targetId: string
    label?: string | null
    type: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
    animated: boolean
    edgeType: 'default' | 'straight' | 'step' | 'smoothstep'
    waypoints?: string | null
  }
  sourceDevice: { name: string; ip: string }
  targetDevice: { name: string; ip: string }
  onClose: () => void
  onSubmit: (data: {
    id: string
    label?: string
    type: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
    animated: boolean
    edgeType: 'default' | 'straight' | 'step' | 'smoothstep'
    waypoints?: Array<{ x: number; y: number }>
  }) => Promise<void>
}

export default function ConnectionEditModal({
  connection,
  sourceDevice,
  targetDevice,
  onClose,
  onSubmit
}: ConnectionEditModalProps) {
  // Parse initial waypoints
  const initialWaypoints = connection.waypoints 
    ? JSON.parse(connection.waypoints) 
    : []
  
  const [label, setLabel] = useState(connection.label || '')
  const [type, setType] = useState<'CABLE' | 'WIRELESS' | 'VIRTUAL'>(connection.type)
  const [animated, setAnimated] = useState(connection.animated)
  const [edgeType, setEdgeType] = useState<'default' | 'straight' | 'step' | 'smoothstep'>(connection.edgeType)
  const [waypoints, setWaypoints] = useState<Array<{ x: number; y: number }>>(initialWaypoints)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setIsSubmitting(true)
    try {
      await onSubmit({
        id: connection.id,
        label: label.trim() || undefined,
        type,
        animated,
        edgeType,
        waypoints: waypoints.length > 0 ? waypoints : undefined
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update connection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addWaypoint = () => {
    setWaypoints([...waypoints, { x: 0, y: 0 }])
  }

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index))
  }

  const updateWaypoint = (index: number, field: 'x' | 'y', value: string) => {
    const newWaypoints = [...waypoints]
    newWaypoints[index][field] = parseFloat(value) || 0
    setWaypoints(newWaypoints)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-auto md:max-w-lg bg-white rounded-none md:rounded-lg z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Connection</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="font-medium text-gray-700 mb-1">
              {sourceDevice.name} → {targetDevice.name}
            </div>
            <div className="text-xs text-gray-500">
              {sourceDevice.ip} → {targetDevice.ip}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Edge Type / Path Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEdgeType('default')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    edgeType === 'default'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Curved
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeType('straight')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    edgeType === 'straight'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Straight
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeType('step')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    edgeType === 'step'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Step (L-shape)
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeType('smoothstep')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    edgeType === 'smoothstep'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Smooth Step
                </button>
              </div>
            </div>

            {/* Waypoints */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Waypoints (Advanced)
                </label>
                <button
                  type="button"
                  onClick={addWaypoint}
                  className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Point
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Add intermediate points to create custom paths (L-shape, zigzag, etc.)
              </p>
              
              {waypoints.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {waypoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-xs font-medium text-gray-600 w-12">
                        Point {index + 1}
                      </span>
                      <input
                        type="number"
                        value={point.x}
                        onChange={(e) => updateWaypoint(index, 'x', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={point.y}
                        onChange={(e) => updateWaypoint(index, 'y', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Y"
                      />
                      <button
                        type="button"
                        onClick={() => removeWaypoint(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  No waypoints. Path will use selected style.
                </div>
              )}
            </div>

            {/* Animated */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="animated-edit"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="animated-edit" className="text-sm text-gray-700">
                Show animated flow
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
