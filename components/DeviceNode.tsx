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

  // Status-based styling with glassmorphism and NEON colors
  const getStatusStyles = () => {
    if (status === 'up') {
      return {
        borderColor: '#39FF14', // Neon Green
        iconColor: 'text-green-600',
        glowColor: 'rgba(57, 255, 20, 0.4)', // Neon green glow
        ringColor: 'ring-green-500/30',
        bgGradient: 'from-green-50/80 to-emerald-50/80',
      }
    }
    if (status === 'down') {
      return {
        borderColor: '#FF073A', // Neon Red
        iconColor: 'text-red-600',
        glowColor: 'rgba(255, 7, 58, 0.4)', // Neon red glow
        ringColor: 'ring-red-500/30',
        bgGradient: 'from-red-50/80 to-rose-50/80',
      }
    }
    return {
      borderColor: '#9ca3af',
      iconColor: 'text-gray-500',
      glowColor: 'rgba(156, 163, 175, 0.2)',
      ringColor: 'ring-gray-400/20',
      bgGradient: 'from-gray-50/80 to-slate-50/80',
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
      className="flex flex-col items-center gap-1 cursor-pointer relative group"
      style={{
        width: '96px', // Fixed width for ReactFlow calculations (80px + padding)
        height: '96px', // Fixed height for ReactFlow calculations
      }}
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
      {/* Handles positioned at center for proper edge connection */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="opacity-0"
        style={{ top: '48px', left: '48px' }} // Center of 96x96 container
      />
      
      {/* Glassmorphism card with breathing animation */}
      <div className="relative">
        {/* Breathing ring animation for UP status */}
        {status === 'up' && (
          <div 
            className="absolute inset-0 rounded-2xl animate-breathing"
            style={{
              boxShadow: `0 0 20px ${statusStyles.glowColor}`,
            }}
          />
        )}
        
        {/* Main card */}
        <div 
          className={`
            relative
            w-16 h-16
            rounded-2xl
            bg-gradient-to-br ${statusStyles.bgGradient}
            backdrop-blur-md
            border-2
            shadow-lg
            transition-all duration-300
            group-hover:scale-110
            group-hover:shadow-2xl
            flex items-center justify-center
            ${status === 'down' ? 'animate-shake' : ''}
          `}
          style={{
            borderColor: statusStyles.borderColor,
            boxShadow: `0 4px 12px ${statusStyles.glowColor}, 0 0 0 1px ${statusStyles.borderColor}20`,
          }}
        >
          {/* Icon */}
          <div className={`${statusStyles.iconColor} transition-transform duration-300 group-hover:scale-110`}>
            {getIcon()}
          </div>
          
          {/* Status indicator dot with NEON colors */}
          <div 
            className={`
              absolute -top-1 -right-1
              w-4 h-4 rounded-full
              border-2 border-white
              ${status === 'up' ? 'animate-pulse-slow' : ''}
            `}
            style={{
              backgroundColor: status === 'up' ? '#39FF14' : 
                              status === 'down' ? '#FF073A' : 
                              '#9ca3af',
              boxShadow: `0 0 12px ${statusStyles.glowColor}`, // Stronger glow
            }}
          />
        </div>
      </div>
      
      {/* Device name label with glassmorphism */}
      <div className="
        px-2 py-0.5
        bg-white/80 backdrop-blur-sm
        rounded-md
        border border-gray-200/50
        shadow-sm
        text-[10px] text-gray-700 font-medium
        max-w-[80px] truncate text-center
        transition-all duration-200
        group-hover:bg-white/90
        group-hover:shadow-md
      ">
        {name}
      </div>

      {/* Enhanced tooltip with metrics */}
      {showTooltip && isMounted && (
        <div className="absolute bottom-full mb-3 z-50 pointer-events-none animate-fade-in" suppressHydrationWarning>
          <div className="
            bg-gray-900/95 backdrop-blur-md
            text-white text-xs rounded-lg
            px-3 py-2
            whitespace-nowrap
            shadow-2xl
            border border-gray-700/50
          ">
            <div className="font-semibold text-sm mb-1">{name}</div>
            <div className="text-gray-300 font-mono text-[10px] mb-1">{ip}</div>
            <div className="flex items-center gap-2">
              <div 
                className={`
                  w-2 h-2 rounded-full
                  ${status === 'up' ? 'animate-pulse-slow' : ''}
                `}
                style={{
                  backgroundColor: status === 'up' ? '#39FF14' : 
                                  status === 'down' ? '#FF073A' : 
                                  '#9ca3af',
                  boxShadow: status === 'up' ? '0 0 8px rgba(57, 255, 20, 0.6)' :
                            status === 'down' ? '0 0 8px rgba(255, 7, 58, 0.6)' :
                            'none',
                }}
              />
              <span className={`font-medium ${
                status === 'up' ? 'text-green-400' : 
                status === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {status.toUpperCase()}
              </span>
              {timeSince && (
                <span className="text-gray-400 text-[10px]">• {timeSince}</span>
              )}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="
            absolute top-full left-1/2 -translate-x-1/2 -mt-px
            w-0 h-0
            border-l-4 border-l-transparent
            border-r-4 border-r-transparent
            border-t-4 border-t-gray-900/95
          " />
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="opacity-0"
        style={{ top: '48px', left: '48px' }} // Center of 96x96 container
      />
    </div>
  )
}

export default memo(DeviceNode)
