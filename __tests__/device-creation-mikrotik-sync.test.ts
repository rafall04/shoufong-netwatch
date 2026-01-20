import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma, cleanupTestData } from './test-prisma'
import { POST } from '@/app/api/devices/route'
import { NextRequest } from 'next/server'

// Mock the main prisma client to use the test client
vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma
}))

// Mock RouterOSAPI
let mockRouterOSAPI: any
const createMockAPI = () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue([]),
  close: vi.fn().mockResolvedValue(undefined)
})

vi.mock('node-routeros', () => ({
  RouterOSAPI: vi.fn().mockImplementation(() => mockRouterOSAPI)
}))

// Mock auth module
let authMock: any = { user: { id: 'test-user', role: 'ADMIN' } }

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(authMock))
}))

describe('Enhanced Device Creation with MikroTik Sync - Unit Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData()
    
    // Reset auth mock to ADMIN
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }
    
    // Reset RouterOSAPI mock
    mockRouterOSAPI = createMockAPI()
    
    // Mock SystemConfig to return null by default
    testPrisma.systemConfig.findUnique.mockResolvedValue(null)
  })

  describe('Device creation without sync (existing behavior)', () => {
    it('should create device without syncToMikrotik flag', async () => {
      const deviceData = {
        name: 'Test Router',
        ip: '192.168.1.100',
        type: 'ROUTER',
        laneName: 'Lane A'
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.device.name).toBe('Test Router')
      expect(data.device.ip).toBe('192.168.1.100')
      expect(data.warning).toBeUndefined()
      
      // Verify MikroTik API was not called
      expect(mockRouterOSAPI.connect).not.toHaveBeenCalled()
      expect(mockRouterOSAPI.write).not.toHaveBeenCalled()
    })

    it('should create device with syncToMikrotik set to false', async () => {
      const deviceData = {
        name: 'Test Tablet',
        ip: '192.168.1.101',
        type: 'TABLET',
        laneName: 'Lane B',
        syncToMikrotik: false
      }

      const mockDevice = {
        id: 'test-device-id',
        name: deviceData.name,
        ip: deviceData.ip,
        type: deviceData.type,
        laneName: deviceData.laneName,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.warning).toBeUndefined()
      
      // Verify MikroTik API was not called
      expect(mockRouterOSAPI.connect).not.toHaveBeenCalled()
    })
  })

  describe('Device creation with sync enabled (success)', () => {
    it('should create device and sync to MikroTik successfully', async () => {
      const deviceData = {
        name: 'Synced Router',
        ip: '192.168.1.102',
        type: 'ROUTER',
        laneName: 'Lane C',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.device.name).toBe('Synced Router')
      expect(data.warning).toBeUndefined()
      
      // Verify MikroTik API was called correctly
      expect(mockRouterOSAPI.connect).toHaveBeenCalledTimes(1)
      expect(mockRouterOSAPI.write).toHaveBeenCalledWith('/tool/netwatch/add', [
        '=host=192.168.1.102',
        '=comment=Synced Router'
      ])
      expect(mockRouterOSAPI.close).toHaveBeenCalledTimes(1)
    })

    it('should create device and sync with different device types', async () => {
      const deviceData = {
        name: 'Synced Scanner',
        ip: '192.168.1.103',
        type: 'SCANNER_GTEX',
        laneName: 'Lane D',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device.type).toBe('SCANNER_GTEX')
      expect(data.warning).toBeUndefined()
      expect(mockRouterOSAPI.connect).toHaveBeenCalled()
    })
  })

  describe('Device creation with sync enabled (MikroTik fails, device still created)', () => {
    it('should create device even when MikroTik is not configured', async () => {
      const deviceData = {
        name: 'Device Without Config',
        ip: '192.168.1.104',
        type: 'ROUTER',
        laneName: 'Lane E',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.device.name).toBe('Device Without Config')
      expect(data.warning).toBe('Device created but not synced to MikroTik: MikroTik not configured')
      
      // Verify device was still created in database
      expect(testPrisma.device.create).toHaveBeenCalled()
    })

    it('should create device even when MikroTik connection times out', async () => {
      const deviceData = {
        name: 'Device Timeout',
        ip: '192.168.1.105',
        type: 'TABLET',
        laneName: 'Lane F',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)
      
      // Mock connection timeout
      mockRouterOSAPI.connect.mockRejectedValue(new Error('Connection timed out'))

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.warning).toContain('Device created but not synced to MikroTik')
      expect(data.warning).toContain('Connection timeout')
      
      // Verify device was still created
      expect(testPrisma.device.create).toHaveBeenCalled()
    })

    it('should create device even when MikroTik authentication fails', async () => {
      const deviceData = {
        name: 'Device Auth Fail',
        ip: '192.168.1.106',
        type: 'SMART_TV',
        laneName: 'Lane G',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'wrongpassword',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)
      
      // Mock authentication failure
      mockRouterOSAPI.connect.mockRejectedValue(new Error('Cannot log in'))

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.warning).toContain('Device created but not synced to MikroTik')
      expect(data.warning).toContain('Authentication failed')
      
      // Verify device was still created
      expect(testPrisma.device.create).toHaveBeenCalled()
    })

    it('should create device even when MikroTik connection is refused', async () => {
      const deviceData = {
        name: 'Device Connection Refused',
        ip: '192.168.1.107',
        type: 'ROUTER',
        laneName: 'Lane H',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)
      
      // Mock connection refused
      mockRouterOSAPI.connect.mockRejectedValue(new Error('ECONNREFUSED'))

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.warning).toContain('Device created but not synced to MikroTik')
      expect(data.warning).toContain('Connection refused')
      
      // Verify device was still created
      expect(testPrisma.device.create).toHaveBeenCalled()
    })

    it('should create device even when MikroTik write operation fails', async () => {
      const deviceData = {
        name: 'Device Write Fail',
        ip: '192.168.1.108',
        type: 'TABLET',
        laneName: 'Lane I',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)
      
      // Mock write operation failure
      mockRouterOSAPI.write.mockRejectedValue(new Error('Write operation failed'))

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(data.warning).toContain('Device created but not synced to MikroTik')
      
      // Verify device was still created
      expect(testPrisma.device.create).toHaveBeenCalled()
      
      // Verify connection was attempted and closed
      expect(mockRouterOSAPI.connect).toHaveBeenCalled()
      expect(mockRouterOSAPI.close).toHaveBeenCalled()
    })
  })

  describe('Sync option only available for ADMIN/OPERATOR', () => {
    it('should allow ADMIN to create device with sync enabled', async () => {
      authMock = { user: { id: 'test-user', role: 'ADMIN' } }

      const deviceData = {
        name: 'Admin Synced Device',
        ip: '192.168.1.109',
        type: 'ROUTER',
        laneName: 'Lane J',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(mockRouterOSAPI.connect).toHaveBeenCalled()
    })

    it('should allow OPERATOR to create device with sync enabled', async () => {
      authMock = { user: { id: 'test-user', role: 'OPERATOR' } }

      const deviceData = {
        name: 'Operator Synced Device',
        ip: '192.168.1.110',
        type: 'TABLET',
        laneName: 'Lane K',
        syncToMikrotik: true
      }

      const mockDevice = {
        id: 'test-device-id',
        ...deviceData,
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const mockConfig = {
        id: 1,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728,
        pollingInterval: 30
      }

      testPrisma.device.findUnique.mockResolvedValue(null)
      testPrisma.device.create.mockResolvedValue(mockDevice)
      testPrisma.systemConfig.findUnique.mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.device).toBeDefined()
      expect(mockRouterOSAPI.connect).toHaveBeenCalled()
    })

    it('should deny VIEWER from creating any device (with or without sync)', async () => {
      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const deviceData = {
        name: 'Viewer Device',
        ip: '192.168.1.111',
        type: 'ROUTER',
        laneName: 'Lane L',
        syncToMikrotik: true
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
      
      // Verify device was not created
      expect(testPrisma.device.create).not.toHaveBeenCalled()
      
      // Verify MikroTik API was not called
      expect(mockRouterOSAPI.connect).not.toHaveBeenCalled()
    })

    it('should deny VIEWER from creating device without sync', async () => {
      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const deviceData = {
        name: 'Viewer Device No Sync',
        ip: '192.168.1.112',
        type: 'ROUTER',
        laneName: 'Lane M'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
      
      // Verify device was not created
      expect(testPrisma.device.create).not.toHaveBeenCalled()
    })
  })
})
