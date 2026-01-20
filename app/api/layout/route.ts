import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET all layout elements
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const elements = await prisma.layoutElement.findMany({
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ elements })
  } catch (error) {
    console.error('Error fetching layout elements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layout elements' },
      { status: 500 }
    )
  }
}

// POST create new layout element
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { type, label, laneType, positionX, positionY, width, height, color } = body

    const element = await prisma.layoutElement.create({
      data: {
        type,
        label: label || '',
        laneType: type === 'LANE' ? laneType : null,
        positionX,
        positionY,
        width: width || 200,
        height: height || 100,
        color: color || '#e5e7eb',
      },
    })

    return NextResponse.json({ element }, { status: 201 })
  } catch (error) {
    console.error('Error creating layout element:', error)
    return NextResponse.json(
      { error: 'Failed to create layout element' },
      { status: 500 }
    )
  }
}

// DELETE layout element
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.layoutElement.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting layout element:', error)
    return NextResponse.json(
      { error: 'Failed to delete layout element' },
      { status: 500 }
    )
  }
}
