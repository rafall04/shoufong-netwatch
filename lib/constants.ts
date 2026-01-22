/**
 * Device Types - Single Source of Truth
 * 
 * CRITICAL: This is the ONLY place where device types should be defined.
 * All other files MUST import from here to ensure consistency.
 * 
 * When adding a new device type:
 * 1. Add to DEVICE_TYPES array
 * 2. Add to DeviceType type
 * 3. Add icon mapping in DEVICE_TYPE_ICONS
 * 4. Add label in DEVICE_TYPE_LABELS
 * 5. Run getDiagnostics to verify no errors
 * 6. Update Prisma schema comment if needed
 */

export const DEVICE_TYPES = [
  'ROUTER',
  'SWITCH',
  'ACCESS_POINT',
  'PC',
  'LAPTOP',
  'TABLET',
  'PRINTER',
  'SCANNER_GTEX',
  'SMART_TV',
  'CCTV',
  'SERVER',
  'PHONE',
  'OTHER'
] as const

export type DeviceType = typeof DEVICE_TYPES[number]

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  ROUTER: 'Router',
  SWITCH: 'Switch',
  ACCESS_POINT: 'Access Point',
  PC: 'PC / Desktop',
  LAPTOP: 'Laptop',
  TABLET: 'Tablet',
  PRINTER: 'Printer',
  SCANNER_GTEX: 'Scanner (GTEX)',
  SMART_TV: 'Smart TV',
  CCTV: 'CCTV Camera',
  SERVER: 'Server',
  PHONE: 'Phone / Smartphone',
  OTHER: 'Other Device'
}

/**
 * Validate if a string is a valid device type
 */
export function isValidDeviceType(type: string): type is DeviceType {
  return DEVICE_TYPES.includes(type as DeviceType)
}

/**
 * Get device type label
 */
export function getDeviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_LABELS[type] || type
}
