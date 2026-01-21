'use client'

import React, { useState, useRef } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  
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
    e.preventDefault()
    
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
      
      {/* Waypoint markers using EdgeLabelRenderer - prevents pan issues */}
      {isEditable && waypoints.map((point, index) => (
        <EdgeLabelRenderer key={`waypoint-${index}`}>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            onMouseEnter={() => setHoveredWaypoint(index)}
            onMouseLeave={() => !isDragging && setHoveredWaypoint(null)}
          >
            {/* Outer ring when hovered */}
            {hoveredWaypoint === index && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  width: '28px',
                  height: '28px',
                  border: `2px solid ${strokeColor}`,
                  opacity: 0.3,
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                }}
              />
            )}
            
            {/* Main draggable waypoint */}
            <div
              className="cursor-move"
              style={{
                width: hoveredWaypoint === index ? '20px' : '16px',
                height: hoveredWaypoint === index ? '20px' : '16px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: `3px solid ${strokeColor}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseDown={(e) => {
                if (!data?.onWaypointDrag) return
                
                e.stopPropagation()
                e.preventDefault()
                setIsDragging(true)
                
                dragStartPos.current = { x: e.clientX, y: e.clientY }
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  moveEvent.stopPropagation()
                  moveEvent.preventDefault()
                  data?.onWaypointDrag?.(index, moveEvent.clientX, moveEvent.clientY)
                }
                
                const handleMouseUp = (upEvent: MouseEvent) => {
                  upEvent.stopPropagation()
                  upEvent.preventDefault()
                  setIsDragging(false)
                  dragStartPos.current = null
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }
                
                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
              onTouchStart={(e) => {
                if (!data?.onWaypointDrag) return
                
                e.stopPropagation()
                e.preventDefault()
                setIsDragging(true)
                
                const touch = e.touches[0]
                dragStartPos.current = { x: touch.clientX, y: touch.clientY }
                
                const handleTouchMove = (moveEvent: TouchEvent) => {
                  moveEvent.stopPropagation()
                  moveEvent.preventDefault()
                  const moveTouch = moveEvent.touches[0]
                  if (moveTouch) {
                    data?.onWaypointDrag?.(index, moveTouch.clientX, moveTouch.clientY)
                  }
                }
                
                const handleTouchEnd = (endEvent: TouchEvent) => {
                  endEvent.stopPropagation()
                  endEvent.preventDefault()
                  setIsDragging(false)
                  dragStartPos.current = null
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }
                
                document.addEventListener('touchmove', handleTouchMove, { passive: false })
                document.addEventListener('touchend', handleTouchEnd)
              }}
            >
              {/* Inner dot */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: strokeColor,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
            
            {/* Delete button */}
            {hoveredWaypoint === index && data?.onRemoveWaypoint && (
              <div
                className="cursor-pointer"
                style={{
                  position: 'absolute',
                  top: '-18px',
                  right: '-18px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  userSelect: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  data.onRemoveWaypoint?.(index)
                }}
              >
                ×
              </div>
            )}
            
            {/* Waypoint number label */}
            {hoveredWaypoint === index && (
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: strokeColor,
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                #{index + 1}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
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
