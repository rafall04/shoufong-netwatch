import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RouterOSAPI } from 'node-routeros'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch all devices from database with room relation
    const devices = await prisma.device.findMany({
      include: {
        room: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check role (ADMIN or OPERATOR only)
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      name, 
      ip, 
      type, 
      laneName, 
      syncToMikrotik, 
      roomId,
      netwatchTimeout,
      netwatchInterval,
      netwatchUpScript,
      netwatchDownScript
    } = body

    // Validate required fields
    if (!name || !ip || !type || !laneName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ip, type, laneName' },
        { status: 400 }
      )
    }

    // Validate device type
    const validTypes = [
      'ROUTER', 'SWITCH', 'ACCESS_POINT', 
      'PC', 'LAPTOP', 'TABLET', 
      'PRINTER', 'SCANNER_GTEX', 'SMART_TV', 
      'CCTV', 'SERVER', 'PHONE', 'OTHER'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid device type' },
        { status: 400 }
      )
    }

    // Check IP uniqueness
    const existingDevice = await prisma.device.findUnique({
      where: { ip }
    })

    if (existingDevice) {
      return NextResponse.json(
        { error: 'IP address already exists' },
        { status: 400 }
      )
    }

    // Get system config for default netwatch values
    const systemConfig = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    })

    // Create device with defaults (use system config defaults if not provided)
    const device = await prisma.device.create({
      data: {
        name,
        ip,
        type,
        laneName,
        status: 'unknown',
        statusSince: new Date(), // Set statusSince when device is created
        positionX: 0,
        positionY: 0,
        roomId: roomId || null, // Optional room assignment
        netwatchTimeout: netwatchTimeout || systemConfig?.defaultNetwatchTimeout || 1000,
        netwatchInterval: netwatchInterval || systemConfig?.defaultNetwatchInterval || 5,
        netwatchUpScript: netwatchUpScript || null,
        netwatchDownScript: netwatchDownScript || null
      },
      include: {
        room: true
      }
    })

    // Handle MikroTik sync if requested
    let warning: string | undefined
    
    if (syncToMikrotik === true) {
      try {
        // Load SystemConfig
        const config = await prisma.systemConfig.findUnique({
          where: { id: 1 }
        })
        
        if (!config || !config.mikrotikIp) {
          warning = 'Device created but not synced to MikroTik: MikroTik not configured'
        } else {
          // Connect to MikroTik
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
            
            // Build netwatch add command with MikroTik standard parameters
            // MikroTik Netwatch only supports ICMP ping by default
            const netwatchParams = [
              `=host=${ip}`,
              `=comment=${name}`,
              `=timeout=${device.netwatchTimeout}ms`,
              `=interval=${device.netwatchInterval}s`
            ]
            
            // Add optional up script if specified
            if (device.netwatchUpScript && device.netwatchUpScript.trim()) {
              netwatchParams.push(`=up-script=${device.netwatchUpScript}`)
            }
            
            // Add optional down script if specified
            if (device.netwatchDownScript && device.netwatchDownScript.trim()) {
              netwatchParams.push(`=down-script=${device.netwatchDownScript}`)
            }
            
            // Execute /tool/netwatch/add with all parameters
            await api.write('/tool/netwatch/add', netwatchParams)
            
            // Close connection
            await api.close()
            
            console.log(`Successfully added device ${name} (${ip}) to MikroTik Netwatch with custom configuration`)
            
          } catch (mikrotikError: any) {
            // Log error but don't fail the request
            console.error('Failed to add device to MikroTik:', mikrotikError)
            
            let errorMessage = 'Device created but not synced to MikroTik'
            
            if (mikrotikError.message) {
              const msg = mikrotikError.message.toLowerCase()
              
              if (msg.includes('timeout') || msg.includes('timed out')) {
                errorMessage += ': Connection timeout'
              } else if (msg.includes('authentication') || msg.includes('login') || msg.includes('cannot log in')) {
                errorMessage += ': Authentication failed'
              } else if (msg.includes('econnrefused') || msg.includes('connection refused')) {
                errorMessage += ': Connection refused'
              } else {
                errorMessage += `: ${mikrotikError.message}`
              }
            }
            
            warning = errorMessage
            
            // Ensure connection is closed
            try {
              await api.close()
            } catch (closeError) {
              // Ignore close errors
            }
          }
        }
      } catch (syncError) {
        // Log error but don't fail the request
        console.error('Error during MikroTik sync:', syncError)
        warning = 'Device created but not synced to MikroTik: Unexpected error'
      }
    }

    // Return device with optional warning if sync failed
    const response: any = { device }
    if (warning) {
      response.warning = warning
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
