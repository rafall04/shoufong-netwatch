import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/devices/[id]/history
 * Get status history for a device (last 24 hours by default)
 * Returns array of status changes with timestamps
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')

    // Calculate time range
    const since = new Date()
    since.setHours(since.getHours() - hours)

    // Get device to verify it exists
    const device = await prisma.device.findUnique({
      where: { id },
      select: { id: true, ip: true, name: true }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Get status history
    const history = await prisma.deviceStatusHistory.findMany({
      where: {
        deviceId: id,
        timestamp: {
          gte: since
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        ip: device.ip,
        name: device.name
      },
      history,
      timeRange: {
        since: since.toISOString(),
        hours
      }
    })
  } catch (error) {
    console.error('Error fetching device history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
