import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'

describe('Device Position Persistence Property Test', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await prisma.device.deleteMany()
  })

  it('Property 5: Position persistence - For any device, after updating its position coordinates (positionX, positionY) in the database, retrieving the device should return the same coordinates', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 5: Position persistence
    // Validates: Requirements 5.5, 5.6
    
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        async (x, y) => {
          // Create a test device
          const device = await prisma.device.create({
            data: {
              name: 'Test Device',
              ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
              type: 'ROUTER',
              laneName: 'Test Lane',
              status: 'unknown',
              positionX: 0,
              positionY: 0
            }
          })
          
          // Update device position
          await prisma.device.update({
            where: { id: device.id },
            data: {
              positionX: x,
              positionY: y
            }
          })
          
          // Retrieve the device
          const retrieved = await prisma.device.findUnique({
            where: { id: device.id }
          })
          
          // Clean up
          await prisma.device.delete({ where: { id: device.id } })
          
          // Verify position persistence with tolerance for SQLite floating point precision
          // SQLite has limited precision for very small numbers, so we use relative epsilon
          // for numbers close to zero and absolute epsilon for larger numbers
          const epsilon = 1e-6 // Relaxed epsilon to account for SQLite precision
          const relativeEpsilon = 1e-5
          
          if (retrieved === null) return false
          
          // For very small numbers (close to zero), use absolute epsilon
          // For larger numbers, use relative epsilon
          const xMatch = Math.abs(x) < epsilon 
            ? Math.abs(retrieved.positionX - x) < epsilon
            : Math.abs(retrieved.positionX - x) / Math.abs(x) < relativeEpsilon
            
          const yMatch = Math.abs(y) < epsilon
            ? Math.abs(retrieved.positionY - y) < epsilon
            : Math.abs(retrieved.positionY - y) / Math.abs(y) < relativeEpsilon
          
          return xMatch && yMatch
        }
      ),
      { numRuns: 100 }
    )
  })
})
