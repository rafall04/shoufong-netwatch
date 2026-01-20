import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'

describe('Polling Interval Configuration Property Test', () => {
  beforeEach(async () => {
    // Reset config to default state before each test
    await prisma.systemConfig.deleteMany()
  })

  it('Property 15: Polling interval configuration - For any valid polling interval value (positive integer), updating the SystemConfig should persist the new value', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 15: Polling interval configuration
    // Validates: Requirements 4.2, 4.5
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3600 }), // Positive integers from 1 to 3600 seconds
        async (pollingInterval) => {
          // Upsert config with new polling interval
          const updatedConfig = await prisma.systemConfig.upsert({
            where: { id: 1 },
            update: { pollingInterval },
            create: {
              id: 1,
              pollingInterval,
              mikrotikIp: '',
              mikrotikUser: '',
              mikrotikPass: '',
              mikrotikPort: 8728
            }
          })
          
          // Retrieve config to verify persistence
          const retrievedConfig = await prisma.systemConfig.findUnique({
            where: { id: 1 }
          })
          
          // Verify the polling interval was persisted correctly
          return retrievedConfig?.pollingInterval === pollingInterval &&
                 updatedConfig.pollingInterval === pollingInterval
        }
      ),
      { numRuns: 100 }
    )
  })
})
