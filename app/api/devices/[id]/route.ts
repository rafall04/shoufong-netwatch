import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DEVICE_TYPES, isValidDeviceType } from '@/lib/constants'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/devices/[id]
 * Update device configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check role - only ADMIN and OPERATOR can update devices
    if (session.user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const id = params.id
    const body = await request.json()
    const { 
      name, 
      ip, 
      type, 
      laneName,
      roomId,
      netwatchTimeout,
      netwatchInterval,
      netwatchUpScript,
      netwatchDownScript
    } = body
    
    // Validate required fields
    if (!name || !ip || !type || !laneName) {
      return NextResponse.json(
        { error: 'Name, IP, type, and lane name are required' },
        { status: 400 }
      )
    }
    
    // Validate device type
    if (!isValidDeviceType(type)) {
      return NextResponse.json(
        { 
          error: 'Invalid device type',
          details: `Type must be one of: ${DEVICE_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }
    
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      )
    }
    
    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id }
    })
    
    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Check IP uniqueness (if IP changed)
    if (ip !== existingDevice.ip) {
      const ipExists = await prisma.device.findUnique({
        where: { ip }
      })
      
      if (ipExists) {
        return NextResponse.json(
          { error: 'IP address already exists' },
          { status: 400 }
        )
      }
    }
    
    // Validate netwatch settings if provided
    if (netwatchTimeout !== undefined) {
      if (netwatchTimeout < 100 || netwatchTimeout > 10000) {
        return NextResponse.json(
          { error: 'Netwatch timeout must be between 100ms and 10000ms' },
          { status: 400 }
        )
      }
    }
    
    if (netwatchInterval !== undefined) {
      if (netwatchInterval < 5 || netwatchInterval > 3600) {
        return NextResponse.json(
          { error: 'Netwatch interval must be between 5s and 3600s' },
          { status: 400 }
        )
      }
    }
    
    // Update device
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        name,
        ip,
        type,
        laneName,
        roomId: roomId || null,
        netwatchTimeout: netwatchTimeout !== undefined ? netwatchTimeout : 1000,
        netwatchInterval: netwatchInterval !== undefined ? netwatchInterval : 5,
        netwatchUpScript: netwatchUpScript || null,
        netwatchDownScript: netwatchDownScript || null
      },
      include: {
        room: true
      }
    })
    
    return NextResponse.json({
      success: true,
      device: updatedDevice,
      message: 'Device updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/devices/[id]
 * Delete device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check role - only ADMIN can delete devices
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can delete devices' },
        { status: 403 }
      )
    }
    
    const id = params.id
    
    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id }
    })
    
    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Delete device
    await prisma.device.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
