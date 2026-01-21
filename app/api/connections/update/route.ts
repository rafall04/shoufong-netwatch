import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST - Update connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, label, type, animated, waypoints } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}
    
    if (label !== undefined && label !== null) updateData.label = label
    if (type !== undefined) updateData.type = type
    if (animated !== undefined) updateData.animated = animated
    
    // CRITICAL: Handle waypoints properly - use null instead of undefined
    // JSON.stringify removes undefined fields, but keeps null fields
    if ('waypoints' in body) {
      updateData.waypoints = (waypoints && waypoints.length > 0) ? JSON.stringify(waypoints) : null
    }

    const connection = await prisma.deviceConnection.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}
