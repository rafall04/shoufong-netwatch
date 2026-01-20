import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT update room
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    // Check if name is taken by another room
    const existingRoom = await prisma.room.findFirst({
      where: {
        name,
        NOT: { id: params.id }
      }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room name already exists' }, { status: 400 })
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        color: color || '#3b82f6'
      }
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Set roomId to null for all devices in this room
    await prisma.device.updateMany({
      where: { roomId: params.id },
      data: { roomId: null }
    })

    // Delete the room
    await prisma.room.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
