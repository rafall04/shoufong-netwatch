import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all connections
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connections = await prisma.deviceConnection.findMany({
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, connections })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

// POST - Create new connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { sourceId, targetId, label, type, animated } = body

    // Validate required fields
    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'Source and target device IDs are required' },
        { status: 400 }
      )
    }

    // Check if devices exist
    const sourceDevice = await prisma.device.findUnique({
      where: { id: sourceId }
    })
    const targetDevice = await prisma.device.findUnique({
      where: { id: targetId }
    })

    if (!sourceDevice || !targetDevice) {
      return NextResponse.json(
        { error: 'Source or target device not found' },
        { status: 404 }
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.deviceConnection.findFirst({
      where: {
        OR: [
          { sourceId, targetId },
          { sourceId: targetId, targetId: sourceId }
        ]
      }
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Connection already exists between these devices' },
        { status: 409 }
      )
    }

    // Create connection
    const connection = await prisma.deviceConnection.create({
      data: {
        sourceId,
        targetId,
        label: label || null,
        type: type || 'LAN',
        animated: animated !== undefined ? animated : true,
        waypoints: null // Will be set later via edit
      }
    })

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    await prisma.deviceConnection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
