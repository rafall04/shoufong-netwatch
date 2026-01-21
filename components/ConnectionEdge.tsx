'use client'

import React, { useState } from 'react'
import { 
  EdgeProps, 
  EdgeLabelRenderer,
} from 'reactflow'

interface ConnectionEdgeData {
  label?: string
  type?: 'LAN' | 'WIRELESS' | 'FIBER_OPTIC'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  waypoints?: Array<{ x: number; y: number }>
  onWaypointDrag?: (index: number, x: number, y: number) => void
  onRemoveWaypoint?: (index: number) => void
  isEditable?: boolean
}

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
}: EdgeProps<ConnectionEdgeData>) {
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null)
  
  const waypoints = data?.waypoints || []
  const isEditable = data?.isEditable || false
  
  // Build path through waypoints
  let edgePath: string
  let labelX: number
  let labelY: number
  
  if (waypoints.length > 0) {
    edgePath = `M ${sourceX} ${sourceY}`
    waypoints.forEach((point) => {
      edgePath += ` L ${point.x} ${point.y}`
    })
    edgePath += ` L ${targetX} ${targetY}`
    
    const midIndex = Math.floor(waypoints.length / 2)
    labelX = waypoints[midIndex]?.x || (sourceX + targetX) / 2
    labelY = waypoints[midIndex]?.y || (sourceY + targetY) / 2
  } else {
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = (sourceY + targetY) / 2
  }

  // Status colors
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  const strokeColor = isUp ? '#22c55e' : isDown ? '#f87171' : '#9ca3af'
  const animated = data?.animated !== false
  
  // Stroke style based on type
  const strokeDasharray = data?.type === 'WIRELESS' ? '8 4' : 
                          data?.type === 'FIBER_OPTIC' ? '2 2' : 
                          undefined

  // Simplified waypoint drag - more efficient
  const handleWaypointMouseDown = (index: number, e: React.MouseEvent) => {
    if (!isEditable || !data?.onWaypointDrag) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      data?.onWaypointDrag?.(index, moveEvent.clientX, moveEvent.clientY)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      {/* Main path - single layer, no gradients */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={3}
        stroke={strokeColor}
        fill="none"
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
      />
      
      {/* Animated flow - only when UP */}
      {animated && isUp && (
        <path
          d={edgePath}
          strokeWidth={2}
          stroke={strokeColor}
          fill="none"
          strokeDasharray="8 8"
          opacity={0.6}
          className="pointer-events-none"
          style={{
            animation: 'dash 1s linear infinite'
          }}
        />
      )}
      
      {/* Waypoint markers - larger and easier to grab */}
      {isEditable && waypoints.map((point, index) => (
        <g key={`waypoint-${index}`}>
          {/* Larger hit area for easier dragging */}
          <circle
            cx={point.x}
            cy={point.y}
            r={12}
            fill="transparent"
            className="cursor-move"
            onMouseDown={(e) => handleWaypointMouseDown(index, e)}
            onMouseEnter={() => setHoveredWaypoint(index)}
            onMouseLeave={() => setHoveredWaypoint(null)}
          />
          
          {/* Visual waypoint */}
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredWaypoint === index ? 8 : 6}
            fill={strokeColor}
            stroke="white"
            strokeWidth={2}
            className="pointer-events-none"
            style={{
              transition: 'r 0.15s ease'
            }}
          />
          
          {/* Delete button - always visible when hovered */}
          {hoveredWaypoint === index && data?.onRemoveWaypoint && (
            <g>
              <circle
                cx={point.x + 14}
                cy={point.y - 14}
                r={10}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  data.onRemoveWaypoint?.(index)
                }}
              />
              <text
                x={point.x + 14}
                y={point.y - 9}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                className="pointer-events-none select-none"
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
            <div 
              className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 border shadow-sm"
              style={{ borderColor: strokeColor }}
            >
              {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -16;
          }
        }
      `}</style>
    </>
  )
}
