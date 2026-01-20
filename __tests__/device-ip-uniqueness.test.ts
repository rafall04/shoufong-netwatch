import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'

describe('Device IP Uniqueness Property Test', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await prisma.device.deleteMany()
  })

  it('Property 2: IP address uniqueness - For any two devices in the system, their IP addresses must be distinct', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 2: IP address uniqueness
    // Validates: Requirements 2.1
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.ipV4(), { minLength: 2, maxLength: 10 }),
        async (ips) => {
          // Clean up before test
          await prisma.device.deleteMany()
          
          const uniqueIps = new Set(ips)
          let successfulCreations = 0
          
          // Try to create devices with the provided IPs
          for (const ip of ips) {
            try {
              await prisma.device.create({
                data: {
                  name: `Device ${ip}`,
                  ip,
                  type: 'ROUTER',
                  laneName: 'Test Lane',
                  status: 'unknown',
                  positionX: 0,
                  positionY: 0
                }
              })
              successfulCreations++
            } catch (error) {
              // Expected to fail for duplicate IPs
            }
          }
          
          // The number of successful creations should equal the number of unique IPs
          return successfulCreations === uniqueIps.size
        }
      ),
      { numRuns: 100 }
    )
  })
})
