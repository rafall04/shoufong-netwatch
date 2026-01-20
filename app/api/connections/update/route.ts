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
    const { id, label, type, animated, edgeType, waypoints } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    const connection = await prisma.deviceConnection.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(type !== undefined && { type }),
        ...(animated !== undefined && { animated }),
        ...(edgeType !== undefined && { edgeType }),
        ...(waypoints !== undefined && { 
          waypoints: waypoints ? JSON.stringify(waypoints) : null 
        })
      }
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
