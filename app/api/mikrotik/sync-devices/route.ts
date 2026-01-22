import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RouterOSAPI } from 'node-routeros'
import { DEVICE_TYPES, isValidDeviceType } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Get MikroTik config
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    })
    
    if (!config || !config.mikrotikIp) {
      return NextResponse.json(
        { 
          success: false,
          error: 'MikroTik not configured',
          details: 'Please configure MikroTik connection in System Settings before syncing devices'
        },
        { status: 200 }
      )
    }
    
    // Connect to MikroTik and fetch Netwatch devices
    const api = new RouterOSAPI({
      host: config.mikrotikIp,
      user: config.mikrotikUser,
      password: config.mikrotikPass,
      port: config.mikrotikPort || 8728,
      timeout: 10
    })
    
    try {
      // Connect to MikroTik
      await api.connect()
      
      // Execute /tool/netwatch/print to get all monitored devices
      const netwatchData = await api.write('/tool/netwatch/print')
      
      // Close connection
      await api.close()
      
      // Parse and format devices
      const devices = netwatchData.map((item: any) => {
        // Extract device information from MikroTik response
        const name = item.comment || item.host || item.name || 'Unknown Device'
        const ip = item.host || 'Unknown'
        
        // Map MikroTik status to dashboard status
        let status = 'unknown'
        if (item.status === 'up') {
          status = 'up'
        } else if (item.status === 'down') {
          status = 'down'
        }
        
        // Determine device type based on name or default to ROUTER
        let type = 'ROUTER'
        const nameLower = name.toLowerCase()
        
        // Network infrastructure
        if (nameLower.includes('router') || nameLower.includes('rb') || nameLower.includes('mikrotik')) {
          type = 'ROUTER'
        } else if (nameLower.includes('switch') || nameLower.includes('sw-')) {
          type = 'SWITCH'
        } else if (nameLower.includes('ap-') || nameLower.includes('access point') || nameLower.includes('wifi')) {
          type = 'ACCESS_POINT'
        }
        // Computers
        else if (nameLower.includes('pc-') || nameLower.includes('desktop') || nameLower.includes('workstation')) {
          type = 'PC'
        } else if (nameLower.includes('laptop') || nameLower.includes('notebook')) {
          type = 'LAPTOP'
        } else if (nameLower.includes('tablet') || nameLower.includes('ipad')) {
          type = 'TABLET'
        }
        // Peripherals
        else if (nameLower.includes('printer') || nameLower.includes('print')) {
          type = 'PRINTER'
        } else if (nameLower.includes('scanner') || nameLower.includes('scan') || nameLower.includes('gtex')) {
          type = 'SCANNER_GTEX'
        }
        // Media & Surveillance
        else if (nameLower.includes('tv') || nameLower.includes('television') || nameLower.includes('smart tv')) {
          type = 'SMART_TV'
        } else if (nameLower.includes('cctv') || nameLower.includes('camera') || nameLower.includes('cam-')) {
          type = 'CCTV'
        }
        // Servers & Phones
        else if (nameLower.includes('server') || nameLower.includes('srv-')) {
          type = 'SERVER'
        } else if (nameLower.includes('phone') || nameLower.includes('smartphone') || nameLower.includes('mobile')) {
          type = 'PHONE'
        }
        // Default to OTHER if no match
        else if (!nameLower.includes('router')) {
          type = 'OTHER'
        }
        
        return {
          name,
          ip,
          type,
          status
        }
      })
      
      // Check if no devices found
      if (devices.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No devices found',
          details: 'No devices found in MikroTik Netwatch. Please add devices to Netwatch first.',
          devices: []
        })
      }
      
      return NextResponse.json({
        success: true,
        devices,
        message: `Found ${devices.length} device${devices.length !== 1 ? 's' : ''} in MikroTik Netwatch`
      })
      
    } catch (connectionError: any) {
      // Handle connection errors gracefully
      let errorMessage = 'Failed to fetch devices'
      let errorDetails = 'Could not connect to MikroTik'
      
      if (connectionError.message) {
        const msg = connectionError.message.toLowerCase()
        
        if (msg.includes('timeout') || msg.includes('timed out')) {
          errorMessage = 'Connection timeout'
          errorDetails = `Could not connect to MikroTik at ${config.mikrotikIp}:${config.mikrotikPort || 8728} within 10 seconds. Please check network connectivity.`
        } else if (msg.includes('authentication') || msg.includes('login') || msg.includes('cannot log in')) {
          errorMessage = 'Authentication failed'
          errorDetails = 'Invalid MikroTik credentials. Please check username and password in System Settings.'
        } else if (msg.includes('econnrefused') || msg.includes('connection refused')) {
          errorMessage = 'Connection refused'
          errorDetails = `Cannot reach MikroTik at ${config.mikrotikIp}:${config.mikrotikPort || 8728}. Please verify IP address and port.`
        } else if (msg.includes('ehostunreach') || msg.includes('enetunreach')) {
          errorMessage = 'Network unreachable'
          errorDetails = `Cannot reach MikroTik at ${config.mikrotikIp}. Please check network connectivity and firewall settings.`
        } else {
          errorDetails = connectionError.message
        }
      }
      
      // Ensure connection is closed
      try {
        await api.close()
      } catch (closeError) {
        // Ignore close errors
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          details: errorDetails
        },
        { status: 200 }
      )
    }
    
  } catch (error) {
    console.error('Error syncing MikroTik devices:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch devices',
        details: error instanceof Error ? error.message : 'An unexpected error occurred while fetching devices from MikroTik'
      },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Check if body exists and has devices (for import mode)
    let body: any = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // No body or invalid JSON - treat as refresh mode
      body = {}
    }
    
    const { devices, mode } = body
    
    // MODE 1: REFRESH - Update status of existing devices from MikroTik
    if (!devices || mode === 'refresh') {
      // Get MikroTik config
      const config = await prisma.systemConfig.findUnique({
        where: { id: 1 }
      })
      
      if (!config || !config.mikrotikIp) {
        return NextResponse.json({
          success: false,
          error: 'MikroTik not configured'
        })
      }
      
      // Connect to MikroTik
      const api = new RouterOSAPI({
        host: config.mikrotikIp,
        user: config.mikrotikUser,
        password: config.mikrotikPass,
        port: config.mikrotikPort || 8728,
        timeout: 10
      })
      
      try {
        await api.connect()
        const netwatchData = await api.write('/tool/netwatch/print')
        await api.close()
        
        // Get all devices from database
        const dbDevices = await prisma.device.findMany()
        
        let updated = 0
        let notFound = 0
        
        // Update each device status based on MikroTik netwatch
        for (const dbDevice of dbDevices) {
          // Find matching device in netwatch by IP
          const netwatchDevice = netwatchData.find((nw: any) => nw.host === dbDevice.ip)
          
          if (netwatchDevice) {
            // Device found in netwatch - update status
            const newStatus = netwatchDevice.status === 'up' ? 'up' : 
                             netwatchDevice.status === 'down' ? 'down' : 'unknown'
            
            // Only update if status changed
            if (dbDevice.status !== newStatus) {
              await prisma.device.update({
                where: { id: dbDevice.id },
                data: {
                  status: newStatus,
                  statusSince: new Date(),
                  lastSeen: newStatus === 'up' ? new Date() : dbDevice.lastSeen
                }
              })
              updated++
            }
          } else {
            // Device NOT found in netwatch - mark as unknown
            if (dbDevice.status !== 'unknown') {
              await prisma.device.update({
                where: { id: dbDevice.id },
                data: {
                  status: 'unknown',
                  statusSince: new Date()
                }
              })
              notFound++
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          updated,
          notFound,
          message: `Refreshed status: ${updated} updated, ${notFound} not in netwatch`
        })
        
      } catch (error: any) {
        try { await api.close() } catch (e) {}
        
        return NextResponse.json({
          success: false,
          error: 'Failed to connect to MikroTik',
          details: error.message
        })
      }
    }
    
    // MODE 2: IMPORT - Import new devices from MikroTik
    // Validate devices array structure
    if (!Array.isArray(devices)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data',
          details: 'Devices must be provided as an array'
        },
        { status: 200 }
      )
    }
    
    if (devices.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No devices selected',
          details: 'Please select at least one device to import'
        },
        { status: 200 }
      )
    }
    
    // Validate each device structure
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i]
      
      if (!device || typeof device !== 'object') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid device data',
            details: `Device at position ${i + 1} is invalid: must be an object with name, ip, and type`
          },
          { status: 200 }
        )
      }
      
      if (!device.name || typeof device.name !== 'string') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid device data',
            details: `Device at position ${i + 1} is missing a valid name`
          },
          { status: 200 }
        )
      }
      
      if (!device.ip || typeof device.ip !== 'string') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid device data',
            details: `Device "${device.name || 'at position ' + (i + 1)}" is missing a valid IP address`
          },
          { status: 200 }
        )
      }
      
      if (device.type && !isValidDeviceType(device.type)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid device type',
            details: `Device "${device.name}" has invalid type. Must be one of: ${DEVICE_TYPES.join(', ')}`
          },
          { status: 200 }
        )
      }
    }
    
    // Import devices to database
    const imported = []
    const skipped = []
    
    for (const device of devices) {
      // Check for duplicate IPs before creating each device
      const existing = await prisma.device.findUnique({
        where: { ip: device.ip }
      })
      
      if (existing) {
        skipped.push(device.ip)
        continue
      }
      
      // Create device records with proper defaults
      const created = await prisma.device.create({
        data: {
          name: device.name,
          ip: device.ip,
          type: device.type || 'ROUTER',
          laneName: 'Imported', // Default laneName for imported devices
          status: device.status || 'unknown',
          statusSince: new Date(), // Set statusSince when device is created
          positionX: 0, // Default position (0, 0)
          positionY: 0
        }
      })
      
      imported.push(created)
    }
    
    // Return detailed import summary
    return NextResponse.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      devices: imported,
      message: `Imported ${imported.length} devices, skipped ${skipped.length} duplicates`
    })
    
  } catch (error) {
    console.error('Error importing devices:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred while importing devices'
      },
      { status: 200 }
    )
  }
}
