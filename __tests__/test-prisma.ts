import { vi } from 'vitest'

// Create a mock Prisma client for testing
export const testPrisma = {
  device: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  systemConfig: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}

// Helper function to reset mocks between tests
export function resetMocks() {
  vi.clearAllMocks()
}

// Helper function to clean up test data (no-op for mocked client)
export async function cleanupTestData() {
  // Reset mocks instead of cleaning database
  resetMocks()
}