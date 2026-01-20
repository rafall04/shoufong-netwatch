'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Map, 
  Database, 
  Settings, 
  User, 
  LogOut,
  Home,
  Users,
  Building,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  user: {
    name?: string | null
    role?: string | null
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Auto-collapse on mobile - safe for SSR
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    
    // Set initial state
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Map',
        href: '/dashboard/map',
        icon: Map,
        roles: ['ADMIN', 'OPERATOR', 'VIEWER']
      },
      {
        name: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        roles: ['ADMIN', 'OPERATOR', 'VIEWER']
      }
    ]

    const adminOperatorItems = [
      {
        name: 'Devices',
        href: '/dashboard/manage/devices',
        icon: Database,
        roles: ['ADMIN', 'OPERATOR']
      },
      {
        name: 'Rooms',
        href: '/dashboard/admin/rooms',
        icon: Building,
        roles: ['ADMIN', 'OPERATOR']
      }
    ]

    const adminOnlyItems = [
      {
        name: 'Config',
        href: '/dashboard/admin/config',
        icon: Settings,
        roles: ['ADMIN']
      },
      {
        name: 'Users',
        href: '/dashboard/admin/users',
        icon: Users,
        roles: ['ADMIN']
      }
    ]

    return [...baseItems, ...adminOperatorItems, ...adminOnlyItems]
      .filter(item => item.roles.includes(user.role || 'VIEWER'))
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      {/* Mobile Menu Button - Positioned to avoid Controls */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle Menu"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isCollapsed ? 'w-16' : 'w-64'}
          bg-white shadow-lg flex flex-col min-h-screen transition-all duration-300 ease-in-out
          fixed md:relative z-40
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <Home className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <h1 className="text-base font-semibold text-gray-900 leading-tight whitespace-nowrap">
                MikroTik Dashboard
              </h1>
            )}
          </div>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {user.role || 'VIEWER'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className={`
              flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 w-full transition-all duration-200 group
            `}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  )
}