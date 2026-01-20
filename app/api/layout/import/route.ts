import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * POST /api/layout/import
 * Import layout from JSON (updates positions only, doesn't create/delete devices)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and OPERATOR can import
    if (session.user?.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data, mode = 'positions' } = body

    if (!data || !data.devices || !data.layoutElements) {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      )
    }

    let updatedDevices = 0
    let updatedLayouts = 0
    let createdLayouts = 0
    let createdRooms = 0
    const errors: string[] = []

    // Import mode: 'positions' (default) or 'full'
    // positions: only update positions of existing devices/layouts
    // full: create missing rooms and layout elements

    // Update device positions
    for (const device of data.devices) {
      try {
        // Find device by IP (more reliable than ID)
        const existing = await prisma.device.findUnique({
          where: { ip: device.ip }
        })

        if (existing) {
          await prisma.device.update({
            where: { ip: device.ip },
            data: {
              positionX: device.positionX,
              positionY: device.positionY
            }
          })
          updatedDevices++
        }
      } catch (error) {
        errors.push(`Failed to update device ${device.ip}: ${error}`)
      }
    }

    // Import rooms if in full mode
    if (mode === 'full' && data.rooms) {
      const roomIdMap = new Map<string, string>() // old ID -> new ID

      for (const room of data.rooms) {
        try {
          // Check if room exists by name
          let existingRoom = await prisma.room.findUnique({
            where: { name: room.name }
          })

          if (!existingRoom) {
            // Create new room
            existingRoom = await prisma.room.create({
              data: {
                name: room.name,
                description: room.description,
                color: room.color
              }
            })
            createdRooms++
          }

          roomIdMap.set(room.id, existingRoom.id)
        } catch (error) {
          errors.push(`Failed to import room ${room.name}: ${error}`)
        }
      }

      // Update device room assignments
      for (const device of data.devices) {
        if (device.roomId && roomIdMap.has(device.roomId)) {
          try {
            await prisma.device.update({
              where: { ip: device.ip },
              data: {
                roomId: roomIdMap.get(device.roomId)
              }
            })
          } catch (error) {
            // Ignore if device doesn't exist
          }
        }
      }
    }

    // Update or create layout elements
    for (const layout of data.layoutElements) {
      try {
        // Try to find existing layout by label and type
        const existing = await prisma.layoutElement.findFirst({
          where: {
            label: layout.label,
            type: layout.type
          }
        })

        if (existing) {
          // Update existing
          await prisma.layoutElement.update({
            where: { id: existing.id },
            data: {
              positionX: layout.positionX,
              positionY: layout.positionY,
              width: layout.width,
              height: layout.height,
              color: layout.color,
              laneType: layout.laneType
            }
          })
          updatedLayouts++
        } else if (mode === 'full') {
          // Create new in full mode
          await prisma.layoutElement.create({
            data: {
              type: layout.type,
              label: layout.label,
              laneType: layout.laneType,
              positionX: layout.positionX,
              positionY: layout.positionY,
              width: layout.width,
              height: layout.height,
              color: layout.color
            }
          })
          createdLayouts++
        }
      } catch (error) {
        errors.push(`Failed to import layout ${layout.label}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        mode,
        updatedDevices,
        updatedLayouts,
        createdLayouts,
        createdRooms,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('Error importing layout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
