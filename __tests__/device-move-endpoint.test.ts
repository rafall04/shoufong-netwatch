import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/device/move/route'
import { NextRequest } from 'next/server'

// Mock auth module
const mockSession = { user: { id: 'test-user', role: 'ADMIN' } }
let authMock = mockSession

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(authMock))
}))

describe('POST /api/device/move endpoint', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await prisma.device.deleteMany()
    // Reset auth mock to ADMIN
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }
  })

  it('should require authentication', async () => {
    // Set auth to return null (unauthenticated)
    authMock = null as any

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionX: 100, positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should deny access for VIEWER role', async () => {
    // Set auth to VIEWER role
    authMock = { user: { id: 'test-user', role: 'VIEWER' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionX: 100, positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should allow access for ADMIN role', async () => {
    // Create a device first
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.1',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 150, positionY: 250 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify position was updated in database
    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBe(150)
    expect(updatedDevice?.positionY).toBe(250)
  })

  it('should allow access for OPERATOR role', async () => {
    // Create a device first
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.2',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    authMock = { user: { id: 'test-user', role: 'OPERATOR' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 300, positionY: 400 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify position was updated in database
    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBe(300)
    expect(updatedDevice?.positionY).toBe(400)
  })

  it('should return 404 for non-existent device', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'non-existent-id', positionX: 100, positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Device not found')
  })

  it('should return 400 when deviceId is missing', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ positionX: 100, positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields: deviceId, positionX, positionY')
  })

  it('should return 400 when positionX is missing', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields: deviceId, positionX, positionY')
  })

  it('should return 400 when positionY is missing', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionX: 100 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields: deviceId, positionX, positionY')
  })

  it('should return 400 when deviceId is not a string', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 123, positionX: 100, positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid deviceId')
  })

  it('should return 400 when positionX is not a number', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionX: 'invalid', positionY: 200 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid position coordinates')
  })

  it('should return 400 when positionY is not a number', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-id', positionX: 100, positionY: 'invalid' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid position coordinates')
  })

  it('should update device position to positive coordinates', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.3',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 500, positionY: 600 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBe(500)
    expect(updatedDevice?.positionY).toBe(600)
  })

  it('should update device position to negative coordinates', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.4',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 100,
        positionY: 100
      }
    })

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: -50, positionY: -75 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBe(-50)
    expect(updatedDevice?.positionY).toBe(-75)
  })

  it('should update device position to zero coordinates', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.5',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 100,
        positionY: 100
      }
    })

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 0, positionY: 0 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBe(0)
    expect(updatedDevice?.positionY).toBe(0)
  })

  it('should handle decimal coordinates', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.6',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 123.456, positionY: 789.012 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.positionX).toBeCloseTo(123.456, 3)
    expect(updatedDevice?.positionY).toBeCloseTo(789.012, 3)
  })

  it('should not modify other device fields when updating position', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.7',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'up',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest('http://localhost:3000/api/device/move', {
      method: 'POST',
      body: JSON.stringify({ deviceId: device.id, positionX: 200, positionY: 300 })
    })

    const response = await POST(request)
    await response.json()

    const updatedDevice = await prisma.device.findUnique({ where: { id: device.id } })
    expect(updatedDevice?.name).toBe('Test Device')
    expect(updatedDevice?.ip).toBe('192.168.1.7')
    expect(updatedDevice?.type).toBe('ROUTER')
    expect(updatedDevice?.laneName).toBe('Lane 1')
    expect(updatedDevice?.status).toBe('up')
    expect(updatedDevice?.positionX).toBe(200)
    expect(updatedDevice?.positionY).toBe(300)
  })
})
