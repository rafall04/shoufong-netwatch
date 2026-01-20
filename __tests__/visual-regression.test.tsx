import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Sidebar from '@/components/Sidebar'
import DeviceNode from '@/components/DeviceNode'
import DeviceTable from '@/components/DeviceTable'
import { ReactFlowProvider } from 'reactflow'

// Requirements: 9.2, 9.3, 9.4

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard/map'),
  useRouter: vi.fn(() => ({
    refresh: vi.fn()
  }))
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn()
}))

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Responsive Layout Tests', () => {
    // Requirement 9.2, 9.3: Responsive layouts on different screen sizes
    
    describe('Sidebar Responsive Behavior', () => {
      it('should apply responsive width classes for different screen sizes', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        const sidebar = container.firstChild as HTMLElement
        expect(sidebar).toHaveClass('w-64', 'lg:w-72')
      })

      it('should hide text labels on small screens and show on larger screens', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        render(<Sidebar user={user} />)
        
        // Navigation items should have responsive text visibility
        const mapLink = screen.getByText('Map')
        expect(mapLink).toHaveClass('hidden', 'sm:block')
        
        const devicesLink = screen.getByText('Devices')
        expect(devicesLink).toHaveClass('hidden', 'sm:block')
      })

      it('should apply responsive padding classes', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // Header should have responsive padding
        const header = container.querySelector('.p-4.lg\\:p-6')
        expect(header).toBeInTheDocument()
        
        // Navigation should have responsive padding
        const nav = container.querySelector('.p-3.lg\\:p-4')
        expect(nav).toBeInTheDocument()
      })

      it('should show responsive icon sizes', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // Header icon should have responsive sizing
        const headerIcon = container.querySelector('.w-8.h-8.lg\\:w-10.lg\\:h-10')
        expect(headerIcon).toBeInTheDocument()
        
        // User avatar should have responsive sizing
        const userAvatar = container.querySelector('.w-8.h-8.lg\\:w-10.lg\\:h-10')
        expect(userAvatar).toBeInTheDocument()
      })

      it('should hide user info on small screens', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // User info section should be hidden on small screens
        const userInfo = container.querySelector('.hidden.sm\\:block')
        expect(userInfo).toBeInTheDocument()
      })
    })

    describe('DeviceTable Responsive Behavior', () => {
      const mockDevices = [
        {
          id: '1',
          name: 'Router 1',
          ip: '192.168.1.1',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'up',
          lastSeen: new Date()
        },
        {
          id: '2',
          name: 'Tablet 1',
          ip: '192.168.1.2',
          type: 'TABLET',
          laneName: 'Lane B',
          status: 'down',
          lastSeen: new Date()
        }
      ]

      it('should hide columns on smaller screens', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        // IP Address column should be hidden on small screens
        const ipHeader = screen.getByText('IP Address')
        expect(ipHeader.closest('th')).toHaveClass('hidden', 'sm:table-cell')
        
        // Lane column should be hidden on medium and smaller screens
        const laneHeader = screen.getByText('Lane')
        expect(laneHeader.closest('th')).toHaveClass('hidden', 'md:table-cell')
        
        // Last Seen column should be hidden on large and smaller screens
        const lastSeenHeader = screen.getByText('Last Seen')
        expect(lastSeenHeader.closest('th')).toHaveClass('hidden', 'lg:table-cell')
      })

      it('should apply responsive padding to table cells', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        // Table cells should have responsive padding
        const cells = container.querySelectorAll('td')
        cells.forEach(cell => {
          expect(cell).toHaveClass('px-3', 'lg:px-6')
        })
      })

      it('should show condensed info on mobile', () => {
        render(<DeviceTable devices={mockDevices} />)
        
        // Mobile should show IP and Lane in device name cell
        const mobileInfo = screen.getByText('192.168.1.1 • Lane A')
        expect(mobileInfo).toHaveClass('sm:hidden')
      })

      it('should apply responsive button text visibility', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        // Action button text should be hidden on smaller screens
        const editButtons = screen.getAllByText('Edit')
        editButtons.forEach(button => {
          expect(button).toHaveClass('hidden', 'lg:inline')
        })
        
        const deleteButtons = screen.getAllByText('Delete')
        deleteButtons.forEach(button => {
          expect(button).toHaveClass('hidden', 'lg:inline')
        })
      })
    })

    describe('DeviceNode Responsive Behavior', () => {
      it('should maintain consistent sizing across different screen contexts', () => {
        const nodeData = {
          name: 'Test Device',
          laneName: 'Lane A',
          status: 'up',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-1"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )

        // Node should have minimum width for consistency
        const nodeContainer = container.querySelector('.min-w-\\[140px\\]')
        expect(nodeContainer).toBeInTheDocument()
      })
    })
  })

  describe('Color Scheme Consistency Tests', () => {
    // Requirement 9.2: Color scheme consistency (green for UP, red for DOWN)
    
    describe('DeviceNode Color Consistency', () => {
      it('should apply consistent green colors for UP status', () => {
        const nodeData = {
          name: 'Online Device',
          laneName: 'Lane A',
          status: 'up',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-up"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )

        // Border should be green
        const nodeElement = container.querySelector('.border-green-500')
        expect(nodeElement).toBeInTheDocument()
        
        // Background gradient should be green
        const backgroundElement = container.querySelector('.from-green-50.to-green-100')
        expect(backgroundElement).toBeInTheDocument()
        
        // Icon should be green
        const iconElement = container.querySelector('.text-green-600')
        expect(iconElement).toBeInTheDocument()
        
        // Status text should be green
        const statusText = screen.getByText('UP')
        expect(statusText).toHaveClass('text-green-600')
      })

      it('should apply consistent red colors for DOWN status', () => {
        const nodeData = {
          name: 'Offline Device',
          laneName: 'Lane B',
          status: 'down',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-down"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )

        // Border should be red
        const nodeElement = container.querySelector('.border-red-500')
        expect(nodeElement).toBeInTheDocument()
        
        // Background gradient should be red
        const backgroundElement = container.querySelector('.from-red-50.to-red-100')
        expect(backgroundElement).toBeInTheDocument()
        
        // Icon should be red
        const iconElement = container.querySelector('.text-red-600')
        expect(iconElement).toBeInTheDocument()
        
        // Status text should be red
        const statusText = screen.getByText('DOWN')
        expect(statusText).toHaveClass('text-red-600')
        
        // Should have pulse animation
        const pulseElement = container.querySelector('.animate-pulse')
        expect(pulseElement).toBeInTheDocument()
      })

      it('should apply consistent gray colors for UNKNOWN status', () => {
        const nodeData = {
          name: 'Unknown Device',
          laneName: 'Lane C',
          status: 'unknown',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-unknown"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )

        // Border should be gray
        const nodeElement = container.querySelector('.border-gray-400')
        expect(nodeElement).toBeInTheDocument()
        
        // Background gradient should be gray
        const backgroundElement = container.querySelector('.from-gray-50.to-gray-100')
        expect(backgroundElement).toBeInTheDocument()
        
        // Icon should be gray
        const iconElement = container.querySelector('.text-gray-600')
        expect(iconElement).toBeInTheDocument()
        
        // Status text should be gray
        const statusText = screen.getByText('UNKNOWN')
        expect(statusText).toHaveClass('text-gray-600')
      })
    })

    describe('DeviceTable Color Consistency', () => {
      const mockDevices = [
        {
          id: '1',
          name: 'Online Device',
          ip: '192.168.1.1',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'up',
          lastSeen: new Date()
        },
        {
          id: '2',
          name: 'Offline Device',
          ip: '192.168.1.2',
          type: 'TABLET',
          laneName: 'Lane B',
          status: 'down',
          lastSeen: new Date()
        },
        {
          id: '3',
          name: 'Unknown Device',
          ip: '192.168.1.3',
          type: 'SCANNER_GTEX',
          laneName: 'Lane C',
          status: 'unknown',
          lastSeen: null
        }
      ]

      it('should apply consistent green colors for UP status badges', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        const upBadge = screen.getByText('UP')
        expect(upBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
      })

      it('should apply consistent red colors for DOWN status badges', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        const downBadge = screen.getByText('DOWN')
        expect(downBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200', 'animate-pulse')
      })

      it('should apply consistent gray colors for UNKNOWN status badges', () => {
        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        const unknownBadge = screen.getByText('UNKNOWN')
        expect(unknownBadge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200')
      })
    })

    describe('Sidebar Color Consistency', () => {
      it('should apply consistent blue gradient for active navigation items', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // Active link should have blue gradient
        const activeLink = screen.getByText('Map').closest('a')
        expect(activeLink).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-md')
      })

      it('should apply consistent gray colors for inactive navigation items', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        render(<Sidebar user={user} />)
        
        // Inactive links should have gray text
        const inactiveLink = screen.getByText('Devices').closest('a')
        expect(inactiveLink).toHaveClass('text-gray-700', 'hover:bg-gray-100', 'hover:text-gray-900')
      })

      it('should apply consistent red hover colors for logout button', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        render(<Sidebar user={user} />)
        
        const logoutButton = screen.getByText('Logout').closest('button')
        expect(logoutButton).toHaveClass('text-gray-700', 'hover:bg-red-50', 'hover:text-red-700')
      })

      it('should apply consistent blue gradient for header icon', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        const headerIcon = container.querySelector('.bg-gradient-to-br.from-blue-600.to-blue-700')
        expect(headerIcon).toBeInTheDocument()
      })
    })
  })

  describe('Viewport Scaling Tests', () => {
    // Requirement 9.4: Viewport scaling and responsive breakpoints
    
    describe('Component Scaling Behavior', () => {
      it('should maintain proper aspect ratios in DeviceNode', () => {
        const nodeData = {
          name: 'Test Device',
          laneName: 'Lane A',
          status: 'up',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-scale"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )

        // Icon should maintain square aspect ratio
        const icon = container.querySelector('.w-8.h-8')
        expect(icon).toBeInTheDocument()
        
        // Node should have proper padding for scaling
        const nodeContainer = container.querySelector('.p-4')
        expect(nodeContainer).toBeInTheDocument()
      })

      it('should apply proper spacing for different screen densities', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // Navigation should have proper spacing
        const nav = container.querySelector('.space-y-1')
        expect(nav).toBeInTheDocument()
        
        // User info should have proper spacing
        const userInfo = container.querySelector('.space-x-3')
        expect(userInfo).toBeInTheDocument()
      })

      it('should maintain readable text sizes across viewports', () => {
        const mockDevices = [
          {
            id: '1',
            name: 'Test Device',
            ip: '192.168.1.1',
            type: 'ROUTER',
            laneName: 'Lane A',
            status: 'up',
            lastSeen: new Date()
          }
        ]

        const { container } = render(<DeviceTable devices={mockDevices} />)
        
        // Table headers should have readable font size
        const headers = container.querySelectorAll('th')
        headers.forEach(header => {
          expect(header).toHaveClass('text-xs')
        })
        
        // Device names should have readable font size
        const deviceName = screen.getByText('Test Device')
        expect(deviceName).toHaveClass('text-sm', 'font-semibold')
      })
    })

    describe('Layout Consistency Across Breakpoints', () => {
      it('should maintain consistent border radius across components', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container: sidebarContainer } = render(<Sidebar user={user} />)
        
        // Sidebar elements should have consistent border radius
        const roundedElements = sidebarContainer.querySelectorAll('.rounded-lg, .rounded-full, .rounded-xl')
        expect(roundedElements.length).toBeGreaterThan(0)
        
        const nodeData = {
          name: 'Test Device',
          laneName: 'Lane A',
          status: 'up',
          type: 'ROUTER' as const
        }

        const { container: nodeContainer } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-consistency"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )
        
        // DeviceNode should have consistent border radius
        const nodeElement = nodeContainer.querySelector('.rounded-xl')
        expect(nodeElement).toBeInTheDocument()
      })

      it('should maintain consistent shadow depths', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        const { container } = render(<Sidebar user={user} />)
        
        // Sidebar should have consistent shadow
        const sidebar = container.firstChild as HTMLElement
        expect(sidebar).toHaveClass('shadow-lg')
        
        const mockDevices = [
          {
            id: '1',
            name: 'Test Device',
            ip: '192.168.1.1',
            type: 'ROUTER',
            laneName: 'Lane A',
            status: 'up',
            lastSeen: new Date()
          }
        ]

        const { container: tableContainer } = render(<DeviceTable devices={mockDevices} />)
        
        // Table should have consistent shadow
        const table = tableContainer.querySelector('.shadow-lg')
        expect(table).toBeInTheDocument()
      })

      it('should apply consistent transition durations', () => {
        const user = { name: 'Test User', role: 'ADMIN' }
        render(<Sidebar user={user} />)
        
        // Navigation links should have consistent transitions
        const mapLink = screen.getByText('Map').closest('a')
        expect(mapLink).toHaveClass('transition-all', 'duration-200')
        
        const nodeData = {
          name: 'Test Device',
          laneName: 'Lane A',
          status: 'up',
          type: 'ROUTER' as const
        }

        const { container } = render(
          <ReactFlowProvider>
            <DeviceNode
              id="test-transition"
              data={nodeData}
              type="custom"
              selected={false}
              isConnectable={false}
              xPos={0}
              yPos={0}
              dragging={false}
              zIndex={0}
            />
          </ReactFlowProvider>
        )
        
        // DeviceNode should have consistent transitions
        const nodeElement = container.querySelector('.transition-all.duration-300')
        expect(nodeElement).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Component Visual Consistency', () => {
    it('should maintain consistent icon sizes within component contexts', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      const { container: sidebarContainer } = render(<Sidebar user={user} />)
      
      // Sidebar navigation icons should be consistent within sidebar
      const navIcons = sidebarContainer.querySelectorAll('nav svg')
      navIcons.forEach(icon => {
        expect(icon).toHaveClass('w-5', 'h-5')
      })
      
      const mockDevices = [
        {
          id: '1',
          name: 'Test Device',
          ip: '192.168.1.1',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'up',
          lastSeen: new Date()
        }
      ]

      const { container: tableContainer } = render(<DeviceTable devices={mockDevices} />)
      
      // Table device type icons should be consistent (w-5 h-5)
      const deviceTypeIcons = tableContainer.querySelectorAll('td:first-child svg')
      deviceTypeIcons.forEach(icon => {
        expect(icon).toHaveClass('w-5', 'h-5')
      })
      
      // Table action button icons should be consistent (w-4 h-4)
      const actionIcons = tableContainer.querySelectorAll('button svg')
      actionIcons.forEach(icon => {
        expect(icon).toHaveClass('w-4', 'h-4')
      })
    })

    it('should maintain consistent button styling patterns', () => {
      const mockDevices = [
        {
          id: '1',
          name: 'Test Device',
          ip: '192.168.1.1',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'up',
          lastSeen: new Date()
        }
      ]

      render(<DeviceTable devices={mockDevices} />)
      
      // Edit button should have consistent blue styling
      const editButton = screen.getByText('Edit').closest('button')
      expect(editButton).toHaveClass('text-blue-600', 'hover:text-blue-800', 'transition-colors')
      
      // Delete button should have consistent red styling
      const deleteButton = screen.getByText('Delete').closest('button')
      expect(deleteButton).toHaveClass('text-red-600', 'hover:text-red-800', 'transition-colors')
    })

    it('should maintain consistent spacing patterns', () => {
      const user = { name: 'Test User', role: 'ADMIN' }
      const { container } = render(<Sidebar user={user} />)
      
      // Consistent gap spacing in navigation
      const navItems = container.querySelectorAll('nav a')
      navItems.forEach(item => {
        expect(item).toHaveClass('space-x-3')
      })
      
      const nodeData = {
        name: 'Test Device',
        laneName: 'Lane A',
        status: 'up',
        type: 'ROUTER' as const
      }

      const { container: nodeContainer } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-spacing"
            data={nodeData}
            type="custom"
            selected={false}
            isConnectable={false}
            xPos={0}
            yPos={0}
            dragging={false}
            zIndex={0}
          />
        </ReactFlowProvider>
      )
      
      // Consistent gap spacing in device node
      const nodeContent = nodeContainer.querySelector('.gap-3')
      expect(nodeContent).toBeInTheDocument()
    })
  })
})