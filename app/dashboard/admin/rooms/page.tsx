'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Home, Plus, Trash2, Edit2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import RoomFormModal from '@/components/RoomFormModal'

interface Room {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  _count?: {
    devices: number
  }
}

export default function RoomsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // Redirect if not admin/operator
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'VIEWER') {
      router.push('/dashboard/map')
    }
  }, [session, status, router])

  // Fetch rooms
  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (message: string, description: string) => {
    toast.success(message, description)
    fetchRooms()
  }

  const handleError = (message: string, description: string) => {
    toast.error(message, description)
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingRoom(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRoom(null)
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure? Devices in this room will not be deleted.')) return

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchRooms()
        toast.success('Room Deleted', 'Room has been deleted successfully.')
      } else {
        const data = await res.json()
        toast.error('Failed to Delete Room', data.error || 'An error occurred while deleting the room.')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to Delete Room', 'An unexpected error occurred. Please try again.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (session?.user?.role === 'VIEWER') {
    return null
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Room Management</h1>
            </div>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Organize devices by rooms and locations</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 md:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
            title="Add Room"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: room.color }}
                ></div>
                <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(room)}
                  className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                  title="Edit Room"
                  aria-label="Edit Room"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="text-red-600 hover:text-red-800 p-1 transition-colors"
                  title="Delete Room"
                  aria-label="Delete Room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {room.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>
            )}
            
            <div className="text-xs text-gray-500">
              {room._count?.devices || 0} device(s)
            </div>
          </div>
        ))}
      </div>
      
      {rooms.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm md:text-base">No rooms yet. Create your first room!</p>
        </div>
      )}
      </div>
      </div>

      {/* Room Form Modal */}
      <RoomFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        room={editingRoom || undefined}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  )
}
