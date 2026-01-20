import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { vi } from 'vitest'
import ProfilePage from '../app/dashboard/profile/page'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = vi.mocked(useSession)

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'testuser',
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    } as any)
  })

  it('renders profile information and password form', () => {
    render(<ProfilePage />)
    
    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Username: testuser')).toBeInTheDocument()
    expect(screen.getByText('Role: ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    const submitButton = screen.getByRole('button', { name: /update password/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Current password is required')).toBeInTheDocument()
      expect(screen.getByText('New password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates new password length', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    const newPasswordInput = screen.getByLabelText('New Password')
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(newPasswordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates password confirmation match', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'oldpass123')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'different123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'oldpass123')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
        }),
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Password updated successfully')).toBeInTheDocument()
    })

    // Form should be cleared after successful submission
    expect(currentPasswordInput).toHaveValue('')
    expect(newPasswordInput).toHaveValue('')
    expect(confirmPasswordInput).toHaveValue('')
  })

  it('handles invalid current password error', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid current password' }),
    })

    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'wrongpass')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument()
    })
  })

  it('handles general server error', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    })

    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'oldpass123')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update password')).toBeInTheDocument()
    })
  })

  it('handles network error', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'oldpass123')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update password')).toBeInTheDocument()
    })
  })

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    // Trigger validation error
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Current password is required')).toBeInTheDocument()
    })

    // Start typing to clear error
    await user.type(currentPasswordInput, 'a')
    await waitFor(() => {
      expect(screen.queryByText('Current password is required')).not.toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    // Mock a slow response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      }), 100))
    )

    render(<ProfilePage />)

    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })

    await user.type(currentPasswordInput, 'oldpass123')
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'newpass123')
    await user.click(submitButton)

    // Check that form is disabled during submission
    expect(screen.getByRole('button', { name: /updating.../i })).toBeInTheDocument()
    expect(currentPasswordInput).toBeDisabled()
    expect(newPasswordInput).toBeDisabled()
    expect(confirmPasswordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('Password updated successfully')).toBeInTheDocument()
    })
  })
})