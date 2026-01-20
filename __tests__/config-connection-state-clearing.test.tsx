import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import SystemConfigPage from '../app/dashboard/admin/config/page'
import * as fc from 'fast-check'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = vi.mocked(useSession)

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('Config Page - Connection Test State Clearing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()

    const mockConfig = {
      id: 1,
      pollingInterval: 30,
      mikrotikIp: '192.168.1.1',
      mikrotikUser: 'admin',
      mikrotikPass: 'password',
      mikrotikPort: 8728,
      updatedAt: '2024-01-01T00:00:00Z'
    }

    mockUseSession.mockReturnValue({
      data: { user: { id: '1', role: 'ADMIN' }, expires: '2024-12-31T23:59:59.999Z' },
      status: 'authenticated',
      update: vi.fn()
    })

    // Mock the initial config fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ config: mockConfig })
    } as Response)
  })

  // **Feature: mikrotik-enhancements, Property 7: Connection Test State Clearing**
  // **Validates: Requirements 1.9**
  describe('Property 7: Connection Test State Clearing', () => {
    it('should clear connection status when any MikroTik field changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ip: fc.ipV4(),
            user: fc.string({ minLength: 1, maxLength: 20 }),
            pass: fc.string({ minLength: 1, maxLength: 20 }),
            port: fc.integer({ min: 1, max: 65535 })
          }),
          fc.record({
            ip: fc.ipV4(),
            user: fc.string({ minLength: 1, maxLength: 20 }),
            pass: fc.string({ minLength: 1, maxLength: 20 }),
            port: fc.integer({ min: 1, max: 65535 })
          }),
          fc.constantFrom('mikrotikIp', 'mikrotikUser', 'mikrotikPass', 'mikrotikPort'),
          async (initialConfig, newConfig, fieldToChange) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            mockFetch.mockClear()

            const mockConfigData = {
              id: 1,
              pollingInterval: 30,
              mikrotikIp: initialConfig.ip,
              mikrotikUser: initialConfig.user,
              mikrotikPass: initialConfig.pass,
              mikrotikPort: initialConfig.port,
              updatedAt: '2024-01-01T00:00:00Z'
            }

            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ config: mockConfigData })
            } as Response)

            const user = userEvent.setup()
            const { unmount } = render(<SystemConfigPage />)

            // Wait for page to load
            await waitFor(() => {
              expect(screen.getByText('System Configuration')).toBeInTheDocument()
            })

            // Mock successful connection test
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                message: 'Successfully connected to MikroTik',
                details: {
                  ip: initialConfig.ip,
                  port: initialConfig.port,
                  version: '7.10',
                  identity: 'TestRouter'
                }
              })
            } as Response)

            // Click test connection button
            const testButton = screen.getByRole('button', { name: /test connection/i })
            await user.click(testButton)

            // Wait for connection status to appear
            await waitFor(() => {
              expect(screen.getByText(/successfully connected/i)).toBeInTheDocument()
            }, { timeout: 3000 })

            // Verify connection status is displayed
            expect(screen.getByText(/successfully connected/i)).toBeInTheDocument()

            // Now change the specified field
            let inputElement: HTMLElement
            let newValue: string

            switch (fieldToChange) {
              case 'mikrotikIp':
                inputElement = screen.getByLabelText(/mikrotik ip address/i)
                newValue = newConfig.ip
                break
              case 'mikrotikUser':
                inputElement = screen.getByLabelText(/mikrotik username/i)
                newValue = newConfig.user
                break
              case 'mikrotikPass':
                inputElement = screen.getByLabelText(/mikrotik password/i)
                newValue = newConfig.pass
                break
              case 'mikrotikPort':
                inputElement = screen.getByLabelText(/mikrotik api port/i)
                newValue = newConfig.port.toString()
                break
              default:
                throw new Error('Invalid field')
            }

            // Change the field value
            await user.clear(inputElement)
            await user.type(inputElement, newValue)

            // Wait a bit for state updates
            await waitFor(() => {
              // Connection status should be cleared
              expect(screen.queryByText(/successfully connected/i)).not.toBeInTheDocument()
            }, { timeout: 3000 })

            // Verify connection status is no longer displayed
            expect(screen.queryByText(/successfully connected/i)).not.toBeInTheDocument()
            expect(screen.queryByText(/TestRouter/i)).not.toBeInTheDocument()

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear connection status for both success and error states', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 65535 }),
          fc.boolean(), // success or error
          fc.constantFrom('mikrotikIp', 'mikrotikUser', 'mikrotikPass', 'mikrotikPort'),
          fc.string({ minLength: 1, maxLength: 20 }), // new value
          async (ip, user, pass, port, isSuccess, fieldToChange, newValue) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            mockFetch.mockClear()

            const mockConfigData = {
              id: 1,
              pollingInterval: 30,
              mikrotikIp: ip,
              mikrotikUser: user,
              mikrotikPass: pass,
              mikrotikPort: port,
              updatedAt: '2024-01-01T00:00:00Z'
            }

            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ config: mockConfigData })
            } as Response)

            const userEvent = await import('@testing-library/user-event')
            const userSetup = userEvent.default.setup()
            const { unmount } = render(<SystemConfigPage />)

            // Wait for page to load
            await waitFor(() => {
              expect(screen.getByText('System Configuration')).toBeInTheDocument()
            })

            // Mock connection test response (success or error)
            if (isSuccess) {
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  success: true,
                  message: 'Successfully connected to MikroTik',
                  details: {
                    ip: ip,
                    port: port,
                    version: '7.10',
                    identity: 'TestRouter'
                  }
                })
              } as Response)
            } else {
              mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  success: false,
                  error: 'Connection failed',
                  details: 'Authentication failed'
                })
              } as Response)
            }

            // Click test connection button
            const testButton = screen.getByRole('button', { name: /test connection/i })
            await userSetup.click(testButton)

            // Wait for connection status to appear
            await waitFor(() => {
              if (isSuccess) {
                expect(screen.getByText(/successfully connected/i)).toBeInTheDocument()
              } else {
                expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
              }
            }, { timeout: 3000 })

            // Get the input field
            let inputElement: HTMLElement

            switch (fieldToChange) {
              case 'mikrotikIp':
                inputElement = screen.getByLabelText(/mikrotik ip address/i)
                break
              case 'mikrotikUser':
                inputElement = screen.getByLabelText(/mikrotik username/i)
                break
              case 'mikrotikPass':
                inputElement = screen.getByLabelText(/mikrotik password/i)
                break
              case 'mikrotikPort':
                inputElement = screen.getByLabelText(/mikrotik api port/i)
                break
              default:
                throw new Error('Invalid field')
            }

            // Change the field value
            await userSetup.clear(inputElement)
            await userSetup.type(inputElement, newValue)

            // Wait for state updates
            await waitFor(() => {
              // Connection status should be cleared (both success and error)
              expect(screen.queryByText(/successfully connected/i)).not.toBeInTheDocument()
              expect(screen.queryByText(/connection failed/i)).not.toBeInTheDocument()
            }, { timeout: 3000 })

            // Verify connection status is no longer displayed
            expect(screen.queryByText(/successfully connected/i)).not.toBeInTheDocument()
            expect(screen.queryByText(/connection failed/i)).not.toBeInTheDocument()

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not clear connection status when non-MikroTik fields change', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 65535 }),
          fc.integer({ min: 10, max: 300 }), // new polling interval
          async (ip, user, pass, port, newPollingInterval) => {
            // Reset mocks for each iteration
            vi.clearAllMocks()
            mockFetch.mockClear()

            const mockConfigData = {
              id: 1,
              pollingInterval: 30,
              mikrotikIp: ip,
              mikrotikUser: user,
              mikrotikPass: pass,
              mikrotikPort: port,
              updatedAt: '2024-01-01T00:00:00Z'
            }

            mockFetch.mockResolvedValue({
              ok: true,
              json: async () => ({ config: mockConfigData })
            } as Response)

            const userEvent = await import('@testing-library/user-event')
            const userSetup = userEvent.default.setup()
            const { unmount } = render(<SystemConfigPage />)

            // Wait for page to load
            await waitFor(() => {
              expect(screen.getByText('System Configuration')).toBeInTheDocument()
            })

            // Mock successful connection test
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                message: 'Successfully connected to MikroTik',
                details: {
                  ip: ip,
                  port: port,
                  version: '7.10',
                  identity: 'TestRouter'
                }
              })
            } as Response)

            // Click test connection button
            const testButton = screen.getByRole('button', { name: /test connection/i })
            await userSetup.click(testButton)

            // Wait for connection status to appear
            await waitFor(() => {
              expect(screen.getByText(/successfully connected/i)).toBeInTheDocument()
            }, { timeout: 3000 })

            // Change polling interval (non-MikroTik field)
            const pollingInput = screen.getByLabelText(/polling interval/i)
            await userSetup.clear(pollingInput)
            await userSetup.type(pollingInput, newPollingInterval.toString())

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100))

            // Connection status should still be displayed (NOT cleared)
            expect(screen.getByText(/successfully connected/i)).toBeInTheDocument()
            expect(screen.getByText(/TestRouter/i)).toBeInTheDocument()

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
