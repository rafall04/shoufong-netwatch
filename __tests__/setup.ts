import { beforeAll, afterAll, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { prisma } from '@/lib/prisma'

// Mock ResizeObserver for React Flow
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(async () => {
  // Test environment setup
  // NODE_ENV is automatically set to 'test' by vitest
}, 30000)

afterEach(async () => {
  // Cleanup database connections after each test
  try {
    await prisma.$disconnect()
  } catch (error) {
    // Ignore disconnect errors in test environment
    console.warn('Prisma disconnect warning:', error)
  }
})

afterAll(async () => {
  // Final cleanup
  try {
    await prisma.$disconnect()
  } catch (error) {
    // Ignore disconnect errors in test environment
    console.warn('Prisma disconnect warning:', error)
  }
})