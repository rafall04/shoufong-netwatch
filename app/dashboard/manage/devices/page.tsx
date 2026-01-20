'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DeviceTable from "@/components/DeviceTable"
import DeviceFormModal from "@/components/DeviceFormModal"
import { Plus, RefreshCw } from "lucide-react"

interface Device {
  id: string
  name: string
  ip: string
  type: string
  laneName: string
  status: string
  lastSeen: Date | string | null
  roomId?: string | null
  netwatchTimeout?: number
  netwatchInterval?: number
  netwatchUpScript?: string | null
  netwatchDownScript?: string | null
}

export default function DevicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated') {
      const canManage = session?.user?.role === 'ADMIN' || session?.user?.role === 'OPERATOR'
      if (!canManage) {
        router.push('/dashboard/map')
        return
      }
      
      fetchDevices()
    }
  }, [status, session, router])

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices')
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchDevices()
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

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OPERATOR')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-1">Manage your network devices and monitor their status</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/manage/devices/sync"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 lg:px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
              title="Sync from MikroTik"
            >
              <RefreshCw className="w-4 h-4" />
              Sync from MikroTik
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 lg:px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
              title="Add Device"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          </div>
        </div>

        <DeviceTable devices={devices} onUpdate={fetchDevices} />
      </div>

      {/* Device Form Modal */}
      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
