import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SystemConfigPage from '../app/dashboard/admin/config/page'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = vi.mocked(useSession)

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))
const mockRedirect = vi.mocked(redirect)

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('SystemConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Access Control', () => {
    it('redirects unauthenticated users to login', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn()
      })

      render(<SystemConfigPage />)

      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('redirects non-ADMIN users to map page', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '2', role: 'OPERATOR' }, expires: '2024-12-31T23:59:59.999Z' },
        status: 'authenticated',
        update: vi.fn()
      })

      render(<SystemConfigPage />)

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard/map')
    })

    it('allows ADMIN users to access the page', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: mockConfig })
      } as Response)

      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByText('System Configuration')).toBeInTheDocument()
      })

      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
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

      // Reset and setup fetch mock properly
      mockFetch.mockReset()
      
      // Mock the initial config fetch
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ config: mockConfig })
      } as Response)
    })

    it('validates polling interval is positive integer', async () => {
      const user = userEvent.setup()
      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      })

      const pollingInput = screen.getByLabelText(/polling interval/i)
      const submitButton = screen.getByRole('button', { name: /save configuration/i })

      // Test zero value - this should trigger validation
      await user.clear(pollingInput)
      await user.type(pollingInput, '0')
      
      // Debug: Check the input value
      expect(pollingInput).toHaveValue(0)
      
      await user.click(submitButton)

      // Debug: Check if any error messages exist
      const errorMessages = screen.queryAllByText(/must be/i)
      console.log('Error messages found:', errorMessages.map(el => el.textContent))

      await waitFor(() => {
        expect(screen.getByText('Polling interval must be a positive number')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(mockFetch).toHaveBeenCalledTimes(1) // Only the initial fetch
    })

    it('validates port range', async () => {
      const user = userEvent.setup()
      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('8728')).toBeInTheDocument()
      })

      const portInput = screen.getByLabelText(/mikrotik api port/i)
      const submitButton = screen.getByRole('button', { name: /save configuration/i })

      // Test invalid port (too high)
      await user.clear(portInput)
      await user.type(portInput, '70000')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Port must be between 1 and 65535')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Test invalid port (zero)
      await user.clear(portInput)
      await user.type(portInput, '0')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Port must be between 1 and 65535')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(mockFetch).toHaveBeenCalledTimes(1) // Only the initial fetch
    })

    it('clears validation errors when field is corrected', async () => {
      const user = userEvent.setup()
      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      })

      const pollingInput = screen.getByLabelText(/polling interval/i)
      const submitButton = screen.getByRole('button', { name: /save configuration/i })

      // Create error
      await user.clear(pollingInput)
      await user.type(pollingInput, '0')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Polling interval must be a positive number')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Fix error
      await user.clear(pollingInput)
      await user.type(pollingInput, '60')

      await waitFor(() => {
        expect(screen.queryByText('Polling interval must be a positive number')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
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

      // Reset fetch mock
      mockFetch.mockReset()
      
      // Mock the initial config fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: mockConfig })
      } as Response)
    })

    it('successfully updates configuration', async () => {
      const user = userEvent.setup()
      const updatedConfig = {
        id: 1,
        pollingInterval: 60,
        mikrotikIp: '192.168.1.2',
        mikrotikUser: 'newadmin',
        mikrotikPass: 'newpassword',
        mikrotikPort: 8729,
        updatedAt: '2024-01-01T01:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: updatedConfig })
      } as Response)

      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      })

      // Update form fields
      const pollingInput = screen.getByLabelText(/polling interval/i)
      const ipInput = screen.getByLabelText(/mikrotik ip address/i)
      const userInput = screen.getByLabelText(/mikrotik username/i)
      const passInput = screen.getByLabelText(/mikrotik password/i)
      const portInput = screen.getByLabelText(/mikrotik api port/i)

      await user.clear(pollingInput)
      await user.type(pollingInput, '60')
      
      await user.clear(ipInput)
      await user.type(ipInput, '192.168.1.2')
      
      await user.clear(userInput)
      await user.type(userInput, 'newadmin')
      
      await user.clear(passInput)
      await user.type(passInput, 'newpassword')
      
      await user.clear(portInput)
      await user.type(portInput, '8729')

      const submitButton = screen.getByRole('button', { name: /save configuration/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Configuration updated successfully')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenLastCalledWith('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pollingInterval: 60,
          mikrotikIp: '192.168.1.2',
          mikrotikUser: 'newadmin',
          mikrotikPass: 'newpassword',
          mikrotikPort: 8729
        })
      })
    })

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid configuration' })
      } as Response)

      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /save configuration/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid configuration')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ config: {} })
          } as Response), 100)
        )
      )

      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /save configuration/i })
      await user.click(submitButton)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.getByText('Save Configuration')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('shows loading state initially', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '1', role: 'ADMIN' }, expires: '2024-12-31T23:59:59.999Z' },
        status: 'authenticated',
        update: vi.fn()
      })

      mockFetch.mockImplementationOnce(() => 
        new Promise(() => {}) // Never resolves
      )

      render(<SystemConfigPage />)

      expect(screen.getByText('Loading configuration...')).toBeInTheDocument()
    })

    it('handles fetch errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '1', role: 'ADMIN' }, expires: '2024-12-31T23:59:59.999Z' },
        status: 'authenticated',
        update: vi.fn()
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<SystemConfigPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load configuration')).toBeInTheDocument()
      })
    })
  })
})