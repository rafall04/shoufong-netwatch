import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { GET as devicesGET, POST as devicesPOST } from '@/app/api/devices/route'
import { PUT as devicePUT, DELETE as deviceDELETE } from '@/app/api/devices/[id]/route'
import { POST as moveDevice } from '@/app/api/device/move/route'
import { GET as configGET, PUT as configPUT } from '@/app/api/config/route'
import { POST as passwordChange } from '@/app/api/profile/password/route'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

// Mock auth module with different session states
let mockSession: any = null

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession))
}))

describe('Integration Tests - Complete System Flow', () => {
  beforeEach(async () => {
    // Clean up all data before each test
    await prisma.device.deleteMany()
    await prisma.user.deleteMany()
    await prisma.systemConfig.deleteMany()
    
    // Create test users with different roles
    const adminPassword = await bcrypt.hash('admin123', 10)
    const operatorPassword = await bcrypt.hash('operator123', 10)
    const viewerPassword = await bcrypt.hash('viewer123', 10)
    
    await prisma.user.createMany({
      data: [
        {
          id: 'admin-user',
          username: 'admin',
          password: adminPassword,
          name: 'Admin User',
          role: 'ADMIN'
        },
        {
          id: 'operator-user',
          username: 'operator',
          password: operatorPassword,
          name: 'Operator User',
          role: 'OPERATOR'
        },
        {
          id: 'viewer-user',
          username: 'viewer',
          password: viewerPassword,
          name: 'Viewer User',
          role: 'VIEWER'
        }
      ]
    })
    
    // Create default system config
    await prisma.systemConfig.create({
      data: {
        id: 1,
        pollingInterval: 30,
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 8728
      }
    })
  })

  afterEach(() => {
    mockSession = null
  })

  describe('Complete Authentication Flow', () => {
    it('should handle complete authentication workflow for ADMIN user', async () => {
      // Simulate ADMIN login
      mockSession = {
        user: {
          id: 'admin-user',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        }
      }

      // Test access to all endpoints
      const deviceData = {
        name: 'Admin Test Device',
        ip: '192.168.1.100',
        type: 'ROUTER',
        laneName: 'Lane A'
      }

      // Create device
      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      expect(createResponse.status).toBe(201)

      // Access config (ADMIN only)
      const configRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const configResponse = await configGET(configRequest)
      expect(configResponse.status).toBe(200)

      // Change password
      const passwordRequest = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: 'newpassword123'
        })
      })
      const passwordResponse = await passwordChange(passwordRequest)
      expect(passwordResponse.status).toBe(200)
    })

    it('should handle complete authentication workflow for OPERATOR user', async () => {
      // Simulate OPERATOR login
      mockSession = {
        user: {
          id: 'operator-user',
          username: 'operator',
          name: 'Operator User',
          role: 'OPERATOR'
        }
      }

      // Test device management access
      const deviceData = {
        name: 'Operator Test Device',
        ip: '192.168.1.101',
        type: 'TABLET',
        laneName: 'Lane B'
      }

      // Create device (should work)
      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      expect(createResponse.status).toBe(201)

      // Try to access config (should fail)
      const configRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const configResponse = await configGET(configRequest)
      expect(configResponse.status).toBe(403)

      // Change password (should work)
      const passwordRequest = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'operator123',
          newPassword: 'newpassword123'
        })
      })
      const passwordResponse = await passwordChange(passwordRequest)
      expect(passwordResponse.status).toBe(200)
    })

    it('should handle complete authentication workflow for VIEWER user', async () => {
      // Simulate VIEWER login
      mockSession = {
        user: {
          id: 'viewer-user',
          username: 'viewer',
          name: 'Viewer User',
          role: 'VIEWER'
        }
      }

      // Test read-only access
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      expect(listResponse.status).toBe(200)

      // Try to create device (should fail)
      const deviceData = {
        name: 'Viewer Test Device',
        ip: '192.168.1.102',
        type: 'ROUTER',
        laneName: 'Lane C'
      }
      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      expect(createResponse.status).toBe(403)

      // Try to access config (should fail)
      const configRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const configResponse = await configGET(configRequest)
      expect(configResponse.status).toBe(403)

      // Change password (should work)
      const passwordRequest = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'viewer123',
          newPassword: 'newpassword123'
        })
      })
      const passwordResponse = await passwordChange(passwordRequest)
      expect(passwordResponse.status).toBe(200)
    })
  })

  describe('Device CRUD Through API Integration', () => {
    beforeEach(() => {
      // Set ADMIN session for device operations
      mockSession = {
        user: {
          id: 'admin-user',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        }
      }
    })

    it('should handle complete device lifecycle - create, read, update, delete', async () => {
      // 1. Create device
      const deviceData = {
        name: 'Lifecycle Test Device',
        ip: '192.168.1.200',
        type: 'ROUTER',
        laneName: 'Test Lane'
      }

      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      const createData = await createResponse.json()
      
      expect(createResponse.status).toBe(201)
      expect(createData.device.name).toBe('Lifecycle Test Device')
      expect(createData.device.status).toBe('unknown')
      expect(createData.device.positionX).toBe(0)
      expect(createData.device.positionY).toBe(0)
      
      const deviceId = createData.device.id

      // 2. Read device (list all)
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      const listData = await listResponse.json()
      
      expect(listResponse.status).toBe(200)
      expect(listData.devices).toHaveLength(1)
      expect(listData.devices[0].id).toBe(deviceId)

      // 3. Update device
      const updateData = {
        name: 'Updated Lifecycle Device',
        type: 'TABLET',
        laneName: 'Updated Lane'
      }
      
      const updateRequest = new NextRequest(`http://localhost:3000/api/devices/${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const updateResponse = await devicePUT(updateRequest, { params: { id: deviceId } })
      const updatedData = await updateResponse.json()
      
      expect(updateResponse.status).toBe(200)
      expect(updatedData.device.name).toBe('Updated Lifecycle Device')
      expect(updatedData.device.type).toBe('TABLET')
      expect(updatedData.device.laneName).toBe('Updated Lane')
      expect(updatedData.device.ip).toBe('192.168.1.200') // Should remain unchanged

      // 4. Delete device
      const deleteRequest = new NextRequest(`http://localhost:3000/api/devices/${deviceId}`, {
        method: 'DELETE'
      })
      const deleteResponse = await deviceDELETE(deleteRequest, { params: { id: deviceId } })
      const deleteData = await deleteResponse.json()
      
      expect(deleteResponse.status).toBe(200)
      expect(deleteData.success).toBe(true)

      // 5. Verify deletion
      const finalListRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const finalListResponse = await devicesGET(finalListRequest)
      const finalListData = await finalListResponse.json()
      
      expect(finalListResponse.status).toBe(200)
      expect(finalListData.devices).toHaveLength(0)
    })

    it('should handle multiple device types in complete workflow', async () => {
      const deviceTypes = ['ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'] as const
      const createdDevices: string[] = []

      // Create one device of each type
      for (let i = 0; i < deviceTypes.length; i++) {
        const deviceData = {
          name: `${deviceTypes[i]} Device`,
          ip: `192.168.1.${210 + i}`,
          type: deviceTypes[i],
          laneName: `Lane ${String.fromCharCode(65 + i)}` // A, B, C, D
        }

        const createRequest = new NextRequest('http://localhost:3000/api/devices', {
          method: 'POST',
          body: JSON.stringify(deviceData)
        })
        const createResponse = await devicesPOST(createRequest)
        const createData = await createResponse.json()
        
        expect(createResponse.status).toBe(201)
        expect(createData.device.type).toBe(deviceTypes[i])
        createdDevices.push(createData.device.id)
      }

      // Verify all devices exist
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      const listData = await listResponse.json()
      
      expect(listResponse.status).toBe(200)
      expect(listData.devices).toHaveLength(4)

      // Update each device
      for (let i = 0; i < createdDevices.length; i++) {
        const updateRequest = new NextRequest(`http://localhost:3000/api/devices/${createdDevices[i]}`, {
          method: 'PUT',
          body: JSON.stringify({ name: `Updated ${deviceTypes[i]} Device` })
        })
        const updateResponse = await devicePUT(updateRequest, { params: { id: createdDevices[i] } })
        
        expect(updateResponse.status).toBe(200)
      }

      // Delete all devices
      for (const deviceId of createdDevices) {
        const deleteRequest = new NextRequest(`http://localhost:3000/api/devices/${deviceId}`, {
          method: 'DELETE'
        })
        const deleteResponse = await deviceDELETE(deleteRequest, { params: { id: deviceId } })
        
        expect(deleteResponse.status).toBe(200)
      }
    })
  })

  describe('Map Interaction with Database Persistence', () => {
    beforeEach(() => {
      // Set ADMIN session for map operations
      mockSession = {
        user: {
          id: 'admin-user',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        }
      }
    })

    it('should handle device position updates through map interaction', async () => {
      // Create a device first
      const deviceData = {
        name: 'Map Test Device',
        ip: '192.168.1.220',
        type: 'ROUTER',
        laneName: 'Map Lane'
      }

      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      const createData = await createResponse.json()
      const deviceId = createData.device.id

      // Verify initial position is (0, 0)
      expect(createData.device.positionX).toBe(0)
      expect(createData.device.positionY).toBe(0)

      // Simulate drag-and-drop position update
      const newPosition = {
        deviceId: deviceId,
        positionX: 150.5,
        positionY: 200.75
      }

      const moveRequest = new NextRequest('http://localhost:3000/api/device/move', {
        method: 'POST',
        body: JSON.stringify(newPosition)
      })
      const moveResponse = await moveDevice(moveRequest)
      const moveData = await moveResponse.json()

      expect(moveResponse.status).toBe(200)
      expect(moveData.success).toBe(true)

      // Verify position was persisted in database
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      const listData = await listResponse.json()
      
      const updatedDevice = listData.devices.find((d: any) => d.id === deviceId)
      expect(updatedDevice.positionX).toBe(150.5)
      expect(updatedDevice.positionY).toBe(200.75)
    })

    it('should handle multiple device position updates', async () => {
      // Create multiple devices
      const devices: any[] = []
      for (let i = 0; i < 3; i++) {
        const deviceData = {
          name: `Multi Device ${i + 1}`,
          ip: `192.168.1.${230 + i}`,
          type: 'ROUTER',
          laneName: `Multi Lane ${i + 1}`
        }

        const createRequest = new NextRequest('http://localhost:3000/api/devices', {
          method: 'POST',
          body: JSON.stringify(deviceData)
        })
        const createResponse = await devicesPOST(createRequest)
        const createData = await createResponse.json()
        devices.push(createData.device)
      }

      // Update positions for all devices
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 150 },
        { x: 300, y: 200 }
      ]

      for (let i = 0; i < devices.length; i++) {
        const moveRequest = new NextRequest('http://localhost:3000/api/device/move', {
          method: 'POST',
          body: JSON.stringify({
            deviceId: devices[i].id,
            positionX: positions[i].x,
            positionY: positions[i].y
          })
        })
        const moveResponse = await moveDevice(moveRequest)
        expect(moveResponse.status).toBe(200)
      }

      // Verify all positions were persisted
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      const listData = await listResponse.json()

      for (let i = 0; i < devices.length; i++) {
        const device = listData.devices.find((d: any) => d.id === devices[i].id)
        expect(device.positionX).toBe(positions[i].x)
        expect(device.positionY).toBe(positions[i].y)
      }
    })

    it('should prevent position updates for VIEWER role', async () => {
      // Create device as ADMIN
      const deviceData = {
        name: 'Viewer Test Device',
        ip: '192.168.1.240',
        type: 'ROUTER',
        laneName: 'Viewer Lane'
      }

      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      const createData = await createResponse.json()
      const deviceId = createData.device.id

      // Switch to VIEWER session
      mockSession = {
        user: {
          id: 'viewer-user',
          username: 'viewer',
          name: 'Viewer User',
          role: 'VIEWER'
        }
      }

      // Try to update position as VIEWER
      const moveRequest = new NextRequest('http://localhost:3000/api/device/move', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: deviceId,
          positionX: 100,
          positionY: 100
        })
      })
      const moveResponse = await moveDevice(moveRequest)
      const moveData = await moveResponse.json()

      expect(moveResponse.status).toBe(403)
      expect(moveData.error).toBe('Insufficient permissions')
    })
  })

  describe('System Configuration Integration', () => {
    beforeEach(() => {
      // Set ADMIN session for config operations
      mockSession = {
        user: {
          id: 'admin-user',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        }
      }
    })

    it('should handle complete configuration workflow', async () => {
      // Get current config
      const getRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const getResponse = await configGET(getRequest)
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.config.pollingInterval).toBe(30)
      expect(getData.config.mikrotikIp).toBe('192.168.1.1')

      // Update config
      const updateData = {
        pollingInterval: 60,
        mikrotikIp: '192.168.1.10',
        mikrotikUser: 'newadmin',
        mikrotikPass: 'newpassword',
        mikrotikPort: 8729
      }

      const updateRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const updateResponse = await configPUT(updateRequest)
      const updateResponseData = await updateResponse.json()

      expect(updateResponse.status).toBe(200)
      expect(updateResponseData.config.pollingInterval).toBe(60)
      expect(updateResponseData.config.mikrotikIp).toBe('192.168.1.10')
      expect(updateResponseData.config.mikrotikUser).toBe('newadmin')
      expect(updateResponseData.config.mikrotikPort).toBe(8729)

      // Verify config was persisted
      const verifyRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const verifyResponse = await configGET(verifyRequest)
      const verifyData = await verifyResponse.json()

      expect(verifyResponse.status).toBe(200)
      expect(verifyData.config.pollingInterval).toBe(60)
      expect(verifyData.config.mikrotikIp).toBe('192.168.1.10')
    })

    it('should prevent config access for non-ADMIN users', async () => {
      // Test OPERATOR access
      mockSession = {
        user: {
          id: 'operator-user',
          username: 'operator',
          name: 'Operator User',
          role: 'OPERATOR'
        }
      }

      const operatorRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const operatorResponse = await configGET(operatorRequest)
      expect(operatorResponse.status).toBe(403)

      // Test VIEWER access
      mockSession = {
        user: {
          id: 'viewer-user',
          username: 'viewer',
          name: 'Viewer User',
          role: 'VIEWER'
        }
      }

      const viewerRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const viewerResponse = await configGET(viewerRequest)
      expect(viewerResponse.status).toBe(403)
    })
  })

  describe('Cross-Component Integration', () => {
    it('should handle complete user workflow - login, create device, update position, change config', async () => {
      // Simulate ADMIN login
      mockSession = {
        user: {
          id: 'admin-user',
          username: 'admin',
          name: 'Admin User',
          role: 'ADMIN'
        }
      }

      // 1. Create a device
      const deviceData = {
        name: 'Workflow Test Device',
        ip: '192.168.1.250',
        type: 'SMART_TV',
        laneName: 'Workflow Lane'
      }

      const createRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      })
      const createResponse = await devicesPOST(createRequest)
      const createData = await createResponse.json()
      const deviceId = createData.device.id

      expect(createResponse.status).toBe(201)

      // 2. Update device position (simulate map interaction)
      const moveRequest = new NextRequest('http://localhost:3000/api/device/move', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: deviceId,
          positionX: 400,
          positionY: 300
        })
      })
      const moveResponse = await moveDevice(moveRequest)
      expect(moveResponse.status).toBe(200)

      // 3. Update system configuration
      const configUpdateRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'PUT',
        body: JSON.stringify({
          pollingInterval: 45,
          mikrotikIp: '192.168.1.5'
        })
      })
      const configUpdateResponse = await configPUT(configUpdateRequest)
      expect(configUpdateResponse.status).toBe(200)

      // 4. Change user password
      const passwordRequest = new NextRequest('http://localhost:3000/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: 'newadmin123'
        })
      })
      const passwordResponse = await passwordChange(passwordRequest)
      expect(passwordResponse.status).toBe(200)

      // 5. Verify all changes persisted
      const listRequest = new NextRequest('http://localhost:3000/api/devices', {
        method: 'GET'
      })
      const listResponse = await devicesGET(listRequest)
      const listData = await listResponse.json()
      
      const device = listData.devices.find((d: any) => d.id === deviceId)
      expect(device.positionX).toBe(400)
      expect(device.positionY).toBe(300)

      const configRequest = new NextRequest('http://localhost:3000/api/config', {
        method: 'GET'
      })
      const configResponse = await configGET(configRequest)
      const configData = await configResponse.json()
      
      expect(configData.config.pollingInterval).toBe(45)
      expect(configData.config.mikrotikIp).toBe('192.168.1.5')
    })
  })
})