import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/mikrotik/sync-devices/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import * as fc from 'fast-check'

// Mock dependencies
vi.mock('@/auth')

describe('Device Import Summary Accuracy Property Test', () => {
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

  // **Feature: mikrotik-enhancements, Property 6: Import Summary Accuracy**
  // **Validates: Requirements 2.9, 2.10**
  describe('Property 6: Import Summary Accuracy', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should report exactly (N-M) imported and M skipped for N devices with M duplicates', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of devices
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 15 }
          ),
          async (devices) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            const N = devices.length
            
            // Count unique IPs to determine M (duplicates within the input)
            const uniqueIps = new Set(devices.map(d => d.ip))
            const uniqueCount = uniqueIps.size
            const duplicatesWithinInput = N - uniqueCount

            // Import devices
            const request = createRequest({ devices })
            const response = await POST(request)
            const data = await response.json()

            // Verify response
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)

            // Property: imported + skipped = N
            expect(data.imported + data.skipped).toBe(N)

            // Property: imported = N - M (where M is duplicates)
            expect(data.imported).toBe(uniqueCount)
            expect(data.skipped).toBe(duplicatesWithinInput)

            // Verify database state matches reported imported count
            const dbDevices = await prisma.device.findMany()
            expect(dbDevices.length).toBe(data.imported)
          }
        ),
        { numRuns: 50, timeout: 15000 }
      )
    }, 20000)

    it('should accurately count duplicates across multiple import operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two batches of devices
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 8 }
          ),
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 8 }
          ),
          async (firstBatch, secondBatch) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // First import
            const N1 = firstBatch.length
            const uniqueIps1 = new Set(firstBatch.map(d => d.ip))
            const M1 = N1 - uniqueIps1.size

            const request1 = createRequest({ devices: firstBatch })
            const response1 = await POST(request1)
            const data1 = await response1.json()

            expect(response1.status).toBe(200)
            expect(data1.imported).toBe(N1 - M1)
            expect(data1.skipped).toBe(M1)
            expect(data1.imported + data1.skipped).toBe(N1)

            // Second import
            const N2 = secondBatch.length
            
            // Calculate duplicates: within secondBatch + overlap with firstBatch
            const secondBatchIps = secondBatch.map(d => d.ip)
            const alreadyImportedIps = new Set(firstBatch.map(d => d.ip))
            
            // Count how many from secondBatch are duplicates
            let duplicateCount = 0
            const seenInSecondBatch = new Set<string>()
            
            for (const ip of secondBatchIps) {
              if (seenInSecondBatch.has(ip) || alreadyImportedIps.has(ip)) {
                duplicateCount++
              } else {
                seenInSecondBatch.add(ip)
              }
            }
            
            const M2 = duplicateCount
            const expectedImported2 = N2 - M2

            const request2 = createRequest({ devices: secondBatch })
            const response2 = await POST(request2)
            const data2 = await response2.json()

            expect(response2.status).toBe(200)
            expect(data2.imported).toBe(expectedImported2)
            expect(data2.skipped).toBe(M2)
            expect(data2.imported + data2.skipped).toBe(N2)

            // Verify total database count
            const totalDevices = await prisma.device.findMany()
            expect(totalDevices.length).toBe(data1.imported + data2.imported)
          }
        ),
        { numRuns: 50, timeout: 15000 }
      )
    }, 20000)

    it('should handle edge case: all devices are duplicates (M = N)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 10 }
          ),
          async (devices) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            const N = devices.length

            // First import
            const request1 = createRequest({ devices })
            const response1 = await POST(request1)
            const data1 = await response1.json()

            expect(response1.status).toBe(200)

            // Second import with same devices - all should be duplicates
            const request2 = createRequest({ devices })
            const response2 = await POST(request2)
            const data2 = await response2.json()

            expect(response2.status).toBe(200)
            expect(data2.imported).toBe(0) // N - M where M = N
            expect(data2.skipped).toBe(N) // M = N
            expect(data2.imported + data2.skipped).toBe(N)

            // Verify database unchanged
            const dbDevices = await prisma.device.findMany()
            expect(dbDevices.length).toBe(data1.imported)
          }
        ),
        { numRuns: 50, timeout: 15000 }
      )
    }, 20000)

    it('should handle edge case: no duplicates (M = 0)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate devices with guaranteed unique IPs
          fc.uniqueArray(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            {
              minLength: 1,
              maxLength: 10,
              selector: (device) => device.ip
            }
          ),
          async (devices) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            const N = devices.length
            const M = 0 // No duplicates by construction

            const request = createRequest({ devices })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.imported).toBe(N - M) // Should be N
            expect(data.skipped).toBe(M) // Should be 0
            expect(data.imported + data.skipped).toBe(N)

            // Verify all devices in database
            const dbDevices = await prisma.device.findMany()
            expect(dbDevices.length).toBe(N)
          }
        ),
        { numRuns: 50, timeout: 15000 }
      )
    }, 20000)

    it('should maintain accuracy invariant: imported + skipped = total devices', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              ip: fc.ipV4(),
              type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER', 'SMART_TV'),
              status: fc.constantFrom('up', 'down', 'unknown')
            }, { requiredKeys: ['name', 'ip', 'type', 'status'] }),
            { minLength: 1, maxLength: 20 }
          ),
          async (devices) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            const N = devices.length

            const request = createRequest({ devices })
            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            
            // Core invariant: imported + skipped must always equal total input
            expect(data.imported + data.skipped).toBe(N)
            
            // Additional invariants
            expect(data.imported).toBeGreaterThanOrEqual(0)
            expect(data.skipped).toBeGreaterThanOrEqual(0)
            expect(data.imported).toBeLessThanOrEqual(N)
            expect(data.skipped).toBeLessThanOrEqual(N)
          }
        ),
        { numRuns: 50, timeout: 15000 }
      )
    }, 20000)
  })
})
