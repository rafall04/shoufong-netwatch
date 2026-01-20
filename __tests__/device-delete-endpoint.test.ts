import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { DELETE } from '@/app/api/devices/[id]/route'
import { NextRequest } from 'next/server'

// Mock auth module
const mockSession = { user: { id: 'test-user', role: 'ADMIN' } }
let authMock = mockSession

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(authMock))
}))

describe('DELETE /api/devices/[id] endpoint', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await prisma.device.deleteMany()
    // Reset auth mock to ADMIN
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }
  })

  it('should require authentication', async () => {
    // Set auth to return null (unauthenticated)
    authMock = null as any

    const request = new NextRequest('http://localhost:3000/api/devices/test-id', {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: 'test-id' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should deny access for VIEWER role', async () => {
    // Set auth to VIEWER role
    authMock = { user: { id: 'test-user', role: 'VIEWER' } }

    const request = new NextRequest('http://localhost:3000/api/devices/test-id', {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: 'test-id' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Insufficient permissions')
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

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify device was deleted
    const deletedDevice = await prisma.device.findUnique({
      where: { id: device.id }
    })
    expect(deletedDevice).toBeNull()
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

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify device was deleted
    const deletedDevice = await prisma.device.findUnique({
      where: { id: device.id }
    })
    expect(deletedDevice).toBeNull()
  })

  it('should return 404 for non-existent device', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/devices/non-existent-id', {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: 'non-existent-id' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Device not found')
  })

  it('should successfully delete device from database', async () => {
    const device = await prisma.device.create({
      data: {
        name: 'Device to Delete',
        ip: '192.168.1.3',
        type: 'TABLET',
        laneName: 'Lane 2',
        status: 'up',
        positionX: 100,
        positionY: 200
      }
    })

    // Verify device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: device.id }
    })
    expect(existingDevice).not.toBeNull()

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify device no longer exists
    const deletedDevice = await prisma.device.findUnique({
      where: { id: device.id }
    })
    expect(deletedDevice).toBeNull()
  })
})
