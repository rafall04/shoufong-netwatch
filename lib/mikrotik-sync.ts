/**
 * MikroTik Netwatch Sync Helper
 * 
 * Efficient sync functions for updating MikroTik netwatch entries
 */

import { RouterOSAPI } from 'node-routeros'

interface Device {
  id: string
  name: string
  ip: string
  netwatchTimeout: number
  netwatchInterval: number
  netwatchUpScript?: string | null
  netwatchDownScript?: string | null
}

interface MikroTikConfig {
  host: string
  user: string
  password: string
  port?: number
}

/**
 * Get MikroTik configuration from environment
 */
export function getMikroTikConfig(): MikroTikConfig {
  const host = process.env.MIKROTIK_HOST
  const user = process.env.MIKROTIK_USER
  const password = process.env.MIKROTIK_PASSWORD
  const port = process.env.MIKROTIK_PORT ? parseInt(process.env.MIKROTIK_PORT) : 8728

  if (!host || !user || !password) {
    throw new Error('MikroTik configuration is missing. Please check environment variables.')
  }

  return { host, user, password, port }
}

/**
 * Find netwatch entry by IP address
 */
async function findNetwatchByIP(api: RouterOSAPI, ip: string): Promise<any | null> {
  try {
    const netwatchData = await api.write('/tool/netwatch/print')
    
    if (!Array.isArray(netwatchData)) {
      return null
    }
    
    // Find entry with matching IP
    const entry = netwatchData.find((item: any) => item.host === ip)
    return entry || null
  } catch (error) {
    console.error('Error finding netwatch entry:', error)
    return null
  }
}

/**
 * Update netwatch entry (more efficient than delete+add)
 */
async function updateNetwatchEntry(
  api: RouterOSAPI,
  entryId: string,
  device: Device
): Promise<void> {
  const params = [
    `=.id=${entryId}`,
    `=host=${device.ip}`,
    `=comment=${device.name}`, // Use device name as comment
    `=timeout=${device.netwatchTimeout}ms`,
    `=interval=${device.netwatchInterval}s`
  ]

  // Add optional scripts
  if (device.netwatchUpScript) {
    params.push(`=up-script=${device.netwatchUpScript}`)
  }
  if (device.netwatchDownScript) {
    params.push(`=down-script=${device.netwatchDownScript}`)
  }

  await api.write('/tool/netwatch/set', params)
}

/**
 * Add new netwatch entry
 */
async function addNetwatchEntry(api: RouterOSAPI, device: Device): Promise<void> {
  const params = [
    `=host=${device.ip}`,
    `=comment=${device.name}`, // Use device name as comment
    `=timeout=${device.netwatchTimeout}ms`,
    `=interval=${device.netwatchInterval}s`
  ]

  // Add optional scripts
  if (device.netwatchUpScript) {
    params.push(`=up-script=${device.netwatchUpScript}`)
  }
  if (device.netwatchDownScript) {
    params.push(`=down-script=${device.netwatchDownScript}`)
  }

  await api.write('/tool/netwatch/add', params)
}

/**
 * Sync device to MikroTik netwatch
 * 
 * This function will:
 * 1. Try to find existing netwatch entry by OLD IP
 * 2. If found, UPDATE the entry (efficient!)
 * 3. If not found, ADD new entry
 * 
 * @param device - Device to sync
 * @param oldIP - Previous IP address (if IP changed)
 * @returns Success status and message
 */
export async function syncDeviceToMikroTik(
  device: Device,
  oldIP?: string
): Promise<{ success: boolean; message: string }> {
  let api: RouterOSAPI | null = null

  try {
    const config = getMikroTikConfig()
    
    api = new RouterOSAPI({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      timeout: 10
    })

    await api.connect()

    // If IP changed, find entry by old IP
    const searchIP = oldIP || device.ip
    const existingEntry = await findNetwatchByIP(api, searchIP)

    if (existingEntry && existingEntry['.id']) {
      // UPDATE existing entry (efficient!)
      await updateNetwatchEntry(api, existingEntry['.id'], device)
      await api.close()
      
      return {
        success: true,
        message: oldIP 
          ? `Netwatch entry updated (IP changed: ${oldIP} → ${device.ip})`
          : 'Netwatch entry updated'
      }
    } else {
      // ADD new entry
      await addNetwatchEntry(api, device)
      await api.close()
      
      return {
        success: true,
        message: 'Netwatch entry added'
      }
    }
  } catch (error: any) {
    console.error('Error syncing to MikroTik:', error)
    
    if (api) {
      try {
        await api.close()
      } catch (closeError) {
        console.error('Error closing MikroTik connection:', closeError)
      }
    }

    return {
      success: false,
      message: error.message || 'Failed to sync to MikroTik'
    }
  }
}

/**
 * Remove netwatch entry by IP
 */
export async function removeNetwatchEntry(ip: string): Promise<{ success: boolean; message: string }> {
  let api: RouterOSAPI | null = null

  try {
    const config = getMikroTikConfig()
    
    api = new RouterOSAPI({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      timeout: 10
    })

    await api.connect()

    const existingEntry = await findNetwatchByIP(api, ip)

    if (existingEntry && existingEntry['.id']) {
      await api.write('/tool/netwatch/remove', [`=.id=${existingEntry['.id']}`])
      await api.close()
      
      return {
        success: true,
        message: 'Netwatch entry removed'
      }
    } else {
      await api.close()
      
      return {
        success: false,
        message: 'Netwatch entry not found'
      }
    }
  } catch (error: any) {
    console.error('Error removing netwatch entry:', error)
    
    if (api) {
      try {
        await api.close()
      } catch (closeError) {
        console.error('Error closing MikroTik connection:', closeError)
      }
    }

    return {
      success: false,
      message: error.message || 'Failed to remove netwatch entry'
    }
  }
}
