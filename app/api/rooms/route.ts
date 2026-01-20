import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET all rooms
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { devices: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST create new room
export async function POST(request: NextRequest) {
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

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room name already exists' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        color: color || '#3b82f6'
      }
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
