import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

describe('Authentication - Password Hashing', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany()
  })

  it('Property 7: Password hashing - For any user password stored in the database, it must be a bcrypt hash, not plaintext', async () => {
    // Feature: mikrotik-netwatch-dashboard, Property 7: Password hashing
    // Validates: Requirements 1.2, 7.3
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.string({ minLength: 3, maxLength: 20 }),
        fc.string({ minLength: 3, maxLength: 50 }),
        async (password, username, name) => {
          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10)
          
          // Create user with hashed password
          const user = await prisma.user.create({
            data: {
              username: `test_${username}_${Date.now()}_${Math.random()}`,
              password: hashedPassword,
              name: name,
              role: 'VIEWER'
            }
          })

          // Retrieve the user from database
          const storedUser = await prisma.user.findUnique({
            where: { id: user.id }
          })

          // Clean up
          await prisma.user.delete({ where: { id: user.id } })

          // Verify password is not stored as plaintext
          const isNotPlaintext = storedUser!.password !== password
          
          // Verify password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
          const isBcryptHash = /^\$2[aby]\$/.test(storedUser!.password)
          
          return isNotPlaintext && isBcryptHash
        }
      ),
      { numRuns: 100 }
    )
  }, 30000)
})
