import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check role (ADMIN or OPERATOR only)
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get device ID from params
    const { id } = params

    // Validate device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id }
    })

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Parse request body
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

    // Validate device type if provided
    if (type) {
      const validTypes = ['ROUTER', 'TABLET', 'SCANNER_GTEX', 'SMART_TV']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Invalid device type' },
          { status: 400 }
        )
      }
    }

    // Check IP uniqueness if IP is being updated
    if (ip && ip !== existingDevice.ip) {
      const deviceWithIp = await prisma.device.findUnique({
        where: { ip }
      })

      if (deviceWithIp) {
        return NextResponse.json(
          { error: 'IP address already exists' },
          { status: 400 }
        )
      }
    }

    // Update device fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (ip !== undefined) updateData.ip = ip
    if (type !== undefined) updateData.type = type
    if (laneName !== undefined) updateData.laneName = laneName
    if (roomId !== undefined) updateData.roomId = roomId
    if (netwatchTimeout !== undefined) updateData.netwatchTimeout = netwatchTimeout
    if (netwatchInterval !== undefined) updateData.netwatchInterval = netwatchInterval
    if (netwatchUpScript !== undefined) updateData.netwatchUpScript = netwatchUpScript
    if (netwatchDownScript !== undefined) updateData.netwatchDownScript = netwatchDownScript

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: updateData,
      include: {
        room: true
      }
    })

    return NextResponse.json({ device: updatedDevice })
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check role (ADMIN or OPERATOR only)
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get device ID from params
    const { id } = params

    // Validate device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id }
    })

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Delete device from database
    await prisma.device.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
