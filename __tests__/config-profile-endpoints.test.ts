import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock auth module
vi.mock('@/auth', () => ({
  auth: vi.fn()
}))

import { auth } from '@/auth'
import { GET as getConfig, PUT as putConfig } from '@/app/api/config/route'
import { POST as changePassword } from '@/app/api/profile/password/route'

describe('Config and Profile Endpoints', () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.user.deleteMany()
    await prisma.systemConfig.deleteMany()
  })

  describe('Config Endpoints', () => {
    it('should allow ADMIN to update config', async () => {
      // Create admin user
      const adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          password: await bcrypt.hash('password', 10),
          name: 'Admin User',
          role: 'ADMIN'
        }
      })

      // Mock auth to return admin session
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: adminUser.id,
          name: adminUser.name,
          username: adminUser.username,
          role: 'ADMIN',
          email: null,
          image: null
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as any)

      // Create initial config
      await prisma.systemConfig.create({
        data: {
          id: 1,
          pollingInterval: 30,
          mikrotikIp: '',
          mikrotikUser: '',
          mikrotikPass: '',
          mikrotikPort: 8728
        }
      })

      // Update config
      const request = new Request('http://localhost/api/config', {
        method: 'PUT',
        body: JSON.stringify({
          pollingInterval: 60,
          mikrotikIp: '192.168.1.1'
        })
      })

      const response = await putConfig(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config.pollingInterval).toBe(60)
      expect(data.config.mikrotikIp).toBe('192.168.1.1')
    })

    it('should deny config access for non-ADMIN', async () => {
      // Create operator user
      const operatorUser = await prisma.user.create({
        data: {
          username: 'operator',
          password: await bcrypt.hash('password', 10),
          name: 'Operator User',
          role: 'OPERATOR'
        }
      })

      // Mock auth to return operator session
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: operatorUser.id,
          name: operatorUser.name,
          username: operatorUser.username,
          role: 'OPERATOR',
          email: null,
          image: null
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as any)

      const request = new Request('http://localhost/api/config', {
        method: 'GET'
      })

      const response = await getConfig(request as any)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })

  describe('Profile Password Endpoint', () => {
    it('should change password with valid current password', async () => {
      const currentPassword = 'oldpassword'
      const newPassword = 'newpassword'

      // Create user
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: await bcrypt.hash(currentPassword, 10),
          name: 'Test User',
          role: 'VIEWER'
        }
      })

      // Mock auth to return user session
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: 'VIEWER',
          email: null,
          image: null
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as any)

      const request = new Request('http://localhost/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const response = await changePassword(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify password was changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      })

      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser!.password)
      expect(isNewPasswordValid).toBe(true)
    })

    it('should reject password change with invalid current password', async () => {
      const currentPassword = 'oldpassword'
      const wrongPassword = 'wrongpassword'
      const newPassword = 'newpassword'

      // Create user
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          password: await bcrypt.hash(currentPassword, 10),
          name: 'Test User',
          role: 'VIEWER'
        }
      })

      // Mock auth to return user session
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: 'VIEWER',
          email: null,
          image: null
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as any)

      const request = new Request('http://localhost/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: wrongPassword,
          newPassword
        })
      })

      const response = await changePassword(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Current password is incorrect')

      // Verify password was NOT changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      })

      const isOldPasswordStillValid = await bcrypt.compare(currentPassword, updatedUser!.password)
      expect(isOldPasswordStillValid).toBe(true)
    })
  })
})
