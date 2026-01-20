import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import * as fc from 'fast-check'

describe('Device Creation Defaults Property Test', () => {
  beforeEach(async () => {
    // Clean up devices before each test
    await prisma.device.deleteMany()
  })

  it('Property 14: Device creation with defaults - For any newly created device, if position coordinates are not specified, they must default to (0, 0) and status must default to "unknown"', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 14: Device creation with defaults
    // Validates: Requirements 2.4
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.ipV4(),
        fc.constantFrom('ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (name, ip, type, laneName) => {
          // Clean up before each property iteration
          await prisma.device.deleteMany({ where: { ip } })
          
          // Create device without specifying position or status
          const device = await prisma.device.create({
            data: {
              name,
              ip,
              type,
              laneName
            }
          })
          
          // Verify defaults are applied
          const hasCorrectDefaults = 
            device.positionX === 0 && 
            device.positionY === 0 && 
            device.status === 'unknown'
          
          return hasCorrectDefaults
        }
      ),
      { numRuns: 100 }
    )
  })
})
