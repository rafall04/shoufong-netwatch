"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Router, Tablet, ScanBarcode, Tv, Pencil, Trash2, X } from "lucide-react"
import DeviceForm from "./DeviceForm"

interface Device {
  id: string
  name: string
  ip: string
  type: string
  laneName: string
  status: string
  lastSeen: Date | string | null
}

interface DeviceTableProps {
  devices: Device[]
  onUpdate?: () => void
}

export default function DeviceTable({ devices, onUpdate }: DeviceTableProps) {
  const router = useRouter()
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteType, setBulkDeleteType] = useState<'selected' | 'all'>('selected')

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "ROUTER":
        return <Router className="w-5 h-5" />
      case "TABLET":
        return <Tablet className="w-5 h-5" />
      case "SCANNER_GTEX":
        return <ScanBarcode className="w-5 h-5" />
      case "SMART_TV":
        return <Tv className="w-5 h-5" />
      default:
        return <Router className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
    
    switch (status.toLowerCase()) {
      case "up":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 border border-green-200`}>
            UP
          </span>
        )
      case "down":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 border border-red-200 animate-pulse`}>
            DOWN
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`}>
            UNKNOWN
          </span>
        )
    }
  }

  const handleEditClick = (device: Device) => {
    setEditingDevice(device)
  }

  const handleDeleteClick = (device: Device) => {
    setDeletingDevice(device)
    setDeleteError("")
  }

  const handleEditSuccess = () => {
    setEditingDevice(null)
    if (onUpdate) {
      onUpdate()
    } else {
      router.refresh()
    }
  }

  const handleEditCancel = () => {
    setEditingDevice(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDevice) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      const response = await fetch(`/api/devices/${deletingDevice.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const data = await response.json()
        setDeleteError(data.error || "Failed to delete device")
        setIsDeleting(false)
        return
      }

      // Success - close modal and refresh
      setDeletingDevice(null)
      setIsDeleting(false)
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      setDeleteError("An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeletingDevice(null)
    setDeleteError("")
  }

  const handleToggleDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices)
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId)
    } else {
      newSelected.add(deviceId)
    }
    setSelectedDevices(newSelected)
  }

  const handleToggleAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(devices.map(d => d.id)))
    }
  }

  const handleBulkDeleteClick = (type: 'selected' | 'all') => {
    setBulkDeleteType(type)
    setShowBulkDeleteModal(true)
    setDeleteError("")
  }

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true)
    setDeleteError("")

    try {
      const deviceIdsToDelete = bulkDeleteType === 'all' 
        ? devices.map(d => d.id)
        : Array.from(selectedDevices)

      if (deviceIdsToDelete.length === 0) {
        setDeleteError("No devices selected")
        setIsDeleting(false)
        return
      }

      // Delete devices one by one
      let successCount = 0
      let failCount = 0

      for (const deviceId of deviceIdsToDelete) {
        try {
          const response = await fetch(`/api/devices/${deviceId}`, {
            method: "DELETE"
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
        }
      }

      // Close modal and refresh
      setShowBulkDeleteModal(false)
      setIsDeleting(false)
      setSelectedDevices(new Set())
      
      if (failCount > 0) {
        alert(`Deleted ${successCount} device(s). Failed to delete ${failCount} device(s).`)
      }
      
      router.refresh()
    } catch (error) {
      setDeleteError("An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false)
    setDeleteError("")
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {devices.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDevices.size === devices.length && devices.length > 0}
                  onChange={handleToggleAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedDevices.size} of {devices.length} selected)
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkDeleteClick('selected')}
                disabled={selectedDevices.size === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedDevices.size})
              </button>
              <button
                onClick={() => handleBulkDeleteClick('all')}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete All ({devices.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === devices.length && devices.length > 0}
                    onChange={handleToggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                  IP Address
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                  Lane
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                  Last Seen
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 lg:px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Router className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">No devices found</p>
                      <p className="text-sm">Add your first device to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDevices.has(device.id)}
                        onChange={() => handleToggleDevice(device.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-700">
                        {getDeviceIcon(device.type)}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {device.name}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {device.ip} • {device.laneName}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-gray-900 font-mono">{device.ip}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{device.laneName}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(device.status)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {device.lastSeen
                        ? new Date(device.lastSeen).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 lg:gap-3">
                        <button
                          onClick={() => handleEditClick(device)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                          title="Edit device"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(device)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                          title="Delete device"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden lg:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Device</h2>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4">
              <DeviceForm
                device={editingDevice}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
            </div>
            <div className="px-6 py-4">
              {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this device?
              </p>
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-sm font-medium text-gray-900">{deletingDevice.name}</p>
                <p className="text-sm text-gray-600">{deletingDevice.ip}</p>
                <p className="text-sm text-gray-600">{deletingDevice.laneName}</p>
              </div>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Device"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Confirm Bulk Delete</h2>
            </div>
            <div className="px-6 py-4">
              {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}
              <p className="text-gray-700 mb-4">
                {bulkDeleteType === 'all' 
                  ? `Are you sure you want to delete ALL ${devices.length} devices?`
                  : `Are you sure you want to delete ${selectedDevices.size} selected device(s)?`
                }
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  ⚠️ Warning: This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {bulkDeleteType === 'all' ? (
                    <li>• All {devices.length} devices from the database</li>
                  ) : (
                    <>
                      <li>• {selectedDevices.size} selected device(s)</li>
                      <li className="text-xs mt-2 text-red-600">
                        {Array.from(selectedDevices).slice(0, 3).map(id => {
                          const device = devices.find(d => d.id === id)
                          return device ? `${device.name} (${device.ip})` : ''
                        }).filter(Boolean).join(', ')}
                        {selectedDevices.size > 3 && ` and ${selectedDevices.size - 3} more...`}
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-sm text-red-600 font-semibold">
                This action cannot be undone!
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={handleBulkDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed font-semibold"
              >
                {isDeleting ? "Deleting..." : `Delete ${bulkDeleteType === 'all' ? 'All' : selectedDevices.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
