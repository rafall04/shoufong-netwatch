'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Trash2, Edit2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import UserFormModal from '@/components/UserFormModal'

interface User {
  id: string
  username: string
  name: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard/map')
      return
    }
    
    // Fetch users only if authenticated and admin
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (message: string, description: string) => {
    toast.success(message, description)
    fetchUsers()
  }

  const handleError = (message: string, description: string) => {
    toast.error(message, description)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchUsers()
        toast.success('User Deleted', 'User has been deleted successfully.')
      } else {
        const data = await res.json()
        toast.error('Failed to Delete User', data.error || 'An error occurred while deleting the user.')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to Delete User', 'An unexpected error occurred. Please try again.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
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
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
            </div>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 md:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
            title="Add User"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

      {/* Users Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'OPERATOR' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                    title="Edit User"
                    aria-label="Edit User"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete User"
                    aria-label="Delete User"
                    disabled={user.id === session?.user?.id}
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No users found</p>
          </div>
        )}
      </div>
        </div>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={editingUser || undefined}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  )
}
