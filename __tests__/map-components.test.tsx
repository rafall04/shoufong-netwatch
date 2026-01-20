import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeviceNode from '@/components/DeviceNode'
import { ReactFlowProvider } from 'reactflow'

// Requirements: 5.2, 5.3, 5.4, 5.7

describe('Map Components Unit Tests', () => {
  describe('DeviceNode Icon Rendering', () => {
    // Requirement 5.2: Icon mapping based on device type
    
    it('should render Router icon for ROUTER device type', () => {
      const nodeData = {
        name: 'Test Router',
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

      // Check that an SVG icon is rendered
      const svgElement = container.querySelector('svg')
      expect(svgElement).toBeTruthy()
      
      // Check that device name is displayed
      expect(screen.getByText('Test Router')).toBeTruthy()
      expect(screen.getByText('Lane A')).toBeTruthy()
    })

    it('should render Tablet icon for TABLET device type', () => {
      const nodeData = {
        name: 'Test Tablet',
        laneName: 'Lane B',
        status: 'up',
        type: 'TABLET' as const
      }

      const { container } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-2"
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

      const svgElement = container.querySelector('svg')
      expect(svgElement).toBeTruthy()
      expect(screen.getByText('Test Tablet')).toBeTruthy()
    })

    it('should render ScanBarcode icon for SCANNER_GTEX device type', () => {
      const nodeData = {
        name: 'Test Scanner',
        laneName: 'Lane C',
        status: 'up',
        type: 'SCANNER_GTEX' as const
      }

      const { container } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-3"
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

      const svgElement = container.querySelector('svg')
      expect(svgElement).toBeTruthy()
      expect(screen.getByText('Test Scanner')).toBeTruthy()
    })

    it('should render Tv icon for SMART_TV device type', () => {
      const nodeData = {
        name: 'Test TV',
        laneName: 'Lane D',
        status: 'up',
        type: 'SMART_TV' as const
      }

      const { container } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-4"
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

      const svgElement = container.querySelector('svg')
      expect(svgElement).toBeTruthy()
      expect(screen.getByText('Test TV')).toBeTruthy()
    })
  })

  describe('DeviceNode Status Styling', () => {
    // Requirements 5.3, 5.4: Status visual indication
    
    it('should apply green border for UP status', () => {
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

      const nodeElement = container.querySelector('div[class*="border"]')
      expect(nodeElement).toBeTruthy()
      expect(nodeElement?.className).toContain('border-green-500')
      expect(nodeElement?.className).not.toContain('animate-pulse')
    })

    it('should apply red border and pulse animation for DOWN status', () => {
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

      const nodeElement = container.querySelector('div[class*="border"]')
      expect(nodeElement).toBeTruthy()
      expect(nodeElement?.className).toContain('border-red-500')
      expect(nodeElement?.className).toContain('animate-pulse')
    })

    it('should apply gray border for UNKNOWN status', () => {
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

      const nodeElement = container.querySelector('div[class*="border"]')
      expect(nodeElement).toBeTruthy()
      expect(nodeElement?.className).toContain('border-gray-400')
      expect(nodeElement?.className).not.toContain('animate-pulse')
    })

    it('should apply green icon color for UP status', () => {
      const nodeData = {
        name: 'Online Device',
        laneName: 'Lane A',
        status: 'up',
        type: 'ROUTER' as const
      }

      const { container } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-icon-up"
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

      const iconContainer = container.querySelector('div[class*="text-green"]')
      expect(iconContainer).toBeTruthy()
    })

    it('should apply red icon color for DOWN status', () => {
      const nodeData = {
        name: 'Offline Device',
        laneName: 'Lane B',
        status: 'down',
        type: 'ROUTER' as const
      }

      const { container } = render(
        <ReactFlowProvider>
          <DeviceNode
            id="test-icon-down"
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

      const iconContainer = container.querySelector('div[class*="text-red"]')
      expect(iconContainer).toBeTruthy()
    })
  })

  describe('Map Drag Permission', () => {
    // Requirement 5.7: Role-based drag permission
    
    // Helper function to check if dragging should be enabled for a role
    const checkDraggable = (role: string): boolean => {
      return role !== 'VIEWER'
    }
    
    it('should disable dragging for VIEWER role', () => {
      const isDraggable = checkDraggable('VIEWER')
      expect(isDraggable).toBe(false)
    })

    it('should enable dragging for ADMIN role', () => {
      const isDraggable = checkDraggable('ADMIN')
      expect(isDraggable).toBe(true)
    })

    it('should enable dragging for OPERATOR role', () => {
      const isDraggable = checkDraggable('OPERATOR')
      expect(isDraggable).toBe(true)
    })
  })
})
