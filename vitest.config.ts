import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 3,
        minForks: 1,
      },
    },
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/server': path.resolve(__dirname, './__tests__/__mocks__/next/server.ts'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
})
