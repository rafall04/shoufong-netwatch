import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { RouterOSAPI } from 'node-routeros'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Get config from request body
    const body = await request.json()
    const { mikrotikIp, mikrotikUser, mikrotikPass, mikrotikPort } = body
    
    // Validate required fields (check for undefined/null, not empty strings)
    if (mikrotikIp === undefined || mikrotikIp === null || 
        mikrotikUser === undefined || mikrotikUser === null || 
        mikrotikPass === undefined || mikrotikPass === null) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          details: 'MikroTik IP address, username, and password are required'
        },
        { status: 200 }
      )
    }
    
    // IP format and range validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(mikrotikIp)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid IP address format',
          details: 'Please provide a valid IPv4 address (e.g., 192.168.1.1)'
        },
        { status: 200 }
      )
    }
    
    // Validate each octet is 0-255
    const octets = mikrotikIp.split('.').map(Number)
    if (octets.some((octet: number) => octet < 0 || octet > 255)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid IP address format',
          details: 'Please provide a valid IPv4 address (e.g., 192.168.1.1)'
        },
        { status: 200 }
      )
    }
    
    // Validate port
    const port = mikrotikPort !== undefined ? mikrotikPort : 8728
    if (port < 1 || port > 65535) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid port number',
          details: 'Port must be between 1 and 65535'
        },
        { status: 200 }
      )
    }
    
    // Create RouterOS API connection with 10-second timeout
    const api = new RouterOSAPI({
      host: mikrotikIp,
      user: mikrotikUser,
      password: mikrotikPass,
      port: port,
      timeout: 10
    })
    
    try {
      // Attempt to connect with timeout
      await api.connect()
      
      // Fetch system identity
      const identityData = await api.write('/system/identity/print')
      const identity = identityData && identityData.length > 0 
        ? identityData[0].name 
        : 'Unknown'
      
      // Fetch system version
      const resourceData = await api.write('/system/resource/print')
      const version = resourceData && resourceData.length > 0 
        ? resourceData[0].version 
        : 'Unknown'
      
      // Close connection
      await api.close()
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to MikroTik',
        details: {
          ip: mikrotikIp,
          port: port,
          version: version,
          identity: identity
        }
      })
      
    } catch (connectionError: any) {
      // Handle specific connection errors
      let errorMessage = 'Connection test failed'
      let errorDetails = 'Unknown error'
      
      if (connectionError.message) {
        const msg = connectionError.message.toLowerCase()
        
        if (msg.includes('timeout') || msg.includes('timed out')) {
          errorMessage = 'Connection timeout'
          errorDetails = `Could not connect to MikroTik at ${mikrotikIp}:${port} within 10 seconds`
        } else if (msg.includes('authentication') || msg.includes('login') || msg.includes('cannot log in')) {
          errorMessage = 'Authentication failed'
          errorDetails = 'Invalid username or password'
        } else if (msg.includes('econnrefused') || msg.includes('connection refused')) {
          errorMessage = 'Connection refused'
          errorDetails = `Cannot reach MikroTik at ${mikrotikIp}:${port}. Please check IP address and port.`
        } else if (msg.includes('ehostunreach') || msg.includes('enetunreach')) {
          errorMessage = 'Network unreachable'
          errorDetails = `Cannot reach MikroTik at ${mikrotikIp}. Please check network connectivity.`
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
    console.error('Error testing MikroTik connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    )
  }
}
