'use client'

import React, { useState, useCallback } from 'react'
import { 
  EdgeProps, 
  EdgeLabelRenderer,
} from 'reactflow'
import { X } from 'lucide-react'

interface Waypoint {
  x: number
  y: number
}

interface ConnectionEdgeData {
  label?: string
  type?: 'LAN' | 'WIRELESS' | 'FIBER_OPTIC'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  waypoints?: Waypoint[]
  onWaypointDrag?: (index: number, x: number, y: number, isDragEnd: boolean) => void
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
  const [draggingWaypoint, setDraggingWaypoint] = useState<number | null>(null)
  
  const waypoints = data?.waypoints || []
  const isEditable = data?.isEditable || false
  
  // Build straight line path through waypoints
  const buildPath = useCallback(() => {
    if (waypoints.length === 0) {
      // No waypoints - straight line from source to target
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
    
    // Build path through all waypoints
    let path = `M ${sourceX} ${sourceY}`
    waypoints.forEach((point) => {
      path += ` L ${point.x} ${point.y}`
    })
    path += ` L ${targetX} ${targetY}`
    
    return path
  }, [sourceX, sourceY, targetX, targetY, waypoints])
  
  const edgePath = buildPath()

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

  // Handle click on path to add waypoint
  const handlePathClick = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    if (!isEditable || !data?.onAddWaypoint) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const svg = (e.target as SVGElement).ownerSVGElement
    if (!svg) return
    
    // Get exact click position in SVG coordinates
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse())
    
    // Add waypoint at exact click position
    data.onAddWaypoint(svgPoint.x, svgPoint.y)
  }, [isEditable, data])

  // Handle waypoint drag
  const handleWaypointDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (!isEditable) return
    
    e.stopPropagation()
    setDraggingWaypoint(index)
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!data?.onWaypointDrag) return
      
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY
      
      // Update position in real-time
      data.onWaypointDrag(index, clientX, clientY, false)
    }
    
    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      if (!data?.onWaypointDrag) return
      
      const clientX = 'changedTouches' in endEvent ? endEvent.changedTouches[0].clientX : endEvent.clientX
      const clientY = 'changedTouches' in endEvent ? endEvent.changedTouches[0].clientY : endEvent.clientY
      
      // Save to database on drag end
      data.onWaypointDrag(index, clientX, clientY, true)
      
      setDraggingWaypoint(null)
      setHoveredWaypoint(null)
      
      document.removeEventListener('mousemove', handleMove as any)
      document.removeEventListener('mouseup', handleEnd as any)
      document.removeEventListener('touchmove', handleMove as any)
      document.removeEventListener('touchend', handleEnd as any)
    }
    
    document.addEventListener('mousemove', handleMove as any)
    document.addEventListener('mouseup', handleEnd as any)
    document.addEventListener('touchmove', handleMove as any)
    document.addEventListener('touchend', handleEnd as any)
  }, [isEditable, data])

  // Handle waypoint removal
  const handleRemoveWaypoint = useCallback((e: React.MouseEvent, index: number) => {
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    e.stopPropagation()
    e.preventDefault()
    data.onRemoveWaypoint(index)
  }, [isEditable, data])

  return (
    <>
      {/* Main connection line */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={3}
        stroke={strokeColor}
        fill="none"
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        style={{
          transition: draggingWaypoint !== null ? 'none' : 'stroke 0.2s ease',
        }}
      />
      
      {/* Wide invisible path for easier clicking */}
      {isEditable && (
        <path
          d={edgePath}
          strokeWidth={20}
          stroke="transparent"
          fill="none"
          className="cursor-pointer"
          onClick={handlePathClick}
          style={{ pointerEvents: 'stroke' }}
        />
      )}
      
      {/* Animated flow effect when connection is UP */}
      {animated && isUp && (
        <path
          d={edgePath}
          strokeWidth={2}
          stroke={strokeColor}
          fill="none"
          strokeDasharray="8 8"
          opacity={0.6}
          className="pointer-events-none"
          style={{ animation: 'dash 1s linear infinite' }}
        />
      )}
      
      {/* Waypoint markers - clean visual only, no labels */}
      <EdgeLabelRenderer>
        {waypoints.map((waypoint, index) => {
          const isDragging = draggingWaypoint === index
          const isHovered = hoveredWaypoint === index
          
          return (
            <div
              key={`waypoint-${index}`}
              className="nodrag nopan"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)`,
                pointerEvents: 'all',
                zIndex: isDragging ? 1000 : 10,
              }}
            >
              {/* Waypoint marker - simple draggable circle */}
              <div
                className={`
                  relative
                  ${isEditable ? 'cursor-move' : 'cursor-default'}
                  ${isDragging ? 'scale-125' : isHovered ? 'scale-110' : 'scale-100'}
                  transition-transform duration-150
                `}
                onMouseDown={(e) => handleWaypointDragStart(e, index)}
                onTouchStart={(e) => handleWaypointDragStart(e, index)}
                onMouseEnter={() => !isDragging && setHoveredWaypoint(index)}
                onMouseLeave={() => !isDragging && setHoveredWaypoint(null)}
                onClick={(e) => {
                  // Prevent click from bubbling to path
                  e.stopPropagation()
                  e.preventDefault()
                }}
              >
                {/* Simple circle marker */}
                <div
                  className={`
                    w-3 h-3 rounded-full border-2 bg-white
                    transition-all duration-200
                    shadow-md
                    ${isHovered || isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-400'}
                  `}
                  style={{
                    borderColor: isHovered || isDragging ? '#3b82f6' : strokeColor,
                  }}
                />
                
                {/* Remove button - only show on hover in edit mode */}
                {isEditable && isHovered && !isDragging && (
                  <button
                    onClick={(e) => handleRemoveWaypoint(e, index)}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                    title="Remove waypoint"
                    aria-label="Remove waypoint"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </EdgeLabelRenderer>
      
      {/* Connection label (if exists) - at middle of path */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs text-gray-700">
              {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
