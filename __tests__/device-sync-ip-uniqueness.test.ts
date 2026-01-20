import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/mikrotik/sync-devices/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import * as fc from 'fast-check'

// Mock dependencies
vi.mock('@/auth')

describe('Device Sync IP Uniqueness Property Test', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Clean up devices before each test
    await prisma.device.deleteMany()
  })

  // Helper to create mock request
  const createRequest = (body: any) => {
    return {
      json: async () => body
    } as NextRequest
  }

  // **Feature: mikrotik-enhancements, Property 3: Device Sync IP Uniqueness**
  // **Validates: Requirements 2.9, 8.5**
  describe('Property 3: Device Sync IP Uniqueness', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should skip devices with duplicate IPs and include them in skipped count', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of devices with some duplicate IPs
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 2, maxLength: 10 }
          ),
          async (devices) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Count unique IPs in the input
            const uniqueIps = new Set(devices.map(d => d.ip))
            const totalDevices = devices.length
            const expectedImported = uniqueIps.size
            const expectedSkipped = totalDevices - expectedImported

            // First import - all should succeed
            const request1 = createRequest({ devices })
            const response1 = await POST(request1)
            const data1 = await response1.json()

            expect(response1.status).toBe(200)
            expect(data1.success).toBe(true)
            expect(data1.imported).toBe(expectedImported)
            expect(data1.skipped).toBe(expectedSkipped)

            // Verify devices were created in database
            const createdDevices = await prisma.device.findMany()
            expect(createdDevices.length).toBe(expectedImported)

            // Second import with same devices - all should be skipped
            const request2 = createRequest({ devices })
            const response2 = await POST(request2)
            const data2 = await response2.json()

            expect(response2.status).toBe(200)
            expect(data2.success).toBe(true)
            expect(data2.imported).toBe(0)
            expect(data2.skipped).toBe(totalDevices)

            // Verify no additional devices were created
            const finalDevices = await prisma.device.findMany()
            expect(finalDevices.length).toBe(expectedImported)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should handle mixed scenario with some new and some duplicate IPs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two sets of devices
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 5 }
          ),
          async (firstBatch, secondBatch) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Import first batch
            const request1 = createRequest({ devices: firstBatch })
            const response1 = await POST(request1)
            const data1 = await response1.json()

            expect(response1.status).toBe(200)
            expect(data1.success).toBe(true)

            const firstBatchUniqueIps = new Set(firstBatch.map(d => d.ip))
            const firstBatchExpectedImported = firstBatchUniqueIps.size
            const firstBatchExpectedSkipped = firstBatch.length - firstBatchExpectedImported

            expect(data1.imported).toBe(firstBatchExpectedImported)
            expect(data1.skipped).toBe(firstBatchExpectedSkipped)

            // Import second batch (may have duplicates with first batch)
            const request2 = createRequest({ devices: secondBatch })
            const response2 = await POST(request2)
            const data2 = await response2.json()

            expect(response2.status).toBe(200)
            expect(data2.success).toBe(true)

            // Calculate expected results for second batch
            const secondBatchIps = secondBatch.map(d => d.ip)
            const secondBatchUniqueIps = new Set(secondBatchIps)
            
            // Count how many IPs from second batch are already in database
            let duplicateCount = 0
            for (const ip of secondBatchIps) {
              if (firstBatchUniqueIps.has(ip)) {
                duplicateCount++
              }
            }

            // New devices are those with unique IPs not in first batch
            const newUniqueIps = new Set<string>()
            secondBatchUniqueIps.forEach(ip => {
              if (!firstBatchUniqueIps.has(ip)) {
                newUniqueIps.add(ip)
              }
            })

            expect(data2.imported).toBe(newUniqueIps.size)
            expect(data2.skipped).toBe(secondBatch.length - newUniqueIps.size)

            // Verify total devices in database
            const allDevices = await prisma.device.findMany()
            const expectedTotal = firstBatchUniqueIps.size + newUniqueIps.size
            expect(allDevices.length).toBe(expectedTotal)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should preserve existing device data when skipping duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            ip: fc.ipV4(),
            type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
            status: fc.constantFrom('up', 'down', 'unknown')
          }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
          async (originalDevice) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Import original device
            const request1 = createRequest({ devices: [originalDevice] })
            const response1 = await POST(request1)
            const data1 = await response1.json()

            expect(response1.status).toBe(200)
            expect(data1.success).toBe(true)
            expect(data1.imported).toBe(1)

            // Get the created device
            const createdDevice = await prisma.device.findUnique({
              where: { ip: originalDevice.ip }
            })
            expect(createdDevice).not.toBeNull()
            expect(createdDevice!.name).toBe(originalDevice.name)
            expect(createdDevice!.type).toBe(originalDevice.type)

            // Try to import device with same IP but different data
            const duplicateDevice = {
              name: originalDevice.name + '_modified',
              ip: originalDevice.ip, // Same IP
              type: originalDevice.type === 'ROUTER' ? 'TABLET' : 'ROUTER',
              status: originalDevice.status === 'up' ? 'down' : 'up'
            }

            const request2 = createRequest({ devices: [duplicateDevice] })
            const response2 = await POST(request2)
            const data2 = await response2.json()

            expect(response2.status).toBe(200)
            expect(data2.success).toBe(true)
            expect(data2.imported).toBe(0)
            expect(data2.skipped).toBe(1)

            // Verify original device data is unchanged
            const unchangedDevice = await prisma.device.findUnique({
              where: { ip: originalDevice.ip }
            })
            expect(unchangedDevice).not.toBeNull()
            expect(unchangedDevice!.name).toBe(originalDevice.name)
            expect(unchangedDevice!.type).toBe(originalDevice.type)
            expect(unchangedDevice!.id).toBe(createdDevice!.id)
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
