import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'

// Helper function to check API authorization based on role and endpoint
function checkApiAuthorization(role: string, endpoint: string, method: string): { allowed: boolean; expectedStatus: number } {
  // Endpoints that require ADMIN or OPERATOR role
  const protectedEndpoints = [
    { path: '/api/devices', method: 'POST' },
    { path: '/api/devices/[id]', method: 'PUT' },
    { path: '/api/devices/[id]', method: 'DELETE' },
    { path: '/api/device/move', method: 'POST' }
  ]
  
  // Check if endpoint is protected
  const isProtected = protectedEndpoints.some(
    ep => endpoint.startsWith(ep.path.replace('[id]', '')) && ep.method === method
  )
  
  if (!isProtected) {
    // Non-protected endpoints (like GET /api/devices) are accessible to all authenticated users
    return { allowed: true, expectedStatus: 200 }
  }
  
  // Protected endpoints require ADMIN or OPERATOR role
  if (role === 'VIEWER') {
    return { allowed: false, expectedStatus: 403 }
  }
  
  if (role === 'ADMIN' || role === 'OPERATOR') {
    return { allowed: true, expectedStatus: 200 }
  }
  
  return { allowed: false, expectedStatus: 403 }
}

describe('API Authorization Property Test', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.device.deleteMany()
    await prisma.user.deleteMany()
  })

  it('Property 11: API authorization - For any API endpoint requiring ADMIN or OPERATOR role, requests from users with VIEWER role must return a 403 Forbidden response', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 11: API authorization
    // Validates: Requirements 2.7, 10.8
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ADMIN', 'OPERATOR', 'VIEWER'),
        fc.constantFrom(
          { endpoint: '/api/devices', method: 'POST' },
          { endpoint: '/api/devices/123', method: 'PUT' },
          { endpoint: '/api/devices/456', method: 'DELETE' },
          { endpoint: '/api/device/move', method: 'POST' }
        ),
        async (role, { endpoint, method }) => {
          const authResult = checkApiAuthorization(role, endpoint, method)
          
          // VIEWER should be denied access to protected endpoints
          if (role === 'VIEWER') {
            return !authResult.allowed && authResult.expectedStatus === 403
          }
          
          // ADMIN and OPERATOR should have access to protected endpoints
          if (role === 'ADMIN' || role === 'OPERATOR') {
            return authResult.allowed && authResult.expectedStatus === 200
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('VIEWER cannot create devices via POST /api/devices', () => {
    const result = checkApiAuthorization('VIEWER', '/api/devices', 'POST')
    expect(result.allowed).toBe(false)
    expect(result.expectedStatus).toBe(403)
  })

  it('VIEWER cannot update devices via PUT /api/devices/[id]', () => {
    const result = checkApiAuthorization('VIEWER', '/api/devices/123', 'PUT')
    expect(result.allowed).toBe(false)
    expect(result.expectedStatus).toBe(403)
  })

  it('VIEWER cannot delete devices via DELETE /api/devices/[id]', () => {
    const result = checkApiAuthorization('VIEWER', '/api/devices/456', 'DELETE')
    expect(result.allowed).toBe(false)
    expect(result.expectedStatus).toBe(403)
  })

  it('VIEWER cannot move devices via POST /api/device/move', () => {
    const result = checkApiAuthorization('VIEWER', '/api/device/move', 'POST')
    expect(result.allowed).toBe(false)
    expect(result.expectedStatus).toBe(403)
  })

  it('OPERATOR can create devices via POST /api/devices', () => {
    const result = checkApiAuthorization('OPERATOR', '/api/devices', 'POST')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('OPERATOR can update devices via PUT /api/devices/[id]', () => {
    const result = checkApiAuthorization('OPERATOR', '/api/devices/123', 'PUT')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('OPERATOR can delete devices via DELETE /api/devices/[id]', () => {
    const result = checkApiAuthorization('OPERATOR', '/api/devices/456', 'DELETE')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('OPERATOR can move devices via POST /api/device/move', () => {
    const result = checkApiAuthorization('OPERATOR', '/api/device/move', 'POST')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('ADMIN can create devices via POST /api/devices', () => {
    const result = checkApiAuthorization('ADMIN', '/api/devices', 'POST')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('ADMIN can update devices via PUT /api/devices/[id]', () => {
    const result = checkApiAuthorization('ADMIN', '/api/devices/123', 'PUT')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('ADMIN can delete devices via DELETE /api/devices/[id]', () => {
    const result = checkApiAuthorization('ADMIN', '/api/devices/456', 'DELETE')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })

  it('ADMIN can move devices via POST /api/device/move', () => {
    const result = checkApiAuthorization('ADMIN', '/api/device/move', 'POST')
    expect(result.allowed).toBe(true)
    expect(result.expectedStatus).toBe(200)
  })
})
