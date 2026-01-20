import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import DeviceNode from '@/components/DeviceNode'
import { ReactFlowProvider } from 'reactflow'

describe('Device Status Visual Indication Property Test', () => {
  it('Property 4: Status visual indication - For any device with status "down", the node must be rendered with red color and pulsing animation', () => {
    // Feature: mikrotik-netwatch-dashboard, Property 4: Status visual indication
    // Validates: Requirements 5.3, 5.4
    
    fc.assert(
      fc.property(
        fc.constantFrom('up', 'down', 'unknown'),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
        (status, name, laneName, deviceType) => {
          const nodeData = {
            name,
            laneName,
            status,
            type: deviceType as 'ROUTER' | 'TABLET' | 'SCANNER_GTEX' | 'SMART_TV'
          }
          
          const { container } = render(
            <ReactFlowProvider>
              <DeviceNode
                id="test-node"
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
          
          // Get the main container div
          const nodeElement = container.querySelector('div[class*="border"]')
          
          if (!nodeElement) return false
          
          const classes = nodeElement.className
          
          if (status === 'down') {
            // Should have red border and animate-pulse
            return classes.includes('border-red-500') && classes.includes('animate-pulse')
          }
          
          if (status === 'up') {
            // Should have green border
            return classes.includes('border-green-500')
          }
          
          // For unknown status, just check it renders
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
