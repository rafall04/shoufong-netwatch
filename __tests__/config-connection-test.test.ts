import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/config/test-connection/route'
import { auth } from '@/auth'
import { RouterOSAPI } from 'node-routeros'
import { NextRequest } from 'next/server'
import * as fc from 'fast-check'

// Mock dependencies
vi.mock('@/auth')
vi.mock('node-routeros')

describe('Connection Test API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create mock request
  const createRequest = (body: any) => {
    return {
      json: async () => body
    } as NextRequest
  }

  describe('Authentication and Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 when user is not ADMIN', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'user@test.com', role: 'VIEWER' }
      } as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should return 400 when mikrotikIp is missing', async () => {
      const request = createRequest({
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when mikrotikUser is missing', async () => {
      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when mikrotikPass is missing', async () => {
      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject invalid IP format', async () => {
      const request = createRequest({
        mikrotikIp: 'invalid-ip',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid IP address format')
    })

    it('should reject port below valid range', async () => {
      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 0
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid port number')
    })

    it('should reject port above valid range', async () => {
      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 65536
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid port number')
    })
  })

  describe('Connection Success', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should successfully connect with valid credentials', async () => {
      const mockApi = {
        connect: vi.fn().mockResolvedValue(undefined),
        write: vi.fn()
          .mockResolvedValueOnce([{ name: 'TestRouter' }])
          .mockResolvedValueOnce([{ version: '7.10' }]),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Successfully connected to MikroTik')
      expect(data.details.ip).toBe('192.168.1.1')
      expect(data.details.port).toBe(8728)
      expect(data.details.version).toBe('7.10')
      expect(data.details.identity).toBe('TestRouter')
      expect(mockApi.connect).toHaveBeenCalled()
      expect(mockApi.close).toHaveBeenCalled()
    })

    it('should use custom port when provided', async () => {
      const mockApi = {
        connect: vi.fn().mockResolvedValue(undefined),
        write: vi.fn()
          .mockResolvedValueOnce([{ name: 'TestRouter' }])
          .mockResolvedValueOnce([{ version: '7.10' }]),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password',
        mikrotikPort: 9999
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.details.port).toBe(9999)
    })
  })

  describe('Connection Failures', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should handle connection timeout', async () => {
      const mockApi = {
        connect: vi.fn().mockRejectedValue(new Error('Connection timeout')),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Connection timeout')
      expect(data.details).toContain('within 10 seconds')
    })

    it('should handle authentication failure', async () => {
      const mockApi = {
        connect: vi.fn().mockRejectedValue(new Error('cannot log in')),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'wrongpassword'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication failed')
      expect(data.details).toBe('Invalid username or password')
    })

    it('should handle connection refused', async () => {
      const mockApi = {
        connect: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Connection refused')
      expect(data.details).toContain('Cannot reach MikroTik')
    })

    it('should handle network unreachable', async () => {
      const mockApi = {
        connect: vi.fn().mockRejectedValue(new Error('EHOSTUNREACH')),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      const request = createRequest({
        mikrotikIp: '192.168.1.1',
        mikrotikUser: 'admin',
        mikrotikPass: 'password'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Network unreachable')
      expect(data.details).toContain('check network connectivity')
    })
  })

  // **Feature: mikrotik-enhancements, Property 1: Connection Test Validation**
  // **Validates: Requirements 1.6, 1.7, 8.1, 8.2**
  describe('Property 1: Connection Test Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should reject any invalid IP format before attempting connection', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid IP addresses
          fc.oneof(
            fc.string().filter(s => !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)),
            fc.constant('999.999.999.999'),
            fc.constant('256.1.1.1'),
            fc.constant('1.256.1.1'),
            fc.constant('1.1.256.1'),
            fc.constant('1.1.1.256'),
            fc.constant('not-an-ip'),
            fc.constant('192.168.1'),
            fc.constant('192.168.1.1.1')
          ),
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // password
          async (invalidIp, username, password) => {
            const request = createRequest({
              mikrotikIp: invalidIp,
              mikrotikUser: username,
              mikrotikPass: password
            })

            const response = await POST(request)
            const data = await response.json()

            // Should reject with invalid IP error
            expect(response.status).toBe(200)
            expect(data.success).toBe(false)
            expect(data.error).toBe('Invalid IP address format')
            
            // Should NOT attempt connection (RouterOSAPI should not be called)
            expect(vi.mocked(RouterOSAPI)).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject any port out of valid range (1-65535) before attempting connection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // password
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.integer({ min: 65536 })
          ),
          async (ip, username, password, invalidPort) => {
            const request = createRequest({
              mikrotikIp: ip,
              mikrotikUser: username,
              mikrotikPass: password,
              mikrotikPort: invalidPort
            })

            const response = await POST(request)
            const data = await response.json()

            // Should reject with invalid port error
            expect(response.status).toBe(200)
            expect(data.success).toBe(false)
            expect(data.error).toBe('Invalid port number')
            
            // Should NOT attempt connection (RouterOSAPI should not be called)
            expect(vi.mocked(RouterOSAPI)).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept valid IP and port combinations', async () => {
      const mockApi = {
        connect: vi.fn().mockResolvedValue(undefined),
        write: vi.fn()
          .mockResolvedValueOnce([{ name: 'TestRouter' }])
          .mockResolvedValueOnce([{ version: '7.10' }]),
        close: vi.fn().mockResolvedValue(undefined)
      }

      vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // password
          fc.integer({ min: 1, max: 65535 }),
          async (ip, username, password, validPort) => {
            vi.clearAllMocks()
            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            const request = createRequest({
              mikrotikIp: ip,
              mikrotikUser: username,
              mikrotikPass: password,
              mikrotikPort: validPort
            })

            const response = await POST(request)
            const data = await response.json()

            // Should accept valid inputs and attempt connection
            expect(response.status).toBe(200)
            // Either success or connection error, but NOT validation error
            if (!data.success) {
              expect(data.error).not.toBe('Invalid IP address format')
              expect(data.error).not.toBe('Invalid port number')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // **Feature: mikrotik-enhancements, Property 2: Connection Test Timeout**
  // **Validates: Requirements 1.8**
  describe('Property 2: Connection Test Timeout', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      } as any)
    })

    it('should complete within 10 seconds or return timeout error for any connection attempt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // password
          fc.integer({ min: 1, max: 65535 }), // valid port
          fc.boolean(), // simulate timeout or success
          async (ip, username, password, port, shouldTimeout) => {
            const startTime = Date.now()
            
            const mockApi = {
              connect: shouldTimeout 
                ? vi.fn().mockRejectedValue(new Error('Connection timeout'))
                : vi.fn().mockResolvedValue(undefined),
              write: vi.fn()
                .mockResolvedValueOnce([{ name: 'TestRouter' }])
                .mockResolvedValueOnce([{ version: '7.10' }]),
              close: vi.fn().mockResolvedValue(undefined)
            }

            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            const request = createRequest({
              mikrotikIp: ip,
              mikrotikUser: username,
              mikrotikPass: password,
              mikrotikPort: port
            })

            const response = await POST(request)
            const data = await response.json()
            const endTime = Date.now()
            const duration = endTime - startTime

            // Operation should complete within 10 seconds (10000ms)
            // Adding 1000ms buffer for test execution overhead
            expect(duration).toBeLessThan(11000)

            // Response should be valid
            expect(response.status).toBe(200)
            
            // If timeout occurred, should have timeout error
            if (shouldTimeout) {
              expect(data.success).toBe(false)
              expect(data.error).toBe('Connection timeout')
              expect(data.details).toContain('within 10 seconds')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return timeout error when connection takes too long', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1 }), // username
          fc.string({ minLength: 1 }), // password
          fc.integer({ min: 1, max: 65535 }), // valid port
          async (ip, username, password, port) => {
            // Mock a connection that times out
            const mockApi = {
              connect: vi.fn().mockRejectedValue(new Error('Connection timeout')),
              close: vi.fn().mockResolvedValue(undefined)
            }

            vi.mocked(RouterOSAPI).mockImplementation(() => mockApi as any)

            const request = createRequest({
              mikrotikIp: ip,
              mikrotikUser: username,
              mikrotikPass: password,
              mikrotikPort: port
            })

            const response = await POST(request)
            const data = await response.json()

            // Should return timeout error
            expect(response.status).toBe(200)
            expect(data.success).toBe(false)
            expect(data.error).toBe('Connection timeout')
            expect(data.details).toContain('within 10 seconds')
            expect(data.details).toContain(ip)
            expect(data.details).toContain(port.toString())
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
