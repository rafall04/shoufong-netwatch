"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Download, CheckCircle } from "lucide-react"

interface MikroTikDevice {
  name: string
  ip: string
  type: string
  status: string
}

export default function SyncDevicesClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [devices, setDevices] = useState<MikroTikDevice[]>([])
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFetchDevices = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/mikrotik/sync-devices')
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        const errorText = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to fetch devices from MikroTik'
        setMessage({ type: 'error', text: errorText })
        setDevices([])
        return
      }
      
      setDevices(data.devices || [])
      // Select all by default
      setSelectedDevices(new Set(data.devices.map((d: MikroTikDevice) => d.ip)))
      
      if (data.devices.length > 0) {
        setMessage({ type: 'success', text: data.message })
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to connect to server. Please check your network connection and try again.' 
      })
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDevice = (ip: string) => {
    const newSelected = new Set(selectedDevices)
    if (newSelected.has(ip)) {
      newSelected.delete(ip)
    } else {
      newSelected.add(ip)
    }
    setSelectedDevices(newSelected)
  }

  const handleToggleAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(devices.map(d => d.ip)))
    }
  }

  const handleImport = async () => {
    if (selectedDevices.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one device to import' })
      return
    }

    setImporting(true)
    setMessage(null)
    
    try {
      const devicesToImport = devices.filter(d => selectedDevices.has(d.ip))
      
      const response = await fetch('/api/mikrotik/sync-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ devices: devicesToImport })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        const errorText = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to import devices'
        setMessage({ type: 'error', text: errorText })
        return
      }
      
      // Show success message with import summary
      const successText = data.skipped > 0
        ? `Successfully imported ${data.imported} device${data.imported !== 1 ? 's' : ''}. Skipped ${data.skipped} duplicate${data.skipped !== 1 ? 's' : ''}.`
        : `Successfully imported ${data.imported} device${data.imported !== 1 ? 's' : ''}!`
      
      setMessage({ type: 'success', text: successText })
      
      // Redirect after successful import
      setTimeout(() => {
        router.push('/dashboard/manage/devices')
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error importing devices:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to import devices. Please check your network connection and try again.' 
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">MikroTik Netwatch Devices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fetch and import devices from your MikroTik router
            </p>
          </div>
          <button
            onClick={handleFetchDevices}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching...' : 'Fetch Devices'}
          </button>
        </div>

        {devices.length > 0 && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDevices.size === devices.length}
                  onChange={handleToggleAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedDevices.size} of {devices.length} selected)
                </span>
              </label>
            </div>

            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {devices.map((device) => (
                <label
                  key={device.ip}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDevices.has(device.ip)}
                    onChange={() => handleToggleDevice(device.ip)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{device.name}</div>
                    <div className="text-sm text-gray-600">
                      {device.ip} • {device.type}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    device.status === 'up' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {device.status.toUpperCase()}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/dashboard/manage/devices')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedDevices.size === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {importing ? 'Importing...' : `Import ${selectedDevices.size} Device${selectedDevices.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {!loading && devices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No devices fetched yet</p>
            <p className="text-sm mt-2">Click "Fetch Devices" to load devices from MikroTik</p>
          </div>
        )}
      </div>
    </div>
  )
}
