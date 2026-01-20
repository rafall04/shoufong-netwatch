"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface DeviceFormProps {
  device?: {
    id: string
    name: string
    ip: string
    type: string
    laneName: string
    roomId?: string | null
    netwatchTimeout?: number
    netwatchInterval?: number
    netwatchUpScript?: string | null
    netwatchDownScript?: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export default function DeviceForm({ device, onSuccess, onCancel }: DeviceFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: device?.name || "",
    ip: device?.ip || "",
    type: device?.type || "ROUTER",
    laneName: device?.laneName || "",
    roomId: device?.roomId || "",
    netwatchTimeout: device?.netwatchTimeout || 1000,
    netwatchInterval: device?.netwatchInterval || 5,
    netwatchUpScript: device?.netwatchUpScript || "",
    netwatchDownScript: device?.netwatchDownScript || ""
  })
  const [syncToMikrotik, setSyncToMikrotik] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([])

  // Fetch rooms and system config on mount
  useEffect(() => {
    // Fetch rooms
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.rooms) {
          setRooms(data.rooms)
        }
      })
      .catch(err => console.error('Failed to fetch rooms:', err))
    
    // Fetch system config for default values (only for new devices)
    if (!device) {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setFormData(prev => ({
              ...prev,
              netwatchTimeout: data.config.defaultNetwatchTimeout || 1000,
              netwatchInterval: data.config.defaultNetwatchInterval || 5
            }))
          }
        })
        .catch(err => console.error('Failed to fetch system config:', err))
    }
  }, [device])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Device name is required"
    }

    if (!formData.ip.trim()) {
      newErrors.ip = "IP address is required"
    } else {
      // Basic IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipRegex.test(formData.ip)) {
        newErrors.ip = "Please enter a valid IP address"
      } else {
        // Check each octet is 0-255
        const octets = formData.ip.split(".")
        if (octets.some(octet => parseInt(octet) > 255)) {
          newErrors.ip = "IP address octets must be between 0 and 255"
        }
      }
    }

    if (!formData.type) {
      newErrors.type = "Device type is required"
    }

    if (!formData.laneName.trim()) {
      newErrors.laneName = "Lane name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = device
        ? `/api/devices/${device.id}`
        : "/api/devices"
      
      const method = device ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          syncToMikrotik: !device && syncToMikrotik // Only for new devices
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorText = data.error || "Failed to save device"
        setSubmitError(errorText)
        setIsSubmitting(false)
        return
      }

      // Check for warnings (e.g., device created but MikroTik sync failed)
      if (data.warning) {
        // Show warning but still consider it a success
        alert(`⚠️ ${data.warning}`)
      }

      // Success
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/manage/devices")
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving device:', error)
      setSubmitError("Failed to save device. Please check your network connection and try again.")
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          Device Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.name ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
          }`}
          placeholder="e.g., Main Router"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-4 h-4 text-red-500">⚠</span>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="ip" className="block text-sm font-semibold text-gray-700 mb-2">
          IP Address *
        </label>
        <input
          type="text"
          id="ip"
          name="ip"
          value={formData.ip}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono ${
            errors.ip ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
          }`}
          placeholder="e.g., 192.168.1.1"
        />
        {errors.ip && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-4 h-4 text-red-500">⚠</span>
            {errors.ip}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
          Device Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.type ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
          }`}
        >
          <option value="ROUTER">Router</option>
          <option value="SWITCH">Switch</option>
          <option value="ACCESS_POINT">Access Point</option>
          <option value="PC">PC / Desktop</option>
          <option value="LAPTOP">Laptop</option>
          <option value="TABLET">Tablet</option>
          <option value="PRINTER">Printer</option>
          <option value="SCANNER_GTEX">Scanner (GTEX)</option>
          <option value="SMART_TV">Smart TV</option>
          <option value="CCTV">CCTV Camera</option>
          <option value="SERVER">Server</option>
          <option value="PHONE">Phone / Smartphone</option>
          <option value="OTHER">Other Device</option>
        </select>
        {errors.type && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-4 h-4 text-red-500">⚠</span>
            {errors.type}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="laneName" className="block text-sm font-semibold text-gray-700 mb-2">
          Lane Name *
        </label>
        <input
          type="text"
          id="laneName"
          name="laneName"
          value={formData.laneName}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.laneName ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
          }`}
          placeholder="e.g., Lane A"
        />
        {errors.laneName && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="w-4 h-4 text-red-500">⚠</span>
            {errors.laneName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="roomId" className="block text-sm font-semibold text-gray-700 mb-2">
          Room (Optional)
        </label>
        <select
          id="roomId"
          name="roomId"
          value={formData.roomId}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="">No Room</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Assign this device to a room for better organization
        </p>
      </div>

      {/* Advanced Netwatch Configuration */}
      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
        >
          <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          Advanced Netwatch Configuration
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="netwatchTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  id="netwatchTimeout"
                  name="netwatchTimeout"
                  value={formData.netwatchTimeout}
                  onChange={handleChange}
                  min="100"
                  max="10000"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Time to wait for ICMP response (100-10000ms, default: 1000ms)
                </p>
              </div>

              <div>
                <label htmlFor="netwatchInterval" className="block text-sm font-medium text-gray-700 mb-2">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  id="netwatchInterval"
                  name="netwatchInterval"
                  value={formData.netwatchInterval}
                  onChange={handleChange}
                  min="5"
                  max="3600"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Check interval (5-3600s, default: 5s)
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="netwatchUpScript" className="block text-sm font-medium text-gray-700 mb-2">
                Up Script (Optional)
              </label>
              <textarea
                id="netwatchUpScript"
                name="netwatchUpScript"
                value={formData.netwatchUpScript}
                onChange={handleChange}
                rows={2}
                placeholder=":log info &quot;Device $name is UP&quot;"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                MikroTik script to execute when device comes online
              </p>
            </div>

            <div>
              <label htmlFor="netwatchDownScript" className="block text-sm font-medium text-gray-700 mb-2">
                Down Script (Optional)
              </label>
              <textarea
                id="netwatchDownScript"
                name="netwatchDownScript"
                value={formData.netwatchDownScript}
                onChange={handleChange}
                rows={2}
                placeholder=":log warning &quot;Device $name is DOWN&quot;"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                MikroTik script to execute when device goes offline
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 MikroTik Netwatch - ICMP Only</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                <li><strong>Timeout:</strong> Lower values detect failures faster but may cause false positives</li>
                <li><strong>Interval:</strong> Shorter intervals provide real-time monitoring but increase network traffic</li>
                <li><strong>Check Method:</strong> Uses ICMP ping (standard MikroTik Netwatch)</li>
                <li><strong>Scripts:</strong> Use MikroTik scripting language for automation (optional)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {!device && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={syncToMikrotik}
              onChange={(e) => setSyncToMikrotik(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                Add to MikroTik Netwatch
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Enable this to automatically add this device to MikroTik Netwatch for monitoring. 
                If disabled, the device will only be tracked in the dashboard database.
              </div>
              <div className="text-xs text-blue-700 mt-2 font-medium">
                ℹ️ Requires MikroTik configuration in System Settings
              </div>
            </div>
          </label>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:scale-105"
        >
          {isSubmitting ? "Saving..." : device ? "Update Device" : "Create Device"}
        </button>
      </div>
    </form>
  )
}
