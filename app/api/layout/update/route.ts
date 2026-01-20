import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST update layout element position, size, and label
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, positionX, positionY, width, height, label } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (positionX !== undefined) updateData.positionX = positionX
    if (positionY !== undefined) updateData.positionY = positionY
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height
    if (label !== undefined) updateData.label = label

    const element = await prisma.layoutElement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ element })
  } catch (error) {
    console.error('Error updating layout element:', error)
    return NextResponse.json(
      { error: 'Failed to update layout element' },
      { status: 500 }
    )
  }
}
