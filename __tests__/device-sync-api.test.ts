import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '@/app/api/mikrotik/sync-devices/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RouterOSAPI } from 'node-routeros'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/auth')
vi.mock('node-routeros')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: {
      findUnique: vi.fn()
    },
    device: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

describe('Device Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create mock request
  const createRequest = (body?: any) => {
    return {
      json: async () => body || {}
    } as NextRequest
  }

  describe('GET /api/mikrotik/sync-devices - Fetch Devices', () => {
    describe('Authentication and Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Authentication required')
      })

      it('should return 403 when user is VIEWER', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'viewer@test.com', role: 'VIEWER' }
        } as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Insufficient permissions')
      })

      it('should allow ADMIN to fetch devices', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)

        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null)

        const request = createRequest()
        const response = await GET(request)

        expect(response.status).toBe(400) // MikroTik not configured
        // But authorization passed
      })

      it('should allow OPERATOR to fetch devices', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'operator@test.com', role: 'OPERATOR' }
        } as any)

        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null)

        const request = createRequest()
        const response = await GET(request)

        expect(response.status).toBe(400) // MikroTik not configured
        // But authorization passed
      })
    })

    describe('MikroTik Configuration', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)
      })

      it('should return 400 when MikroTik is not configured', async () => {
        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('MikroTik not configured')
      })

      it('should return 400 when MikroTik IP is missing', async () => {
        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
          id: 1,
          mikrotikIp: null,
          mikrotikUser: 'admin',
          mikrotikPass: 'password',
          mikrotikPort: 8728,
          pollingInterval: 30
        } as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('MikroTik not configured')
      })
    })

    describe('Successful Device Fetch', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)

        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
          id: 1,
          mikrotikIp: '192.168.1.1',
          mikrotikUser: 'admin',
          mikrotikPass: 'password',
          mikrotikPort: 8728,
          pollingInterval: 30
        } as any)
      })

      it('should successfully fetch devices from MikroTik', async () => {
        const mockNetwatchData = [
          { host: '192.168.1.10', comment: 'Router 1', status: 'up' },
          { host: '192.168.1.20', comment: 'Tablet Device', status: 'down' },
          { host: '192.168.1.30', comment: 'Scanner Pro', status: 'up' }
        ]

        const mockApi = {
          connect: vi.fn().mockResolvedValue(undefined),
          write: vi.fn().mockResolvedValue(mockNetwatchData),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.devices).toHaveLength(3)
        expect(data.message).toBe('Found 3 devices in MikroTik Netwatch')
        
        // Verify device mapping
        expect(data.devices[0]).toEqual({
          name: 'Router 1',
          ip: '192.168.1.10',
          type: 'ROUTER',
          status: 'up'
        })
        
        expect(data.devices[1]).toEqual({
          name: 'Tablet Device',
          ip: '192.168.1.20',
          type: 'TABLET',
          status: 'down'
        })
        
        expect(data.devices[2]).toEqual({
          name: 'Scanner Pro',
          ip: '192.168.1.30',
          type: 'SCANNER',
          status: 'up'
        })

        expect(mockApi.connect).toHaveBeenCalled()
        expect(mockApi.write).toHaveBeenCalledWith('/tool/netwatch/print')
        expect(mockApi.close).toHaveBeenCalled()
      })

      it('should map device types correctly based on name', async () => {
        const mockNetwatchData = [
          { host: '192.168.1.10', comment: 'Main Router', status: 'up' },
          { host: '192.168.1.20', comment: 'iPad Pro', status: 'up' },
          { host: '192.168.1.30', comment: 'Document Scanner', status: 'up' },
          { host: '192.168.1.40', comment: 'Smart TV Living Room', status: 'up' },
          { host: '192.168.1.50', comment: 'Unknown Device', status: 'up' }
        ]

        const mockApi = {
          connect: vi.fn().mockResolvedValue(undefined),
          write: vi.fn().mockResolvedValue(mockNetwatchData),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(data.devices[0].type).toBe('ROUTER')
        expect(data.devices[1].type).toBe('TABLET')
        expect(data.devices[2].type).toBe('SCANNER')
        expect(data.devices[3].type).toBe('SMART_TV')
        expect(data.devices[4].type).toBe('ROUTER') // Default
      })

      it('should handle empty device list', async () => {
        const mockApi = {
          connect: vi.fn().mockResolvedValue(undefined),
          write: vi.fn().mockResolvedValue([]),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.devices).toHaveLength(0)
        expect(data.message).toBe('Found 0 devices in MikroTik Netwatch')
      })
    })

    describe('Connection Failures', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)

        vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
          id: 1,
          mikrotikIp: '192.168.1.1',
          mikrotikUser: 'admin',
          mikrotikPass: 'password',
          mikrotikPort: 8728,
          pollingInterval: 30
        } as any)
      })

      it('should handle connection timeout', async () => {
        const mockApi = {
          connect: vi.fn().mockRejectedValue(new Error('Connection timeout')),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Connection timeout - could not reach MikroTik')
      })

      it('should handle authentication failure', async () => {
        const mockApi = {
          connect: vi.fn().mockRejectedValue(new Error('cannot log in')),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Authentication failed - invalid credentials')
      })

      it('should handle connection refused', async () => {
        const mockApi = {
          connect: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Connection refused - MikroTik unreachable')
      })

      it('should handle network unreachable', async () => {
        const mockApi = {
          connect: vi.fn().mockRejectedValue(new Error('EHOSTUNREACH')),
          close: vi.fn().mockResolvedValue(undefined)
        }

        vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

        const request = createRequest()
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Network unreachable - cannot reach MikroTik')
      })
    })
  })

  describe('POST /api/mikrotik/sync-devices - Import Devices', () => {
    describe('Authentication and Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null as any)

        const request = createRequest({ devices: [] })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Authentication required')
      })

      it('should return 403 when user is VIEWER', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'viewer@test.com', role: 'VIEWER' }
        } as any)

        const request = createRequest({ devices: [] })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Insufficient permissions')
      })

      it('should allow ADMIN to import devices', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)

        const request = createRequest({ devices: [] })
        const response = await POST(request)

        expect(response.status).toBe(400) // Empty devices array
        // But authorization passed
      })

      it('should allow OPERATOR to import devices', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'operator@test.com', role: 'OPERATOR' }
        } as any)

        const request = createRequest({ devices: [] })
        const response = await POST(request)

        expect(response.status).toBe(400) // Empty devices array
        // But authorization passed
      })
    })

    describe('Input Validation', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)
      })

      it('should return 400 when devices is not an array', async () => {
        const request = createRequest({ devices: 'not-an-array' })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid devices data: devices must be an array')
      })

      it('should return 400 when devices array is empty', async () => {
        const request = createRequest({ devices: [] })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('No devices provided for import')
      })

      it('should return 400 when device is not an object', async () => {
        const request = createRequest({ devices: ['not-an-object'] })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid device at index 0')
        expect(data.error).toContain('must be an object')
      })

      it('should return 400 when device name is missing', async () => {
        const request = createRequest({
          devices: [{ ip: '192.168.1.10', type: 'ROUTER' }]
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid device at index 0')
        expect(data.error).toContain('name is required')
      })

      it('should return 400 when device IP is missing', async () => {
        const request = createRequest({
          devices: [{ name: 'Router 1', type: 'ROUTER' }]
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid device at index 0')
        expect(data.error).toContain('ip is required')
      })

      it('should return 400 when device type is invalid', async () => {
        const request = createRequest({
          devices: [{ name: 'Device 1', ip: '192.168.1.10', type: 'INVALID_TYPE' }]
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid device at index 0')
        expect(data.error).toContain('type must be one of')
      })
    })

    describe('Device Import - No Duplicates', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)
      })

      it('should import all devices when no duplicates exist', async () => {
        const devicesToImport = [
          { name: 'Router 1', ip: '192.168.1.10', type: 'ROUTER', status: 'up' },
          { name: 'Tablet 1', ip: '192.168.1.20', type: 'TABLET', status: 'down' },
          { name: 'Scanner 1', ip: '192.168.1.30', type: 'SCANNER', status: 'up' }
        ]

        // Mock no existing devices
        vi.mocked(prisma.device.findUnique).mockResolvedValue(null)

        // Mock device creation
        vi.mocked(prisma.device.create).mockImplementation((({ data }: any) => 
          Promise.resolve({
            id: Math.random().toString(),
            ...data,
            lastSeen: null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ) as any)

        const request = createRequest({ devices: devicesToImport })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.imported).toBe(3)
        expect(data.skipped).toBe(0)
        expect(data.devices).toHaveLength(3)
        expect(data.message).toBe('Imported 3 devices, skipped 0 duplicates')

        // Verify all devices were created with correct defaults
        expect(prisma.device.create).toHaveBeenCalledTimes(3)
        expect(prisma.device.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: 'Router 1',
            ip: '192.168.1.10',
            type: 'ROUTER',
            laneName: 'Imported',
            status: 'up',
            positionX: 0,
            positionY: 0
          })
        })
      })

      it('should use default type ROUTER when type is not provided', async () => {
        const devicesToImport = [
          { name: 'Device 1', ip: '192.168.1.10' }
        ]

        vi.mocked(prisma.device.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.device.create).mockImplementation((({ data }: any) => 
          Promise.resolve({
            id: '1',
            ...data,
            lastSeen: null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ) as any)

        const request = createRequest({ devices: devicesToImport })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(prisma.device.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            type: 'ROUTER'
          })
        })
      })

      it('should use default status unknown when status is not provided', async () => {
        const devicesToImport = [
          { name: 'Device 1', ip: '192.168.1.10', type: 'ROUTER' }
        ]

        vi.mocked(prisma.device.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.device.create).mockImplementation((({ data }: any) => 
          Promise.resolve({
            id: '1',
            ...data,
            lastSeen: null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ) as any)

        const request = createRequest({ devices: devicesToImport })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(prisma.device.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: 'unknown'
          })
        })
      })
    })

    describe('Device Import - Some Duplicates', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)
      })

      it('should skip duplicate IPs and import only new devices', async () => {
        const devicesToImport = [
          { name: 'Router 1', ip: '192.168.1.10', type: 'ROUTER' },
          { name: 'Tablet 1', ip: '192.168.1.20', type: 'TABLET' },
          { name: 'Scanner 1', ip: '192.168.1.30', type: 'SCANNER' }
        ]

        // Mock: first device exists, others don't
        vi.mocked(prisma.device.findUnique)
          .mockResolvedValueOnce({ id: '1', ip: '192.168.1.10' } as any) // Duplicate
          .mockResolvedValueOnce(null) // New
          .mockResolvedValueOnce(null) // New

        vi.mocked(prisma.device.create).mockImplementation((({ data }: any) => 
          Promise.resolve({
            id: Math.random().toString(),
            ...data,
            lastSeen: null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ) as any)

        const request = createRequest({ devices: devicesToImport })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.imported).toBe(2)
        expect(data.skipped).toBe(1)
        expect(data.devices).toHaveLength(2)
        expect(data.message).toBe('Imported 2 devices, skipped 1 duplicates')

        // Verify only 2 devices were created
        expect(prisma.device.create).toHaveBeenCalledTimes(2)
      })
    })

    describe('Device Import - All Duplicates', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
        } as any)
      })

      it('should skip all devices when all are duplicates', async () => {
        const devicesToImport = [
          { name: 'Router 1', ip: '192.168.1.10', type: 'ROUTER' },
          { name: 'Tablet 1', ip: '192.168.1.20', type: 'TABLET' }
        ]

        // Mock: all devices exist
        vi.mocked(prisma.device.findUnique).mockResolvedValue({ id: '1' } as any)

        const request = createRequest({ devices: devicesToImport })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.imported).toBe(0)
        expect(data.skipped).toBe(2)
        expect(data.devices).toHaveLength(0)
        expect(data.message).toBe('Imported 0 devices, skipped 2 duplicates')

        // Verify no devices were created
        expect(prisma.device.create).not.toHaveBeenCalled()
      })
    })
  })
})
