import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/layout/export
 * Export complete layout (devices + layout elements) as JSON
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all devices with positions
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        ip: true,
        name: true,
        type: true,
        laneName: true,
        roomId: true,
        positionX: true,
        positionY: true,
        netwatchTimeout: true,
        netwatchInterval: true,
        netwatchUpScript: true,
        netwatchDownScript: true
      }
    })

    // Get all layout elements
    const layoutElements = await prisma.layoutElement.findMany({
      select: {
        id: true,
        type: true,
        label: true,
        laneType: true,
        positionX: true,
        positionY: true,
        width: true,
        height: true,
        color: true
      }
    })

    // Get all rooms
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        color: true
      }
    })

    // Create export data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.user?.name || session.user?.username,
      data: {
        devices,
        layoutElements,
        rooms
      }
    }

    return NextResponse.json({
      success: true,
      export: exportData
    })
  } catch (error) {
    console.error('Error exporting layout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
