import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma } from './test-prisma'
import { PUT } from '@/app/api/devices/[id]/route'
import { NextRequest } from 'next/server'

// Mock the prisma import to use test client
vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma
}))

// Mock auth module
const mockSession = { user: { id: 'test-user', role: 'ADMIN' } }
let authMock = mockSession

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(authMock))
}))

describe('PUT /api/devices/[id] endpoint', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await testPrisma.device.deleteMany()
    // Reset auth mock to ADMIN
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }
  })

  it('should require authentication', async () => {
    // Set auth to return null (unauthenticated)
    authMock = null as any

    const request = new NextRequest('http://localhost:3000/api/devices/test-id', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Device' })
    })

    const response = await PUT(request, { params: { id: 'test-id' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should deny access for VIEWER role', async () => {
    // Set auth to VIEWER role
    authMock = { user: { id: 'test-user', role: 'VIEWER' } }

    const request = new NextRequest('http://localhost:3000/api/devices/test-id', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Device' })
    })

    const response = await PUT(request, { params: { id: 'test-id' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Insufficient permissions')
  })

  it('should allow access for ADMIN role', async () => {
    // Create a device first
    const device = await testtestPrisma.device.create({
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
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Device' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.name).toBe('Updated Device')
  })

  it('should allow access for OPERATOR role', async () => {
    // Create a device first
    const device = await testtestPrisma.device.create({
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
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated by Operator' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.name).toBe('Updated by Operator')
  })

  it('should return 404 for non-existent device', async () => {
    authMock = { user: { id: 'test-user', role: 'ADMIN' } }

    const request = new NextRequest('http://localhost:3000/api/devices/non-existent-id', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Device' })
    })

    const response = await PUT(request, { params: { id: 'non-existent-id' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Device not found')
  })

  it('should update device name', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Original Name',
        ip: '192.168.1.3',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.name).toBe('New Name')
    expect(data.device.ip).toBe('192.168.1.3') // IP unchanged
  })

  it('should update device IP', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.4',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ip: '192.168.1.100' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.ip).toBe('192.168.1.100')
  })

  it('should reject duplicate IP address', async () => {
    // Create two devices
    const device1 = await testtestPrisma.device.create({
      data: {
        name: 'Device 1',
        ip: '192.168.1.5',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    await testtestPrisma.device.create({
      data: {
        name: 'Device 2',
        ip: '192.168.1.6',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    // Try to update device1 to use device2's IP
    const request = new NextRequest(`http://localhost:3000/api/devices/${device1.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ip: '192.168.1.6' })
    })

    const response = await PUT(request, { params: { id: device1.id } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('IP address already exists')
  })

  it('should allow updating to same IP (no change)', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.7',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ip: '192.168.1.7', name: 'Updated Name' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.ip).toBe('192.168.1.7')
    expect(data.device.name).toBe('Updated Name')
  })

  it('should update device type', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.8',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ type: 'TABLET' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.type).toBe('TABLET')
  })

  it('should reject invalid device type', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.9',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ type: 'INVALID_TYPE' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid device type')
  })

  it('should update laneName', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.10',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ laneName: 'Lane 2' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.laneName).toBe('Lane 2')
  })

  it('should update multiple fields at once', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.11',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'unknown',
        positionX: 0,
        positionY: 0
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Device',
        ip: '192.168.1.200',
        type: 'SMART_TV',
        laneName: 'Lane 3'
      })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.name).toBe('Updated Device')
    expect(data.device.ip).toBe('192.168.1.200')
    expect(data.device.type).toBe('SMART_TV')
    expect(data.device.laneName).toBe('Lane 3')
  })

  it('should not modify fields that are not provided', async () => {
    const device = await testtestPrisma.device.create({
      data: {
        name: 'Test Device',
        ip: '192.168.1.12',
        type: 'ROUTER',
        laneName: 'Lane 1',
        status: 'up',
        positionX: 100,
        positionY: 200
      }
    })

    const request = new NextRequest(`http://localhost:3000/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Only Name Updated' })
    })

    const response = await PUT(request, { params: { id: device.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.device.name).toBe('Only Name Updated')
    expect(data.device.ip).toBe('192.168.1.12')
    expect(data.device.type).toBe('ROUTER')
    expect(data.device.laneName).toBe('Lane 1')
    expect(data.device.status).toBe('up')
    expect(data.device.positionX).toBe(100)
    expect(data.device.positionY).toBe(200)
  })
})
