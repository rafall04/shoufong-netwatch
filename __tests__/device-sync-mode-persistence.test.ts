import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/devices/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import * as fc from 'fast-check'
import { RouterOSAPI } from 'node-routeros'

// Mock dependencies
vi.mock('@/auth')
vi.mock('node-routeros')

describe('Device Sync Mode Database Persistence Property Test', () => {
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

  // **Feature: mikrotik-enhancements, Property 8: Sync Mode Database Persistence**
  // **Validates: Requirements 3.6**
  describe('Property 8: Sync Mode Database Persistence', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should persist device to database even when MikroTik sync fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            ip: fc.ipV4(),
            type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
            laneName: fc.string({ minLength: 1, maxLength: 50 })
          }, { requiredKeys: ['name', 'ip', 'type', 'laneName'] }),
          fc.constantFrom(
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'Authentication failed',
            'Connection timeout'
          ),
          async (deviceData, errorType) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Mock SystemConfig to return valid MikroTik configuration
            vi.spyOn(prisma.systemConfig, 'findUnique').mockResolvedValue({
              id: 1,
              mikrotikIp: '192.168.1.1',
              mikrotikUser: 'admin',
              mikrotikPass: 'password',
              mikrotikPort: 8728,
              pollingInterval: 5,
              updatedAt: new Date()
            })

            // Mock RouterOSAPI to simulate MikroTik failure
            const mockApi = {
              connect: vi.fn().mockRejectedValue(new Error(errorType)),
              write: vi.fn().mockRejectedValue(new Error(errorType)),
              close: vi.fn().mockResolvedValue(undefined)
            }
            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            // Create device with syncToMikrotik enabled
            const request = createRequest({
              ...deviceData,
              syncToMikrotik: true
            })

            const response = await POST(request)
            const data = await response.json()

            // Device should be created successfully despite MikroTik failure
            expect(response.status).toBe(201)
            expect(data.device).toBeDefined()
            expect(data.device.name).toBe(deviceData.name)
            expect(data.device.ip).toBe(deviceData.ip)
            expect(data.device.type).toBe(deviceData.type)
            expect(data.device.laneName).toBe(deviceData.laneName)

            // Should include warning about sync failure
            expect(data.warning).toBeDefined()
            expect(data.warning).toContain('Device created but not synced to MikroTik')

            // Verify device exists in database
            const dbDevice = await prisma.device.findUnique({
              where: { ip: deviceData.ip }
            })
            expect(dbDevice).not.toBeNull()
            expect(dbDevice!.name).toBe(deviceData.name)
            expect(dbDevice!.ip).toBe(deviceData.ip)
            expect(dbDevice!.type).toBe(deviceData.type)
            expect(dbDevice!.laneName).toBe(deviceData.laneName)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist device when MikroTik is not configured', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            ip: fc.ipV4(),
            type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
            laneName: fc.string({ minLength: 1, maxLength: 50 })
          }, { requiredKeys: ['name', 'ip', 'type', 'laneName'] }),
          async (deviceData) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Mock SystemConfig to return null (not configured)
            vi.spyOn(prisma.systemConfig, 'findUnique').mockResolvedValue(null)

            // Create device with syncToMikrotik enabled
            const request = createRequest({
              ...deviceData,
              syncToMikrotik: true
            })

            const response = await POST(request)
            const data = await response.json()

            // Device should be created successfully
            expect(response.status).toBe(201)
            expect(data.device).toBeDefined()
            expect(data.device.name).toBe(deviceData.name)
            expect(data.device.ip).toBe(deviceData.ip)

            // Should include warning about MikroTik not configured
            expect(data.warning).toBeDefined()
            expect(data.warning).toContain('MikroTik not configured')

            // Verify device exists in database
            const dbDevice = await prisma.device.findUnique({
              where: { ip: deviceData.ip }
            })
            expect(dbDevice).not.toBeNull()
            expect(dbDevice!.name).toBe(deviceData.name)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist device when MikroTik connection times out', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            ip: fc.ipV4(),
            type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
            laneName: fc.string({ minLength: 1, maxLength: 50 })
          }, { requiredKeys: ['name', 'ip', 'type', 'laneName'] }),
          async (deviceData) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Mock SystemConfig
            vi.spyOn(prisma.systemConfig, 'findUnique').mockResolvedValue({
              id: 1,
              mikrotikIp: '192.168.1.1',
              mikrotikUser: 'admin',
              mikrotikPass: 'password',
              mikrotikPort: 8728,
              pollingInterval: 5,
              updatedAt: new Date()
            })

            // Mock RouterOSAPI to simulate timeout
            const mockApi = {
              connect: vi.fn().mockImplementation(() => {
                return new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Connection timeout')), 100)
                })
              }),
              write: vi.fn(),
              close: vi.fn().mockResolvedValue(undefined)
            }
            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            // Create device with syncToMikrotik enabled
            const request = createRequest({
              ...deviceData,
              syncToMikrotik: true
            })

            const response = await POST(request)
            const data = await response.json()

            // Device should be created successfully
            expect(response.status).toBe(201)
            expect(data.device).toBeDefined()

            // Should include warning about sync failure
            expect(data.warning).toBeDefined()
            expect(data.warning).toContain('Device created but not synced to MikroTik')

            // Verify device exists in database
            const dbDevice = await prisma.device.findUnique({
              where: { ip: deviceData.ip }
            })
            expect(dbDevice).not.toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist device when MikroTik authentication fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            ip: fc.ipV4(),
            type: fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
            laneName: fc.string({ minLength: 1, maxLength: 50 })
          }, { requiredKeys: ['name', 'ip', 'type', 'laneName'] }),
          async (deviceData) => {
            // Clean up before each property iteration
            await prisma.device.deleteMany()

            // Mock SystemConfig
            vi.spyOn(prisma.systemConfig, 'findUnique').mockResolvedValue({
              id: 1,
              mikrotikIp: '192.168.1.1',
              mikrotikUser: 'admin',
              mikrotikPass: 'wrongpassword',
              mikrotikPort: 8728,
              pollingInterval: 5,
              updatedAt: new Date()
            })

            // Mock RouterOSAPI to simulate authentication failure
            const mockApi = {
              connect: vi.fn().mockRejectedValue(new Error('cannot log in')),
              write: vi.fn(),
              close: vi.fn().mockResolvedValue(undefined)
            }
            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            // Create device with syncToMikrotik enabled
            const request = createRequest({
              ...deviceData,
              syncToMikrotik: true
            })

            const response = await POST(request)
            const data = await response.json()

            // Device should be created successfully
            expect(response.status).toBe(201)
            expect(data.device).toBeDefined()

            // Should include warning about sync failure
            expect(data.warning).toBeDefined()
            expect(data.warning).toContain('Device created but not synced to MikroTik')

            // Verify device exists in database
            const dbDevice = await prisma.device.findUnique({
              where: { ip: deviceData.ip }
            })
            expect(dbDevice).not.toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
