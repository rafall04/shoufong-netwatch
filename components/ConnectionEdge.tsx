'use client'

import React, { useState } from 'react'
import { 
  EdgeProps, 
  getBezierPath, 
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  Position
} from 'reactflow'

interface ConnectionEdgeData {
  label?: string
  type?: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep'
  waypoints?: Array<{ x: number; y: number }>
  onWaypointDrag?: (index: number, x: number, y: number) => void
  onAddWaypoint?: (x: number, y: number) => void
  onRemoveWaypoint?: (index: number) => void
  isEditable?: boolean
}

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<ConnectionEdgeData>) {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const edgeType = data?.edgeType || 'default'
  const waypoints = data?.waypoints || []
  const isEditable = data?.isEditable || false
  
  let edgePath: string
  let labelX: number
  let labelY: number
  
  // Generate path based on edge type
  if (waypoints.length > 0) {
    // Custom path with waypoints
    const points = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY }
    ]
    
    // Create smooth path through waypoints
    edgePath = `M ${sourceX} ${sourceY}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      
      if (i === 0) {
        // First segment from source
        edgePath += ` L ${next.x} ${next.y}`
      } else {
        // Subsequent segments
        edgePath += ` L ${next.x} ${next.y}`
      }
    }
    
    // Calculate label position (middle waypoint or center)
    const midIndex = Math.floor(waypoints.length / 2)
    if (waypoints[midIndex]) {
      labelX = waypoints[midIndex].x
      labelY = waypoints[midIndex].y
    } else {
      labelX = (sourceX + targetX) / 2
      labelY = (sourceY + targetY) / 2
    }
  } else {
    // Standard paths without waypoints
    switch (edgeType) {
      case 'straight':
        [edgePath, labelX, labelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })
        break
      
      case 'step':
        [edgePath, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0, // Sharp corners for step
        })
        break
      
      case 'smoothstep':
        [edgePath, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 8, // Rounded corners
        })
        break
      
      case 'default':
      default:
        [edgePath, labelX, labelY] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })
        break
    }
  }

  // Determine connection status color - BRIGHTER COLORS
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  
  // Connection is UP only if both devices are UP
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  // Brighter, more vibrant colors with gradients
  const strokeColor = isUp ? '#22c55e' : isDown ? '#f87171' : '#9ca3af'
  const strokeColorDark = isUp ? '#16a34a' : isDown ? '#dc2626' : '#6b7280'
  const glowColor = isUp ? '#86efac' : isDown ? '#fca5a5' : '#d1d5db'
  
  const animated = data?.animated !== false
  
  // Different stroke styles based on connection type
  const strokeDasharray = data?.type === 'WIRELESS' ? '8 4' : 
                          data?.type === 'VIRTUAL' ? '4 6' : 
                          undefined

  // Handle waypoint drag
  const handleWaypointMouseDown = (index: number, e: React.MouseEvent) => {
    if (!isEditable || !data?.onWaypointDrag) return
    
    e.stopPropagation()
    setIsDragging(true)
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (data?.onWaypointDrag) {
        data.onWaypointDrag(index, moveEvent.clientX, moveEvent.clientY)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      {/* Outer glow/shadow for depth effect */}
      <path
        d={edgePath}
        strokeWidth={8}
        stroke={glowColor}
        fill="none"
        opacity={0.3}
        className="pointer-events-none"
      />
      
      {/* Dark inner shadow for 3D effect */}
      <path
        d={edgePath}
        strokeWidth={5}
        stroke={strokeColorDark}
        fill="none"
        opacity={0.6}
        className="pointer-events-none"
      />
      
      {/* Main path with gradient effect */}
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={1} />
          <stop offset="50%" stopColor={strokeColorDark} stopOpacity={0.9} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={1} />
        </linearGradient>
      </defs>
      
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={4}
        stroke={`url(#gradient-${id})`}
        fill="none"
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />
      
      {/* Animated overlay for flow effect - lightweight */}
      {animated && isUp && (
        <>
          {/* Primary flow */}
          <path
            d={edgePath}
            strokeWidth={3}
            stroke={strokeColor}
            fill="none"
            strokeDasharray="12 12"
            className="animate-dash-fast"
            opacity={0.7}
          />
          
          {/* Secondary glow flow */}
          <path
            d={edgePath}
            strokeWidth={5}
            stroke={glowColor}
            fill="none"
            strokeDasharray="8 16"
            className="animate-dash-slow"
            opacity={0.4}
          />
        </>
      )}
      
      {/* Waypoint markers - draggable */}
      {waypoints.map((point, index) => (
        <g key={`waypoint-${index}`}>
          {/* Outer glow */}
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredWaypoint === index ? 10 : 8}
            fill={glowColor}
            opacity={0.5}
            className="pointer-events-none"
          />
          
          {/* Main waypoint */}
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredWaypoint === index ? 7 : 6}
            fill={strokeColor}
            stroke="white"
            strokeWidth={2}
            className={`waypoint-marker ${isEditable ? 'cursor-move' : ''}`}
            onMouseEnter={() => setHoveredWaypoint(index)}
            onMouseLeave={() => setHoveredWaypoint(null)}
            onMouseDown={(e) => handleWaypointMouseDown(index, e)}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              transition: 'all 0.2s'
            }}
          />
          
          {/* Delete button on hover (if editable) */}
          {isEditable && hoveredWaypoint === index && data?.onRemoveWaypoint && (
            <g>
              <circle
                cx={point.x + 12}
                cy={point.y - 12}
                r={8}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  data.onRemoveWaypoint?.(index)
                }}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
              <text
                x={point.x + 12}
                y={point.y - 8}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
                className="pointer-events-none"
              >
                ×
              </text>
            </g>
          )}
        </g>
      ))}
      
      {/* Label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-white px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 border-2 shadow-lg"
              style={{
                borderColor: strokeColor,
                boxShadow: `0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px ${glowColor}`
              }}
            >
              {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      <style jsx>{`
        @keyframes dash-fast {
          to {
            stroke-dashoffset: -24;
          }
        }
        
        @keyframes dash-slow {
          to {
            stroke-dashoffset: 24;
          }
        }
        
        .animate-dash-fast {
          animation: dash-fast 1s linear infinite;
        }
        
        .animate-dash-slow {
          animation: dash-slow 2s linear infinite;
        }
        
        .waypoint-marker {
          transition: all 0.2s ease;
        }
        
        .waypoint-marker:hover {
          transform: scale(1.2);
        }
      `}</style>
    </>
  )
}
