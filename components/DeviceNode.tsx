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
  onFinalizeDrawing?: () => void
  isDrawingMode?: boolean
  isDrawingSource?: boolean
}

const DeviceNode = ({ data }: NodeProps<DeviceNodeData>) => {
  const { name, status, type, ip, statusSince, onClick, onContextMenu, onFinalizeDrawing, isDrawingMode, isDrawingSource } = data
  const [showTooltip, setShowTooltip] = useState(false)
  const [timeSince, setTimeSince] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted flag on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Icon mapping - comprehensive device types (compact size)
  const getIcon = () => {
    switch (type) {
      case 'ROUTER':
        return <Router className="w-5 h-5" strokeWidth={1.5} />
      case 'SWITCH':
        return <Network className="w-5 h-5" strokeWidth={1.5} />
      case 'ACCESS_POINT':
        return <Wifi className="w-5 h-5" strokeWidth={1.5} />
      case 'PC':
        return <Monitor className="w-5 h-5" strokeWidth={1.5} />
      case 'LAPTOP':
        return <Laptop className="w-5 h-5" strokeWidth={1.5} />
      case 'TABLET':
        return <Tablet className="w-5 h-5" strokeWidth={1.5} />
      case 'PRINTER':
        return <Printer className="w-5 h-5" strokeWidth={1.5} />
      case 'SCANNER_GTEX':
        return <ScanBarcode className="w-5 h-5" strokeWidth={1.5} />
      case 'SMART_TV':
        return <Tv className="w-5 h-5" strokeWidth={1.5} />
      case 'CCTV':
        return <Video className="w-5 h-5" strokeWidth={1.5} />
      case 'SERVER':
        return <Server className="w-5 h-5" strokeWidth={1.5} />
      case 'PHONE':
        return <Smartphone className="w-5 h-5" strokeWidth={1.5} />
      case 'OTHER':
        return <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
      default:
        return <Router className="w-5 h-5" strokeWidth={1.5} />
    }
  }

  // Status-based styling - Keep icon colors only (border now forced in JSX)
  const getStatusStyles = () => {
    if (status === 'up') {
      return {
        iconColor: 'text-emerald-600',
      }
    }
    if (status === 'down') {
      return {
        iconColor: 'text-rose-600',
      }
    }
    return {
      iconColor: 'text-slate-500',
    }
  }

  const statusStyles = getStatusStyles()

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
      className={`cursor-pointer relative flex flex-col items-center justify-center ${
        isDrawingMode ? (isDrawingSource ? 'ring-2 ring-indigo-500 rounded-full' : '') : ''
      }`}
      style={{
        width: '48px', // Compact for high density
        height: '48px', // Tight with overlap
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (isDrawingMode) {
          // If in drawing mode and this is NOT the source, finalize connection
          if (isDrawingSource) {
            return // Can't connect to self
          }
          if (onFinalizeDrawing) {
            onFinalizeDrawing()
          }
        } else {
          // Normal mode: just show device details popup
          if (onClick) {
            onClick(e)
          }
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (onContextMenu) onContextMenu(e)
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      suppressHydrationWarning
    >
      {/* Handles positioned at center of icon */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="opacity-0"
        style={{ top: '24px', left: '24px' }}
      />
      
      {/* CRITICAL: Circular Icon Container - FORCED electric border colors */}
      <div 
        className="
          w-12 h-12 
          rounded-full 
          bg-white 
          border-[3px]
          z-20 
          flex items-center justify-center 
          shadow-md 
          transition-all duration-200
          hover:scale-110
        "
        style={{
          borderColor: status === 'up' ? '#00E055' : status === 'down' ? '#FF2222' : '#cbd5e1'
        }}
      >
        <div className={statusStyles.iconColor}>
          {getIcon()}
        </div>
      </div>
      
      {/* CRITICAL: Device Name Label - FORCED negative margin for overlap */}
      <div 
        className="
          -mt-3
          px-3 py-0.5 
          bg-white/95 
          border border-slate-200 
          rounded-md 
          shadow-sm
          z-30
          text-[10px] font-bold uppercase tracking-wider text-slate-700
          max-w-[80px] truncate text-center
        "
      >
        {name}
      </div>

      {/* Compact Tooltip */}
      {showTooltip && isMounted && (
        <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in" suppressHydrationWarning>
          <div className="
            bg-slate-900/95 backdrop-blur-sm
            text-white text-xs rounded-lg
            px-3 py-2
            whitespace-nowrap
            shadow-xl
            border border-slate-700/50
          ">
            <div className="font-semibold mb-1">{name}</div>
            <div className="text-slate-300 font-mono text-[10px] mb-1">{ip}</div>
            <div className="flex items-center gap-2">
              <div 
                className={`
                  w-2 h-2 rounded-full
                  ${status === 'up' ? 'bg-emerald-500' : 
                    status === 'down' ? 'bg-rose-500' : 'bg-slate-400'}
                  ${status === 'up' ? 'animate-pulse-slow' : ''}
                `}
              />
              <span className={`font-medium text-[10px] ${
                status === 'up' ? 'text-emerald-400' : 
                status === 'down' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {status.toUpperCase()}
              </span>
              {timeSince && (
                <span className="text-slate-400 text-[10px]">• {timeSince}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="opacity-0"
        style={{ top: '24px', left: '24px' }}
      />
    </div>
  )
}

export default memo(DeviceNode)
