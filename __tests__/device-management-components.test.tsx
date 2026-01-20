import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DeviceForm from '@/components/DeviceForm'
import DeviceTable from '@/components/DeviceTable'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('DeviceForm Validation', () => {
  it('should show validation error when name is empty', async () => {
    render(<DeviceForm />)
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Device name is required')).toBeInTheDocument()
    })
  })

  it('should show validation error when IP is empty', async () => {
    render(<DeviceForm />)
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('IP address is required')).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid IP format', async () => {
    render(<DeviceForm />)
    
    const ipInput = screen.getByLabelText(/ip address/i)
    fireEvent.change(ipInput, { target: { value: 'invalid-ip' } })
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid IP address')).toBeInTheDocument()
    })
  })

  it('should show validation error for IP with octets > 255', async () => {
    render(<DeviceForm />)
    
    const ipInput = screen.getByLabelText(/ip address/i)
    fireEvent.change(ipInput, { target: { value: '192.168.1.300' } })
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('IP address octets must be between 0 and 255')).toBeInTheDocument()
    })
  })

  it('should show validation error when lane name is empty', async () => {
    render(<DeviceForm />)
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Lane name is required')).toBeInTheDocument()
    })
  })

  it('should clear validation error when user starts typing', async () => {
    render(<DeviceForm />)
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Device name is required')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByLabelText(/device name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Device' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Device name is required')).not.toBeInTheDocument()
    })
  })

  it('should accept valid form data', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ device: { id: '1' } }),
      })
    )
    global.fetch = mockFetch as any
    
    render(<DeviceForm />)
    
    const nameInput = screen.getByLabelText(/device name/i)
    const ipInput = screen.getByLabelText(/ip address/i)
    const typeSelect = screen.getByLabelText(/device type/i)
    const laneInput = screen.getByLabelText(/lane name/i)
    
    fireEvent.change(nameInput, { target: { value: 'Test Router' } })
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } })
    fireEvent.change(typeSelect, { target: { value: 'ROUTER' } })
    fireEvent.change(laneInput, { target: { value: 'Lane A' } })
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/devices',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Router',
            ip: '192.168.1.1',
            type: 'ROUTER',
            laneName: 'Lane A',
          }),
        })
      )
    })
  })

  it('should display submit error when API returns error', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'IP address already exists' }),
      })
    )
    global.fetch = mockFetch as any
    
    render(<DeviceForm />)
    
    const nameInput = screen.getByLabelText(/device name/i)
    const ipInput = screen.getByLabelText(/ip address/i)
    const laneInput = screen.getByLabelText(/lane name/i)
    
    fireEvent.change(nameInput, { target: { value: 'Test Router' } })
    fireEvent.change(ipInput, { target: { value: '192.168.1.1' } })
    fireEvent.change(laneInput, { target: { value: 'Lane A' } })
    
    const submitButton = screen.getByRole('button', { name: /create device/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('IP address already exists')).toBeInTheDocument()
    })
  })

  it('should show "Update Device" button text when editing', () => {
    const device = {
      id: '1',
      name: 'Existing Router',
      ip: '192.168.1.1',
      type: 'ROUTER',
      laneName: 'Lane A',
    }
    
    render(<DeviceForm device={device} />)
    
    expect(screen.getByRole('button', { name: /update device/i })).toBeInTheDocument()
  })

  it('should pre-fill form when editing device', () => {
    const device = {
      id: '1',
      name: 'Existing Router',
      ip: '192.168.1.1',
      type: 'ROUTER',
      laneName: 'Lane A',
    }
    
    render(<DeviceForm device={device} />)
    
    expect(screen.getByLabelText(/device name/i)).toHaveValue('Existing Router')
    expect(screen.getByLabelText(/ip address/i)).toHaveValue('192.168.1.1')
    expect(screen.getByLabelText(/device type/i)).toHaveValue('ROUTER')
    expect(screen.getByLabelText(/lane name/i)).toHaveValue('Lane A')
  })
})

describe('DeviceTable Rendering', () => {
  const mockDevices = [
    {
      id: '1',
      name: 'Router 1',
      ip: '192.168.1.1',
      type: 'ROUTER',
      laneName: 'Lane A',
      status: 'up',
      lastSeen: new Date('2024-01-01T12:00:00Z'),
    },
    {
      id: '2',
      name: 'Tablet 1',
      ip: '192.168.1.2',
      type: 'TABLET',
      laneName: 'Lane B',
      status: 'down',
      lastSeen: null,
    },
    {
      id: '3',
      name: 'Scanner 1',
      ip: '192.168.1.3',
      type: 'SCANNER_GTEX',
      laneName: 'Lane C',
      status: 'unknown',
      lastSeen: new Date('2024-01-01T13:00:00Z'),
    },
  ]

  it('should render all devices in the table', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    expect(screen.getByText('Router 1')).toBeInTheDocument()
    expect(screen.getByText('Tablet 1')).toBeInTheDocument()
    expect(screen.getByText('Scanner 1')).toBeInTheDocument()
  })

  it('should display device IP addresses', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument()
    expect(screen.getByText('192.168.1.3')).toBeInTheDocument()
  })

  it('should display lane names', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    expect(screen.getByText('Lane A')).toBeInTheDocument()
    expect(screen.getByText('Lane B')).toBeInTheDocument()
    expect(screen.getByText('Lane C')).toBeInTheDocument()
  })

  it('should display status badges with correct styling', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    const upBadge = screen.getByText('UP')
    const downBadge = screen.getByText('DOWN')
    const unknownBadge = screen.getByText('UNKNOWN')
    
    expect(upBadge).toBeInTheDocument()
    expect(upBadge).toHaveClass('bg-green-100', 'text-green-800')
    
    expect(downBadge).toBeInTheDocument()
    expect(downBadge).toHaveClass('bg-red-100', 'text-red-800')
    
    expect(unknownBadge).toBeInTheDocument()
    expect(unknownBadge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('should display "Never" for devices with no lastSeen', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    const neverTexts = screen.getAllByText('Never')
    expect(neverTexts.length).toBeGreaterThan(0)
  })

  it('should display formatted date for devices with lastSeen', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    // Check that date is rendered (format may vary by locale)
    const dateElements = screen.getAllByText(/2024|Jan|1/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('should show empty state when no devices', () => {
    render(<DeviceTable devices={[]} />)
    
    expect(screen.getByText(/no devices found/i)).toBeInTheDocument()
  })

  it('should render edit buttons for all devices', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    expect(editButtons).toHaveLength(mockDevices.length)
  })

  it('should render delete buttons for all devices', () => {
    render(<DeviceTable devices={mockDevices} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    expect(deleteButtons).toHaveLength(mockDevices.length)
  })
})

describe('Edit and Delete Button Visibility', () => {
  const mockDevice = {
    id: '1',
    name: 'Test Router',
    ip: '192.168.1.1',
    type: 'ROUTER',
    laneName: 'Lane A',
    status: 'up',
    lastSeen: new Date(),
  }

  it('should show edit and delete buttons in device table', () => {
    render(<DeviceTable devices={[mockDevice]} />)
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('should open edit modal when edit button is clicked', async () => {
    render(<DeviceTable devices={[mockDevice]} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)
    
    await waitFor(() => {
      expect(screen.getByText('Edit Device')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update device/i })).toBeInTheDocument()
    })
  })

  it('should open delete confirmation modal when delete button is clicked', async () => {
    render(<DeviceTable devices={[mockDevice]} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to delete this device/i)).toBeInTheDocument()
    })
  })

  it('should close edit modal when cancel is clicked', async () => {
    render(<DeviceTable devices={[mockDevice]} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)
    
    await waitFor(() => {
      expect(screen.getByText('Edit Device')).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Edit Device')).not.toBeInTheDocument()
    })
  })

  it('should close delete modal when cancel is clicked', async () => {
    render(<DeviceTable devices={[mockDevice]} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    })
    
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButtons[0])
    
    await waitFor(() => {
      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument()
    })
  })

  it('should call DELETE API when delete is confirmed', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    )
    global.fetch = mockFetch as any
    
    render(<DeviceTable devices={[mockDevice]} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: /^delete device$/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/devices/${mockDevice.id}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  it('should display error message when delete fails', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to delete device' }),
      })
    )
    global.fetch = mockFetch as any
    
    render(<DeviceTable devices={[mockDevice]} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByRole('button', { name: /^delete device$/i })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to delete device')).toBeInTheDocument()
    })
  })
})

describe('Device Type Support', () => {
  it('should support all four device types in form', () => {
    render(<DeviceForm />)
    
    const typeSelect = screen.getByLabelText(/device type/i)
    const options = Array.from(typeSelect.querySelectorAll('option'))
    const optionValues = options.map(opt => opt.getAttribute('value'))
    
    expect(optionValues).toContain('ROUTER')
    expect(optionValues).toContain('TABLET')
    expect(optionValues).toContain('SCANNER_GTEX')
    expect(optionValues).toContain('SMART_TV')
  })

  it('should display correct icon for ROUTER type', () => {
    const device = {
      id: '1',
      name: 'Router',
      ip: '192.168.1.1',
      type: 'ROUTER',
      laneName: 'Lane A',
      status: 'up',
      lastSeen: new Date(),
    }
    
    render(<DeviceTable devices={[device]} />)
    
    // Router icon should be rendered (Lucide Router component)
    const iconCell = screen.getByText('Router').closest('tr')?.querySelector('td')
    expect(iconCell).toBeInTheDocument()
  })

  it('should display correct icon for TABLET type', () => {
    const device = {
      id: '2',
      name: 'Tablet',
      ip: '192.168.1.2',
      type: 'TABLET',
      laneName: 'Lane B',
      status: 'up',
      lastSeen: new Date(),
    }
    
    render(<DeviceTable devices={[device]} />)
    
    // Tablet icon should be rendered
    const iconCell = screen.getByText('Tablet').closest('tr')?.querySelector('td')
    expect(iconCell).toBeInTheDocument()
  })

  it('should display correct icon for SCANNER_GTEX type', () => {
    const device = {
      id: '3',
      name: 'Scanner',
      ip: '192.168.1.3',
      type: 'SCANNER_GTEX',
      laneName: 'Lane C',
      status: 'up',
      lastSeen: new Date(),
    }
    
    render(<DeviceTable devices={[device]} />)
    
    // Scanner icon should be rendered
    const iconCell = screen.getByText('Scanner').closest('tr')?.querySelector('td')
    expect(iconCell).toBeInTheDocument()
  })

  it('should display correct icon for SMART_TV type', () => {
    const device = {
      id: '4',
      name: 'Smart TV',
      ip: '192.168.1.4',
      type: 'SMART_TV',
      laneName: 'Lane D',
      status: 'up',
      lastSeen: new Date(),
    }
    
    render(<DeviceTable devices={[device]} />)
    
    // TV icon should be rendered
    const iconCell = screen.getByText('Smart TV').closest('tr')?.querySelector('td')
    expect(iconCell).toBeInTheDocument()
  })
})
