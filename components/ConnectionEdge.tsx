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
  onAddWaypoint?: (x: number, y: number) => void
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
  const [hoveredPath, setHoveredPath] = useState(false)
  
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

  // Handle double-click on path to add waypoint
  const handlePathDoubleClick = (e: React.MouseEvent<SVGPathElement>) => {
    if (!isEditable || !data?.onAddWaypoint) return
    
    e.stopPropagation()
    
    // Get click position relative to the SVG
    const svg = (e.target as SVGElement).ownerSVGElement
    if (!svg) return
    
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    
    // Transform to SVG coordinates
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse())
    
    // Add waypoint at double-click position
    data.onAddWaypoint(svgPoint.x, svgPoint.y)
  }

  // Waypoint drag - optimized for all devices
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
  
  // Touch support for mobile
  const handleWaypointTouchStart = (index: number, e: React.TouchEvent) => {
    if (!isEditable || !data?.onWaypointDrag) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0]
      if (touch) {
        data?.onWaypointDrag?.(index, touch.clientX, touch.clientY)
      }
    }
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  return (
    <>
      {/* Main path */}
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
      
      {/* Wide invisible path for easier double-click (desktop only) */}
      {isEditable && (
        <path
          d={edgePath}
          strokeWidth={16}
          stroke="transparent"
          fill="none"
          className="cursor-crosshair"
          onDoubleClick={handlePathDoubleClick}
          onMouseEnter={() => setHoveredPath(true)}
          onMouseLeave={() => setHoveredPath(false)}
          style={{
            pointerEvents: 'stroke'
          }}
        />
      )}
      
      {/* Hover indicator on path */}
      {isEditable && hoveredPath && (
        <path
          d={edgePath}
          strokeWidth={5}
          stroke={strokeColor}
          fill="none"
          strokeDasharray="4 4"
          opacity={0.3}
          className="pointer-events-none"
        />
      )}
      
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
      
      {/* Waypoint markers - LARGE touch targets */}
      {isEditable && waypoints.map((point, index) => (
        <g key={`waypoint-${index}`}>
          {/* Extra large invisible hit area for easier interaction */}
          <circle
            cx={point.x}
            cy={point.y}
            r={22}
            fill="transparent"
            className="cursor-move"
            onMouseDown={(e) => handleWaypointMouseDown(index, e)}
            onTouchStart={(e) => handleWaypointTouchStart(index, e)}
            onMouseEnter={() => setHoveredWaypoint(index)}
            onMouseLeave={() => setHoveredWaypoint(null)}
          />
          
          {/* Outer ring when hovered - visual feedback */}
          {hoveredWaypoint === index && (
            <circle
              cx={point.x}
              cy={point.y}
              r={14}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              opacity={0.3}
              className="pointer-events-none"
            />
          )}
          
          {/* Visual waypoint - larger for easier grabbing */}
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredWaypoint === index ? 10 : 8}
            fill="white"
            stroke={strokeColor}
            strokeWidth={3}
            className="pointer-events-none"
            style={{
              transition: 'r 0.15s ease',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}
          />
          
          {/* Inner dot for better visibility */}
          <circle
            cx={point.x}
            cy={point.y}
            r={4}
            fill={strokeColor}
            className="pointer-events-none"
          />
          
          {/* Delete button - larger touch target */}
          {hoveredWaypoint === index && data?.onRemoveWaypoint && (
            <g>
              {/* Larger invisible hit area */}
              <circle
                cx={point.x + 18}
                cy={point.y - 18}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  data.onRemoveWaypoint?.(index)
                }}
              />
              {/* Visual delete button */}
              <circle
                cx={point.x + 18}
                cy={point.y - 18}
                r={12}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
                className="pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              />
              <text
                x={point.x + 18}
                y={point.y - 12}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                ×
              </text>
            </g>
          )}
          
          {/* Waypoint number label */}
          {hoveredWaypoint === index && (
            <text
              x={point.x}
              y={point.y - 20}
              textAnchor="middle"
              fill={strokeColor}
              fontSize="11"
              fontWeight="bold"
              className="pointer-events-none select-none"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))'
              }}
            >
              #{index + 1}
            </text>
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
      
      {/* Helper text when hovering path in edit mode */}
      {isEditable && hoveredPath && !waypoints.length && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 30}px)`,
              pointerEvents: 'none',
            }}
          >
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-pulse">
              Double-click untuk tambah waypoint
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
