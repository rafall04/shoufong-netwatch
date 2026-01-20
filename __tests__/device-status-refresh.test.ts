import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import fs from 'fs'
import path from 'path'

// Feature: mikrotik-netwatch-dashboard, Property 13: Client-side status refresh
// Validates: Requirements 6.1, 5.8

describe('Property 13: Client-side status refresh', () => {
  it('should refresh device status at intervals not exceeding 5 seconds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (_testValue) => {
          // Read the map page source code to verify the refresh interval configuration
          const mapPagePath = path.join(process.cwd(), 'app/dashboard/map/page.tsx')
          const mapPageContent = fs.readFileSync(mapPagePath, 'utf-8')
          
          // Extract the refreshInterval value from the SWR configuration
          const refreshIntervalMatch = mapPageContent.match(/refreshInterval:\s*(\d+)/)
          
          if (!refreshIntervalMatch) {
            // If no refreshInterval is specified, SWR doesn't auto-refresh
            return false
          }
          
          const refreshInterval = parseInt(refreshIntervalMatch[1], 10)
          
          // Verify that the refresh interval is at most 5 seconds (5000 milliseconds)
          return refreshInterval <= 5000 && refreshInterval > 0
        }
      ),
      { numRuns: 100 }
    )
  })
})
