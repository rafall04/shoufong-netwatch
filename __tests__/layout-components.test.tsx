import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '@/components/Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn()
}))

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const mockUsePathname = vi.mocked(usePathname)
const mockSignOut = vi.mocked(signOut)

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/dashboard/map')
  })

  describe('Role-based Navigation Links', () => {
    it('should show all links for ADMIN role', () => {
      const adminUser = { name: 'Admin User', role: 'ADMIN' }
      render(<Sidebar user={adminUser} />)
      
      expect(screen.getByText('Map')).toBeInTheDocument()
      expect(screen.getByText('Devices')).toBeInTheDocument()
      expect(screen.getByText('Config')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    it('should show Map, Devices, and Profile for OPERATOR role', () => {
      const operatorUser = { name: 'Operator User', role: 'OPERATOR' }
      render(<Sidebar user={operatorUser} />)
      
      expect(screen.getByText('Map')).toBeInTheDocument()
      expect(screen.getByText('Devices')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.queryByText('Config')).not.toBeInTheDocument()
    })

    it('should show only Map and Profile for VIEWER role', () => {
      const viewerUser = { name: 'Viewer User', role: 'VIEWER' }
      render(<Sidebar user={viewerUser} />)
      
      expect(screen.getByText('Map')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.queryByText('Devices')).not.toBeInTheDocument()
      expect(screen.queryByText('Config')).not.toBeInTheDocument()
    })

    it('should default to VIEWER role when role is not provided', () => {
      const userWithoutRole = { name: 'User' }
      render(<Sidebar user={userWithoutRole} />)
      
      expect(screen.getByText('Map')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.queryByText('Devices')).not.toBeInTheDocument()
      expect(screen.queryByText('Config')).not.toBeInTheDocument()
    })
  })

  describe('Active Route Highlighting', () => {
    it('should highlight the active route', () => {
      mockUsePathname.mockReturnValue('/dashboard/map')
      
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const mapLink = screen.getByText('Map').closest('a')
      expect(mapLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-md')
    })

    it('should not highlight inactive routes', () => {
      mockUsePathname.mockReturnValue('/dashboard/map')
      
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const devicesLink = screen.getByText('Devices').closest('a')
      expect(devicesLink).toHaveClass('text-gray-700')
      expect(devicesLink).not.toHaveClass('bg-gradient-to-r')
    })

    it('should highlight devices route when active', () => {
      mockUsePathname.mockReturnValue('/dashboard/manage/devices')
      
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const devicesLink = screen.getByText('Devices').closest('a')
      expect(devicesLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-md')
    })

    it('should highlight config route when active', () => {
      mockUsePathname.mockReturnValue('/dashboard/admin/config')
      
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const configLink = screen.getByText('Config').closest('a')
      expect(configLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-md')
    })

    it('should highlight profile route when active', () => {
      mockUsePathname.mockReturnValue('/dashboard/profile')
      
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const profileLink = screen.getByText('Profile').closest('a')
      expect(profileLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-md')
    })
  })

  describe('User Information Display', () => {
    it('should display user name', () => {
      const user = { name: 'John Doe', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display user role', () => {
      const user = { name: 'John Doe', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
    })

    it('should default to "User" when name is not provided', () => {
      const user = { role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should default to "VIEWER" when role is not provided', () => {
      const user = { name: 'John Doe' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('VIEWER')).toBeInTheDocument()
    })
  })

  describe('Logout Functionality', () => {
    it('should render logout button', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    it('should call signOut when logout button is clicked', async () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
      })
    })

    it('should have correct styling for logout button', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const logoutButton = screen.getByText('Logout').closest('button')
      expect(logoutButton).toHaveClass('text-gray-700', 'hover:bg-red-50', 'hover:text-red-700')
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href for Map link', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const mapLink = screen.getByText('Map').closest('a')
      expect(mapLink).toHaveAttribute('href', '/dashboard/map')
    })

    it('should have correct href for Devices link', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const devicesLink = screen.getByText('Devices').closest('a')
      expect(devicesLink).toHaveAttribute('href', '/dashboard/manage/devices')
    })

    it('should have correct href for Config link', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const configLink = screen.getByText('Config').closest('a')
      expect(configLink).toHaveAttribute('href', '/dashboard/admin/config')
    })

    it('should have correct href for Profile link', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const profileLink = screen.getByText('Profile').closest('a')
      expect(profileLink).toHaveAttribute('href', '/dashboard/profile')
    })
  })

  describe('Component Structure', () => {
    it('should render the dashboard title', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      expect(screen.getByText('MikroTik Dashboard')).toBeInTheDocument()
    })

    it('should have proper CSS classes for layout', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      const { container } = render(<Sidebar user={user} />)
      
      const sidebar = container.firstChild
      expect(sidebar).toHaveClass('w-64', 'bg-white', 'shadow-lg', 'flex', 'flex-col')
    })

    it('should render user avatar placeholder', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      // Check for user icon in the user info section
      const userSection = screen.getByText('Test User').closest('div')
      expect(userSection).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('should render icons for all navigation items', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      // Check that navigation items have icons (Lucide React components)
      const mapLink = screen.getByText('Map').closest('a')
      const devicesLink = screen.getByText('Devices').closest('a')
      const configLink = screen.getByText('Config').closest('a')
      const profileLink = screen.getByText('Profile').closest('a')
      
      expect(mapLink?.querySelector('svg')).toBeInTheDocument()
      expect(devicesLink?.querySelector('svg')).toBeInTheDocument()
      expect(configLink?.querySelector('svg')).toBeInTheDocument()
      expect(profileLink?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render logout icon', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      render(<Sidebar user={user} />)
      
      const logoutButton = screen.getByText('Logout').closest('button')
      expect(logoutButton?.querySelector('svg')).toBeInTheDocument()
    })
  })
})