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

    console.log('=== API UPDATE CONNECTION DEBUG ===')
    console.log('1. Request body:', body)
    console.log('2. Waypoints value:', waypoints)
    console.log('3. Waypoints type:', typeof waypoints)
    console.log('4. Waypoints === undefined:', waypoints === undefined)
    console.log('5. Waypoints === null:', waypoints === null)

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}
    
    if (label !== undefined) updateData.label = label
    if (type !== undefined) updateData.type = type
    if (animated !== undefined) updateData.animated = animated
    
    // CRITICAL FIX: Handle waypoints properly
    // If waypoints is in the request body (even if undefined), update it
    if ('waypoints' in body) {
      updateData.waypoints = waypoints ? JSON.stringify(waypoints) : null
      console.log('6. Waypoints will be updated to:', updateData.waypoints)
    } else {
      console.log('6. Waypoints not in request body, will not update')
    }

    console.log('7. Final update data:', updateData)

    const connection = await prisma.deviceConnection.update({
      where: { id },
      data: updateData
    })

    console.log('8. Updated connection waypoints:', connection.waypoints)
    console.log('✅ API UPDATE SUCCESS')
    console.log('=== API UPDATE CONNECTION DEBUG END ===')

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}
