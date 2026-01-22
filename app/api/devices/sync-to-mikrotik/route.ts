import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { syncDeviceToMikroTik } from '@/lib/mikrotik-sync'

export const dynamic = 'force-dynamic'

/**
 * POST /api/devices/sync-to-mikrotik
 * Manually sync devices to MikroTik netwatch
 * 
 * Body:
 * - deviceIds: string[] (optional) - Specific device IDs to sync
 * - syncAll: boolean (optional) - Sync all devices that need sync
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check role - only ADMIN and OPERATOR can sync
    if (session.user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { deviceIds, syncAll } = body
    
    let devicesToSync: any[] = []
    
    if (syncAll) {
      // Sync all devices that need sync
      devicesToSync = await prisma.device.findMany({
        where: { needsSync: true }
      })
    } else if (deviceIds && Array.isArray(deviceIds)) {
      // Sync specific devices
      devicesToSync = await prisma.device.findMany({
        where: { id: { in: deviceIds } }
      })
    } else {
      return NextResponse.json(
        { error: 'Please provide deviceIds or set syncAll to true' },
        { status: 400 }
      )
    }
    
    if (devicesToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No devices to sync',
        synced: 0,
        failed: 0
      })
    }
    
    // Sync each device
    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    for (const device of devicesToSync) {
      try {
        const syncResult = await syncDeviceToMikroTik(device)
        
        if (syncResult.success) {
          // Clear needsSync flag
          await prisma.device.update({
            where: { id: device.id },
            data: { needsSync: false }
          })
          results.synced++
        } else {
          results.failed++
          results.errors.push(`${device.name} (${device.ip}): ${syncResult.message}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${device.name} (${device.ip}): ${error.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${results.synced} device(s), ${results.failed} failed`,
      synced: results.synced,
      failed: results.failed,
      errors: results.errors
    })
    
  } catch (error) {
    console.error('Error syncing devices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
