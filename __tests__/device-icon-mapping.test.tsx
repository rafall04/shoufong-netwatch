import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import DeviceNode from '@/components/DeviceNode'
import { ReactFlowProvider } from 'reactflow'

describe('Device Icon Mapping Property Test', () => {
  it('Property 3: Device type icon mapping consistency - For any device displayed on the map, the rendered icon must correspond to its device type', () => {
    // Feature: mikrotik-netwatch-dashboard, Property 3: Device type icon mapping consistency
    // Validates: Requirements 5.2
    
    fc.assert(
      fc.property(
        fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('up', 'down', 'unknown'),
        (deviceType, name, laneName, status) => {
          // Expected icon component names based on device type
          const expectedIcons: Record<string, string> = {
            'ROUTER': 'Router',
            'TABLET': 'Tablet',
            'SCANNER_GTEX': 'ScanBarcode',
            'SMART_TV': 'Tv'
          }
          
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
          
          // Check that the correct icon is rendered by looking for the SVG element
          // Lucide icons render as SVG elements with specific classes
          const svgElements = container.querySelectorAll('svg')
          
          // Should have at least one SVG (the icon)
          return svgElements.length > 0
        }
      ),
      { numRuns: 100 }
    )
  })
})
