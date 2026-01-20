'use client'

import React, { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  Router, 
  Tablet, 
  ScanBarcode, 
  Tv, 
  Monitor, 
  Laptop, 
  Printer, 
  Video, 
  Server, 
  Smartphone,
  Network,
  Wifi,
  HelpCircle
} from 'lucide-react'

type DeviceType = 
  | 'ROUTER' 
  | 'SWITCH' 
  | 'ACCESS_POINT' 
  | 'PC' 
  | 'LAPTOP' 
  | 'TABLET' 
  | 'PRINTER' 
  | 'SCANNER_GTEX' 
  | 'SMART_TV' 
  | 'CCTV' 
  | 'SERVER' 
  | 'PHONE'
  | 'OTHER'

interface DeviceNodeData {
  name: string
  laneName: string
  status: string
  type: DeviceType
  ip?: string
  lastSeen?: string
  statusSince?: string
  onClick?: (e?: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

const DeviceNode = ({ data }: NodeProps<DeviceNodeData>) => {
  const { name, status, type, ip, statusSince, onClick, onContextMenu } = data
  const [showTooltip, setShowTooltip] = useState(false)
  const [timeSince, setTimeSince] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted flag on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Icon mapping - comprehensive device types
  const getIcon = () => {
    switch (type) {
      case 'ROUTER':
        return <Router className="w-8 h-8" strokeWidth={1.5} />
      case 'SWITCH':
        return <Network className="w-8 h-8" strokeWidth={1.5} />
      case 'ACCESS_POINT':
        return <Wifi className="w-8 h-8" strokeWidth={1.5} />
      case 'PC':
        return <Monitor className="w-8 h-8" strokeWidth={1.5} />
      case 'LAPTOP':
        return <Laptop className="w-8 h-8" strokeWidth={1.5} />
      case 'TABLET':
        return <Tablet className="w-8 h-8" strokeWidth={1.5} />
      case 'PRINTER':
        return <Printer className="w-8 h-8" strokeWidth={1.5} />
      case 'SCANNER_GTEX':
        return <ScanBarcode className="w-8 h-8" strokeWidth={1.5} />
      case 'SMART_TV':
        return <Tv className="w-8 h-8" strokeWidth={1.5} />
      case 'CCTV':
        return <Video className="w-8 h-8" strokeWidth={1.5} />
      case 'SERVER':
        return <Server className="w-8 h-8" strokeWidth={1.5} />
      case 'PHONE':
        return <Smartphone className="w-8 h-8" strokeWidth={1.5} />
      case 'OTHER':
        return <HelpCircle className="w-8 h-8" strokeWidth={1.5} />
      default:
        return <Router className="w-8 h-8" strokeWidth={1.5} />
    }
  }

  // Simple color based on status - no animations or effects
  const getIconColor = () => {
    if (status === 'down') return 'text-red-500'
    if (status === 'up') return 'text-green-500'
    return 'text-gray-500'
  }

  // Calculate time since status change - ONLY on client after mount
  useEffect(() => {
    if (!isMounted || !statusSince) {
      setTimeSince(null)
      return
    }
    
    const calculateTimeSince = () => {
      const now = new Date()
      const since = new Date(statusSince)
      const diffMs = now.getTime() - since.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        setTimeSince(`${diffDays}d ${diffHours % 24}h`)
      } else if (diffHours > 0) {
        setTimeSince(`${diffHours}h ${diffMins % 60}m`)
      } else if (diffMins > 0) {
        setTimeSince(`${diffMins}m`)
      } else {
        setTimeSince('Just now')
      }
    }

    // Calculate immediately
    calculateTimeSince()

    // Update every minute
    const interval = setInterval(calculateTimeSince, 60000)
    return () => clearInterval(interval)
  }, [statusSince, isMounted])

  return (
    <div 
      className="flex flex-col items-center gap-0.5 cursor-pointer relative"
      onClick={(e) => {
        if (onClick) onClick(e)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (onContextMenu) onContextMenu(e)
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      suppressHydrationWarning
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Icon only - no box, no border, no background */}
      <div className={getIconColor()}>
        {getIcon()}
      </div>
      
      {/* Simple text label */}
      <div className="text-[10px] text-gray-700 max-w-[60px] truncate text-center">
        {name}
      </div>

      {/* Tooltip - only show after client mount */}
      {showTooltip && isMounted && timeSince !== null && (
        <div className="absolute bottom-full mb-2 z-50 pointer-events-none" suppressHydrationWarning>
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap shadow-lg">
            <div className="font-semibold">{name}</div>
            <div className="text-gray-300">{ip}</div>
            <div className={`font-medium ${
              status === 'up' ? 'text-green-400' : 
              status === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {status.toUpperCase()} - {timeSince}
            </div>
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

export default memo(DeviceNode)
