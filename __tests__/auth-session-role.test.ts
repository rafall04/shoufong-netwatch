import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { auth } from '../auth'

describe('Authentication - Session Role Inclusion', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany()
  })

  it('Property 8: Session role inclusion - For any authenticated session, the session object must contain the user role', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 8: Session role inclusion
    // Validates: Requirements 1.3
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ADMIN', 'OPERATOR', 'VIEWER'),
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.string({ minLength: 3, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 50 }),
        async (role, username, name, password) => {
          // Create user with specific role
          const hashedPassword = await bcrypt.hash(password, 10)
          
          const user = await prisma.user.create({
            data: {
              username: `test_${username}_${Date.now()}_${Math.random()}`,
              password: hashedPassword,
              name: name,
              role: role as 'ADMIN' | 'OPERATOR' | 'VIEWER'
            }
          })

          // Simulate session creation by calling JWT callback
          const mockUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          }

          // Simulate JWT token creation
          const mockToken: any = {}
          
          // Call the JWT callback from auth config
          // This simulates what happens during authentication
          const token = await (auth as any).options.callbacks.jwt({
            token: mockToken,
            user: mockUser
          })

          // Simulate session creation from token
          const mockSession: any = {
            user: {
              id: '',
              name: '',
              role: ''
            }
          }

          const session = await (auth as any).options.callbacks.session({
            session: mockSession,
            token: token
          })

          // Clean up
          await prisma.user.delete({ where: { id: user.id } })

          // Verify session contains the role
          return session.user.role === role
        }
      ),
      { numRuns: 100 }
    )
  })
})
