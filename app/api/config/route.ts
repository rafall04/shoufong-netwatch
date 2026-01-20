import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'System configuration not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    
    const body = await request.json()
    const { 
      pollingInterval, 
      mikrotikIp, 
      mikrotikUser, 
      mikrotikPass, 
      mikrotikPort,
      defaultNetwatchTimeout,
      defaultNetwatchInterval
    } = body
    
    // Validate polling interval if provided
    if (pollingInterval !== undefined) {
      if (typeof pollingInterval !== 'number' || pollingInterval <= 0 || !Number.isInteger(pollingInterval)) {
        return NextResponse.json(
          { error: 'Invalid polling interval - must be a positive integer' },
          { status: 400 }
        )
      }
    }
    
    // Validate mikrotik port if provided
    if (mikrotikPort !== undefined) {
      if (typeof mikrotikPort !== 'number' || mikrotikPort <= 0 || mikrotikPort > 65535 || !Number.isInteger(mikrotikPort)) {
        return NextResponse.json(
          { error: 'Invalid MikroTik port - must be an integer between 1 and 65535' },
          { status: 400 }
        )
      }
    }
    
    // Validate default netwatch timeout if provided
    if (defaultNetwatchTimeout !== undefined) {
      if (typeof defaultNetwatchTimeout !== 'number' || defaultNetwatchTimeout < 100 || defaultNetwatchTimeout > 10000) {
        return NextResponse.json(
          { error: 'Invalid default timeout - must be between 100ms and 10000ms' },
          { status: 400 }
        )
      }
    }
    
    // Validate default netwatch interval if provided
    if (defaultNetwatchInterval !== undefined) {
      if (typeof defaultNetwatchInterval !== 'number' || defaultNetwatchInterval < 5 || defaultNetwatchInterval > 3600) {
        return NextResponse.json(
          { error: 'Invalid default interval - must be between 5s and 3600s' },
          { status: 400 }
        )
      }
    }
    
    // Build update data object
    const updateData: any = {}
    if (pollingInterval !== undefined) updateData.pollingInterval = pollingInterval
    if (mikrotikIp !== undefined) updateData.mikrotikIp = mikrotikIp
    if (mikrotikUser !== undefined) updateData.mikrotikUser = mikrotikUser
    if (mikrotikPass !== undefined) updateData.mikrotikPass = mikrotikPass
    if (mikrotikPort !== undefined) updateData.mikrotikPort = mikrotikPort
    if (defaultNetwatchTimeout !== undefined) updateData.defaultNetwatchTimeout = defaultNetwatchTimeout
    if (defaultNetwatchInterval !== undefined) updateData.defaultNetwatchInterval = defaultNetwatchInterval
    
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        pollingInterval: pollingInterval || 30,
        mikrotikIp: mikrotikIp || '',
        mikrotikUser: mikrotikUser || '',
        mikrotikPass: mikrotikPass || '',
        mikrotikPort: mikrotikPort || 8728,
        defaultNetwatchTimeout: defaultNetwatchTimeout || 1000,
        defaultNetwatchInterval: defaultNetwatchInterval || 5
      }
    })
    
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
