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
  onStartDrawing?: () => void
  onFinalizeDrawing?: () => void
  isDrawingMode?: boolean
  isDrawingSource?: boolean
}

const DeviceNode = ({ data }: NodeProps<DeviceNodeData>) => {
  const { name, status, type, ip, statusSince, onClick, onContextMenu, onStartDrawing, onFinalizeDrawing, isDrawingMode, isDrawingSource } = data
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
        return <Router className="w-7 h-7" strokeWidth={1.5} />
      case 'SWITCH':
        return <Network className="w-7 h-7" strokeWidth={1.5} />
      case 'ACCESS_POINT':
        return <Wifi className="w-7 h-7" strokeWidth={1.5} />
      case 'PC':
        return <Monitor className="w-7 h-7" strokeWidth={1.5} />
      case 'LAPTOP':
        return <Laptop className="w-7 h-7" strokeWidth={1.5} />
      case 'TABLET':
        return <Tablet className="w-7 h-7" strokeWidth={1.5} />
      case 'PRINTER':
        return <Printer className="w-7 h-7" strokeWidth={1.5} />
      case 'SCANNER_GTEX':
        return <ScanBarcode className="w-7 h-7" strokeWidth={1.5} />
      case 'SMART_TV':
        return <Tv className="w-7 h-7" strokeWidth={1.5} />
      case 'CCTV':
        return <Video className="w-7 h-7" strokeWidth={1.5} />
      case 'SERVER':
        return <Server className="w-7 h-7" strokeWidth={1.5} />
      case 'PHONE':
        return <Smartphone className="w-7 h-7" strokeWidth={1.5} />
      case 'OTHER':
        return <HelpCircle className="w-7 h-7" strokeWidth={1.5} />
      default:
        return <Router className="w-7 h-7" strokeWidth={1.5} />
    }
  }

  // Status-based styling - Clean engineering aesthetic
  const getStatusStyles = () => {
    if (status === 'up') {
      return {
        pulseColor: 'bg-emerald-500',
        iconColor: 'text-slate-600',
      }
    }
    if (status === 'down') {
      return {
        pulseColor: 'bg-rose-500',
        iconColor: 'text-slate-600',
      }
    }
    return {
      pulseColor: 'bg-slate-400',
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
      className={`cursor-pointer relative group ${
        isDrawingMode ? (isDrawingSource ? 'ring-2 ring-indigo-500/50 rounded-xl' : 'ring-1 ring-slate-300 rounded-xl') : ''
      }`}
      style={{
        width: '180px', // Card token width
        height: '96px', // Fixed height for ReactFlow
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (isDrawingMode) {
          if (isDrawingSource) {
            return
          }
          if (onFinalizeDrawing) {
            onFinalizeDrawing()
          }
        } else {
          if (onStartDrawing) {
            onStartDrawing()
          }
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
      {/* Handles positioned at center */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="opacity-0"
        style={{ top: '48px', left: '90px' }}
      />
      
      {/* Card Token Design */}
      <div className="
        w-full h-full
        bg-white rounded-xl 
        border border-slate-200 
        shadow-sm 
        transition-all duration-200 
        hover:shadow-md
        hover:ring-2 hover:ring-indigo-500/20
        flex items-center gap-3 px-3
      ">
        {/* Icon Area - Left Side */}
        <div className="flex-shrink-0 w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
          <div className={statusStyles.iconColor}>
            {getIcon()}
          </div>
        </div>
        
        {/* Info Area - Right Side */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Device Name */}
          <div className="font-semibold text-slate-800 text-sm truncate">
            {name}
          </div>
          
          {/* IP Address */}
          <div className="font-mono text-xs text-slate-500 truncate">
            {ip}
          </div>
        </div>
        
        {/* Status Pulse Dot - Top Right Corner */}
        <div 
          className={`
            absolute top-2 right-2
            w-2.5 h-2.5 rounded-full
            ${statusStyles.pulseColor}
            ${status === 'up' ? 'animate-pulse-slow' : ''}
          `}
        />
      </div>

      {/* Clean tooltip */}
      {showTooltip && isMounted && (
        <div className="absolute bottom-full mb-2 z-50 pointer-events-none animate-fade-in" suppressHydrationWarning>
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
                  ${statusStyles.pulseColor}
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
        style={{ top: '48px', left: '90px' }}
      />
    </div>
  )
}

export default memo(DeviceNode)
