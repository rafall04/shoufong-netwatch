import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma, cleanupTestData } from './test-prisma'
import { GET, POST } from '@/app/api/devices/route'
import { PUT, DELETE } from '@/app/api/devices/[id]/route'
import { NextRequest } from 'next/server'

// Mock the main prisma client to use the test client
vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma
}))

// Mock RouterOSAPI
vi.mock('node-routeros', () => ({
  RouterOSAPI: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock auth module
const mockSession = { user: { id: 'test-user', role: 'ADMIN' } }
let authMock = mockSession

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(authMock))
}))

describe('Device API Endpoints Unit Tests', () => {
  beforeEach(async () => {
    // Clean up mocks before each test
    await cleanupTestData()
    // Reset auth mock to ADMIN
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }
    // Mock SystemConfig to return null (MikroTik not configured)
    testPrisma.systemConfig.findUnique.mockResolvedValue(null)
  })

  describe('POST /api/devices - Device Creation', () => {
    it('should successfully create a device with valid data', async () => {
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

      // Mock Prisma calls
      testPrisma.device.findUnique.mockResolvedValue(null) // No existing device with same IP
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
      expect(data.device.type).toBe('ROUTER')
      expect(data.device.laneName).toBe('Lane A')
      expect(data.device.status).toBe('unknown')
      expect(data.device.positionX).toBe(0)
      expect(data.device.positionY).toBe(0)
      expect(data.warning).toBeUndefined()
    })

    it('should create device with TABLET type', async () => {
      const deviceData = {
        name: 'QC Tablet',
        ip: '192.168.1.101',
        type: 'TABLET',
        laneName: 'Lane B'
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
      expect(data.device.type).toBe('TABLET')
    })

    it('should create device with SCANNER_GTEX type', async () => {
      const deviceData = {
        name: 'Scanner Device',
        ip: '192.168.1.102',
        type: 'SCANNER_GTEX',
        laneName: 'Lane C'
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
      expect(data.device.type).toBe('SCANNER_GTEX')
    })

    it('should create device with SMART_TV type', async () => {
      const deviceData = {
        name: 'Smart TV',
        ip: '192.168.1.103',
        type: 'SMART_TV',
        laneName: 'Lane D'
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
      expect(data.device.type).toBe('SMART_TV')
    })

    it('should reject device creation with duplicate IP address', async () => {
      const existingDevice = {
        id: 'existing-device-id',
        name: 'First Device',
        ip: '192.168.1.50',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      // Mock finding existing device with same IP
      testPrisma.device.findUnique.mockResolvedValue(existingDevice)

      const deviceData = {
        name: 'Second Device',
        ip: '192.168.1.50',
        type: 'TABLET',
        laneName: 'Lane 2'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('IP address already exists')
    })

    it('should reject device creation with missing name', async () => {
      const deviceData = {
        ip: '192.168.1.104',
        type: 'ROUTER',
        laneName: 'Lane A'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject device creation with missing IP', async () => {
      const deviceData = {
        name: 'Test Device',
        type: 'ROUTER',
        laneName: 'Lane A'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject device creation with invalid device type', async () => {
      const deviceData = {
        name: 'Test Device',
        ip: '192.168.1.105',
        type: 'INVALID_TYPE',
        laneName: 'Lane A'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid device type')
    })
  })

  describe('Authorization Tests - 403 Forbidden', () => {
    it('should deny device creation for VIEWER role', async () => {
      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const deviceData = {
        name: 'Test Device',
        ip: '192.168.1.106',
        type: 'ROUTER',
        laneName: 'Lane A'
      }

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should allow device creation for ADMIN role', async () => {
      authMock = { user: { id: 'test-user', role: 'ADMIN' } }

      const deviceData = {
        name: 'Admin Device',
        ip: '192.168.1.107',
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
    })

    it('should allow device creation for OPERATOR role', async () => {
      authMock = { user: { id: 'test-user', role: 'OPERATOR' } }

      const deviceData = {
        name: 'Operator Device',
        ip: '192.168.1.108',
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
    })

    it('should deny device update for VIEWER role', async () => {
      const mockDevice = {
        id: 'test-device-id',
        name: 'Test Device',
        ip: '192.168.1.109',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const request = new NextRequest(`http://localhost:3000/api/devices/${mockDevice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })

      const response = await PUT(request, { params: { id: mockDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should deny device deletion for VIEWER role', async () => {
      const mockDevice = {
        id: 'test-device-id',
        name: 'Test Device',
        ip: '192.168.1.110',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const request = new NextRequest(`http://localhost:3000/api/devices/${mockDevice.id}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })

  describe('PUT /api/devices/[id] - Device Update', () => {
    it('should successfully update device name', async () => {
      const originalDevice = {
        id: 'test-device-id',
        name: 'Original Name',
        ip: '192.168.1.111',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const updatedDevice = {
        ...originalDevice,
        name: 'Updated Name'
      }

      testPrisma.device.findUnique.mockResolvedValue(originalDevice)
      testPrisma.device.update.mockResolvedValue(updatedDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${originalDevice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })

      const response = await PUT(request, { params: { id: originalDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.device.name).toBe('Updated Name')
      expect(data.device.ip).toBe('192.168.1.111')
    })

    it('should successfully update device IP', async () => {
      const originalDevice = {
        id: 'test-device-id',
        name: 'Test Device',
        ip: '192.168.1.112',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const updatedDevice = {
        ...originalDevice,
        ip: '192.168.1.200'
      }

      // First call returns the existing device, second call returns null (IP not taken)
      testPrisma.device.findUnique
        .mockResolvedValueOnce(originalDevice)
        .mockResolvedValueOnce(null)
      testPrisma.device.update.mockResolvedValue(updatedDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${originalDevice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ip: '192.168.1.200' })
      })

      const response = await PUT(request, { params: { id: originalDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.device.ip).toBe('192.168.1.200')
    })

    it('should successfully update device type', async () => {
      const originalDevice = {
        id: 'test-device-id',
        name: 'Test Device',
        ip: '192.168.1.113',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const updatedDevice = {
        ...originalDevice,
        type: 'TABLET'
      }

      testPrisma.device.findUnique.mockResolvedValue(originalDevice)
      testPrisma.device.update.mockResolvedValue(updatedDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${originalDevice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ type: 'TABLET' })
      })

      const response = await PUT(request, { params: { id: originalDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.device.type).toBe('TABLET')
    })

    it('should successfully update laneName', async () => {
      const originalDevice = {
        id: 'test-device-id',
        name: 'Test Device',
        ip: '192.168.1.114',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      const updatedDevice = {
        ...originalDevice,
        laneName: 'Lane B'
      }

      testPrisma.device.findUnique.mockResolvedValue(originalDevice)
      testPrisma.device.update.mockResolvedValue(updatedDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${originalDevice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ laneName: 'Lane B' })
      })

      const response = await PUT(request, { params: { id: originalDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.device.laneName).toBe('Lane B')
    })

    it('should return 404 for non-existent device', async () => {
      testPrisma.device.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/devices/non-existent-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })

      const response = await PUT(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Device not found')
    })
  })

  describe('DELETE /api/devices/[id] - Device Deletion', () => {
    it('should successfully delete a device', async () => {
      const mockDevice = {
        id: 'test-device-id',
        name: 'Device to Delete',
        ip: '192.168.1.115',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(mockDevice)
      testPrisma.device.delete.mockResolvedValue(mockDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${mockDevice.id}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 when deleting non-existent device', async () => {
      testPrisma.device.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/devices/non-existent-id', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Device not found')
    })

    it('should allow ADMIN to delete devices', async () => {
      authMock = { user: { id: 'test-user', role: 'ADMIN' } }

      const mockDevice = {
        id: 'test-device-id',
        name: 'Admin Delete',
        ip: '192.168.1.116',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(mockDevice)
      testPrisma.device.delete.mockResolvedValue(mockDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${mockDevice.id}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should allow OPERATOR to delete devices', async () => {
      authMock = { user: { id: 'test-user', role: 'OPERATOR' } }

      const mockDevice = {
        id: 'test-device-id',
        name: 'Operator Delete',
        ip: '192.168.1.117',
        type: 'ROUTER',
        laneName: 'Lane A',
        status: 'unknown',
        positionX: 0,
        positionY: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: null
      }

      testPrisma.device.findUnique.mockResolvedValue(mockDevice)
      testPrisma.device.delete.mockResolvedValue(mockDevice)

      const request = new NextRequest(`http://localhost:3000/api/devices/${mockDevice.id}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockDevice.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/devices - Device Listing', () => {
    it('should return all devices for authenticated user', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          name: 'Device 1',
          ip: '192.168.1.118',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'unknown',
          positionX: 0,
          positionY: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeen: null
        },
        {
          id: 'device-2',
          name: 'Device 2',
          ip: '192.168.1.119',
          type: 'TABLET',
          laneName: 'Lane B',
          status: 'unknown',
          positionX: 0,
          positionY: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeen: null
        }
      ]

      testPrisma.device.findMany.mockResolvedValue(mockDevices)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.devices).toBeDefined()
      expect(data.devices.length).toBe(2)
    })

    it('should require authentication', async () => {
      authMock = null as any

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should allow VIEWER to list devices', async () => {
      authMock = { user: { id: 'test-user', role: 'VIEWER' } }

      const mockDevices = [
        {
          id: 'device-1',
          name: 'Device 1',
          ip: '192.168.1.120',
          type: 'ROUTER',
          laneName: 'Lane A',
          status: 'unknown',
          positionX: 0,
          positionY: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeen: null
        }
      ]

      testPrisma.device.findMany.mockResolvedValue(mockDevices)

      const request = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.devices).toBeDefined()
    })
  })
})
