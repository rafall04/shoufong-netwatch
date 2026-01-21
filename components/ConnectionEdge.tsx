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

  // Handle pointer down on path to add waypoint (unified mouse/touch)
  const handlePathPointerDown = useCallback((e: React.PointerEvent<SVGPathElement>) => {
    if (!isEditable || !data?.onAddWaypoint) return
    
    // CRITICAL: Stop propagation to prevent conflicts
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

  // Handle waypoint drag using Pointer Events API (unified mouse/touch)
  const handleWaypointDragStart = useCallback((e: React.PointerEvent, index: number) => {
    if (!isEditable) return
    
    // CRITICAL: Stop propagation to prevent triggering path click
    e.stopPropagation()
    e.preventDefault()
    
    setDraggingWaypoint(index)
    
    // Capture pointer for smooth dragging
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    
    const handleMove = (moveEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // Update position in real-time using pointer coordinates
      data.onWaypointDrag(index, moveEvent.clientX, moveEvent.clientY, false)
    }
    
    const handleEnd = (endEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // Save to database on drag end
      data.onWaypointDrag(index, endEvent.clientX, endEvent.clientY, true)
      
      setDraggingWaypoint(null)
      setHoveredWaypoint(null)
      
      // Release pointer capture
      target.releasePointerCapture(endEvent.pointerId)
      
      // Clean up listeners
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleEnd)
      document.removeEventListener('pointercancel', handleEnd)
    }
    
    // Use Pointer Events for unified mouse/touch handling
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleEnd)
    document.addEventListener('pointercancel', handleEnd)
  }, [isEditable, data])

  // Handle waypoint removal via delete button (CRITICAL: Must stop all propagation)
  const handleRemoveWaypoint = useCallback((e: React.PointerEvent, index: number) => {
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    // CRITICAL: Stop ALL event propagation to prevent Ghost Click Bug
    // This prevents the click from bubbling to the line underneath
    e.stopPropagation()
    e.preventDefault()
    
    // Remove the waypoint
    data.onRemoveWaypoint(index)
    
    // Clear hover state
    setHoveredWaypoint(null)
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
      
      {/* Wide invisible path for easier clicking - using Pointer Events */}
      {isEditable && (
        <path
          d={edgePath}
          strokeWidth={20}
          stroke="transparent"
          fill="none"
          className="cursor-pointer"
          onPointerDown={handlePathPointerDown}
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
      
      {/* Waypoint markers with delete button */}
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
                // CRITICAL: High z-index to ensure delete button is above line
                zIndex: isDragging ? 1000 : isHovered ? 100 : 50,
              }}
            >
              {/* Waypoint container */}
              <div className="relative">
                {/* Draggable waypoint circle */}
                <div
                  className={`
                    ${isEditable ? 'cursor-move' : 'cursor-default'}
                    ${isDragging ? 'scale-125' : isHovered ? 'scale-110' : 'scale-100'}
                    transition-transform duration-150
                  `}
                  onPointerDown={(e) => handleWaypointDragStart(e, index)}
                  onPointerEnter={() => !isDragging && setHoveredWaypoint(index)}
                  onPointerLeave={() => !isDragging && setHoveredWaypoint(null)}
                  title={isEditable ? "Drag to move, click X to delete" : "Waypoint"}
                >
                  {/* Circle marker */}
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
                </div>
                
                {/* Delete button - visible on hover (mobile: always visible) */}
                {isEditable && (isHovered || isDragging) && (
                  <div
                    className="absolute -top-5 -right-5"
                    style={{
                      // CRITICAL: Highest z-index to be above everything
                      zIndex: 1001,
                    }}
                  >
                    {/* Invisible hit area for mobile (44x44px minimum) */}
                    <button
                      className="
                        relative
                        w-11 h-11 md:w-8 md:h-8
                        flex items-center justify-center
                        cursor-pointer
                        group
                      "
                      onPointerDown={(e) => {
                        // CRITICAL: Stop ALL propagation to prevent Ghost Click Bug
                        e.stopPropagation()
                        e.preventDefault()
                        
                        // Call delete handler
                        handleRemoveWaypoint(e, index)
                      }}
                      onClick={(e) => {
                        // CRITICAL: Additional safety - stop propagation on click too
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      aria-label="Delete waypoint"
                      title="Delete waypoint"
                      type="button"
                    >
                      {/* Visible X button (centered in hit area) */}
                      <div
                        className="
                          absolute inset-0
                          flex items-center justify-center
                        "
                      >
                        <div
                          className="
                            w-5 h-5
                            flex items-center justify-center
                            bg-red-500 hover:bg-red-600
                            rounded-full
                            shadow-lg
                            transition-all duration-200
                            group-hover:scale-110
                          "
                        >
                          <X className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      
                      {/* Debug: Show hit area in development (remove in production) */}
                      {/* <div className="absolute inset-0 border border-red-300 opacity-20" /> */}
                    </button>
                  </div>
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
