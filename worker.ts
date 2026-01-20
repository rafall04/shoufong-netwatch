import { PrismaClient } from '@prisma/client'
import { RouterOSAPI } from 'node-routeros'

const prisma = new PrismaClient()

/**
 * Poll MikroTik Netwatch for device status updates
 */
async function pollMikroTik(): Promise<void> {
  try {
    console.log('Starting MikroTik poll...')
    
    // Load SystemConfig from database
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    })
    
    if (!config || !config.mikrotikIp) {
      console.log('MikroTik not configured - skipping poll')
      return
    }
    
    console.log(`Connecting to MikroTik at ${config.mikrotikIp}:${config.mikrotikPort}`)
    
    // Connect to MikroTik using configured credentials
    const api = new RouterOSAPI({
      host: config.mikrotikIp,
      user: config.mikrotikUser,
      password: config.mikrotikPass,
      port: config.mikrotikPort
    })
    
    await api.connect()
    console.log('Connected to MikroTik successfully')
    
    // Execute /tool/netwatch/print command
    const netwatchData = await api.write('/tool/netwatch/print')
    console.log(`Retrieved ${netwatchData.length} netwatch entries`)
    
    // Get all devices from database
    const devices = await prisma.device.findMany()
    console.log(`Found ${devices.length} devices in database`)
    
    // Compare netwatch results with database devices
    for (const device of devices) {
      const netwatchEntry = netwatchData.find(
        (entry: any) => entry.host === device.ip
      )
      
      if (netwatchEntry) {
        const newStatus = netwatchEntry.status === 'up' ? 'up' : 'down'
        
        // Check if this is first time getting status (statusSince is null)
        const isFirstStatus = !device.statusSince
        
        // Update device status and lastSeen when changed
        if (device.status !== newStatus) {
          await prisma.device.update({
            where: { id: device.id },
            data: {
              status: newStatus,
              lastSeen: new Date(),
              statusSince: new Date() // Track when status changed
            }
          })
          
          // Log status change to history
          await prisma.deviceStatusHistory.create({
            data: {
              deviceId: device.id,
              deviceIp: device.ip,
              status: newStatus,
              timestamp: new Date()
            }
          })
          
          console.log(`Device ${device.name} (${device.ip}) status changed from ${device.status} to ${newStatus}`)
        } else if (isFirstStatus) {
          // First time getting status - set statusSince and log to history
          await prisma.device.update({
            where: { id: device.id },
            data: {
              statusSince: new Date(),
              lastSeen: newStatus === 'up' ? new Date() : device.lastSeen
            }
          })
          
          // Log initial status to history
          await prisma.deviceStatusHistory.create({
            data: {
              deviceId: device.id,
              deviceIp: device.ip,
              status: newStatus,
              timestamp: new Date()
            }
          })
          
          console.log(`Device ${device.name} (${device.ip}) first status recorded: ${newStatus}`)
        } else if (newStatus === 'up') {
          // Update lastSeen even if status hasn't changed but device is up
          await prisma.device.update({
            where: { id: device.id },
            data: {
              lastSeen: new Date()
            }
          })
        }
      } else {
        console.log(`Device ${device.name} (${device.ip}) not found in netwatch results`)
      }
    }
    
    await api.close()
    console.log('MikroTik poll completed successfully')
    
  } catch (error) {
    // Handle connection errors gracefully (log and continue)
    console.error('MikroTik polling error:', error)
    console.log('Will retry on next polling cycle')
    // Don't crash - continue polling
  }
}

/**
 * Start the poller with setInterval using polling interval from SystemConfig
 */
async function startPoller(): Promise<void> {
  console.log('Starting MikroTik poller worker...')
  
  try {
    // Initial poll
    await pollMikroTik()
    
    // Get polling interval from SystemConfig
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 }
    })
    
    const intervalSeconds = config?.pollingInterval || 30
    const intervalMs = intervalSeconds * 1000
    
    console.log(`Setting up polling interval: ${intervalSeconds} seconds`)
    
    // Set up interval polling
    setInterval(async () => {
      await pollMikroTik()
    }, intervalMs)
    
    console.log('Poller started successfully')
    
  } catch (error) {
    console.error('Failed to start poller:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

// Start the poller
startPoller().catch((error) => {
  console.error('Fatal error starting poller:', error)
  process.exit(1)
})