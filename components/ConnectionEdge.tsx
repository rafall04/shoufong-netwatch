'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null)
  const [draggingWaypoint, setDraggingWaypoint] = useState<number | null>(null)
  
  const waypoints = data?.waypoints || []
  const isEditable = data?.isEditable || false
  
  // Detect if device supports hover (desktop) or touch (mobile)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    // Detect touch capability
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  // Click outside handler to deselect waypoint on mobile
  useEffect(() => {
    if (!isTouchDevice || selectedWaypoint === null) return
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      // Check if click is outside waypoint area
      const target = e.target as HTMLElement
      if (!target.closest('.waypoint-container')) {
        setSelectedWaypoint(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isTouchDevice, selectedWaypoint])
  
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
    
    // On touch devices, also set as selected
    if (isTouchDevice) {
      setSelectedWaypoint(index)
    }
    
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
  }, [isEditable, isTouchDevice, data])
  
  // Handle waypoint click/tap to toggle selected state (mobile)
  const handleWaypointClick = useCallback((e: React.PointerEvent, index: number) => {
    if (!isEditable || !isTouchDevice) return
    
    // Stop propagation
    e.stopPropagation()
    e.preventDefault()
    
    // Toggle selected state
    setSelectedWaypoint(prev => prev === index ? null : index)
  }, [isEditable, isTouchDevice])

  // Handle waypoint removal via delete button (CRITICAL: Must stop all propagation)
  const handleRemoveWaypoint = useCallback((e: React.PointerEvent, index: number) => {
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    // CRITICAL: Stop ALL event propagation to prevent Ghost Click Bug
    // This prevents the click from bubbling to the line underneath
    e.stopPropagation()
    e.preventDefault()
    
    // Remove the waypoint
    data.onRemoveWaypoint(index)
    
    // Clear all states
    setHoveredWaypoint(null)
    setSelectedWaypoint(null)
  }, [isEditable, data])
  
  // Handle group hover (desktop only)
  const handleGroupEnter = useCallback((index: number) => {
    if (!isTouchDevice && !draggingWaypoint) {
      setHoveredWaypoint(index)
    }
  }, [isTouchDevice, draggingWaypoint])
  
  const handleGroupLeave = useCallback(() => {
    if (!isTouchDevice && !draggingWaypoint) {
      setHoveredWaypoint(null)
    }
  }, [isTouchDevice, draggingWaypoint])

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
          const isSelected = selectedWaypoint === index
          
          // Show delete button if:
          // - Desktop: hovered or dragging
          // - Mobile: selected or dragging
          const showDeleteButton = isEditable && (
            isTouchDevice ? (isSelected || isDragging) : (isHovered || isDragging)
          )
          
          return (
            <div
              key={`waypoint-${index}`}
              className="nodrag nopan waypoint-container"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)`,
                pointerEvents: 'none', // CRITICAL: Container is non-interactive
                // CRITICAL: Very high z-index to ensure above all lines
                zIndex: isDragging ? 9999 : (isHovered || isSelected) ? 9998 : 9997,
              }}
            >
              {/* GROUP HOVER CONTAINER - Wraps dot AND button with invisible padding */}
              <div 
                className="relative"
                onPointerEnter={() => handleGroupEnter(index)}
                onPointerLeave={handleGroupLeave}
                style={{
                  // Invisible padding area (40px) to prevent flickering
                  padding: '40px',
                  margin: '-40px',
                  pointerEvents: 'all', // CRITICAL: Enable interaction on group
                }}
              >
                {/* Draggable waypoint circle */}
                <div
                  className={`
                    ${isEditable ? 'cursor-move' : 'cursor-default'}
                    ${isDragging ? 'scale-125' : (isHovered || isSelected) ? 'scale-110' : 'scale-100'}
                    transition-transform duration-150
                  `}
                  onPointerDown={(e) => {
                    // On touch devices, first tap selects, then can drag
                    if (isTouchDevice && !isSelected) {
                      handleWaypointClick(e, index)
                    } else {
                      handleWaypointDragStart(e, index)
                    }
                  }}
                  title={isEditable ? "Drag to move, click X to delete" : "Waypoint"}
                  style={{
                    pointerEvents: 'all', // CRITICAL: Enable interaction
                  }}
                >
                  {/* Circle marker */}
                  <div
                    className={`
                      w-3 h-3 rounded-full border-2 bg-white
                      transition-all duration-200
                      shadow-md
                      ${(isHovered || isSelected || isDragging) ? 'border-blue-500 shadow-lg' : 'border-gray-400'}
                    `}
                    style={{
                      borderColor: (isHovered || isSelected || isDragging) ? '#3b82f6' : strokeColor,
                    }}
                  />
                </div>
                
                {/* Delete button - CLOSER positioning (12px offset) */}
                {showDeleteButton && (
                  <div
                    className="absolute"
                    style={{
                      // CRITICAL: Closer positioning - 12px offset from center
                      top: '-12px',
                      right: '-12px',
                      pointerEvents: 'all', // CRITICAL: Enable interaction
                      // CRITICAL: Highest z-index to be above everything
                      zIndex: 10000,
                    }}
                  >
                    {/* Touch-friendly button with large hit area */}
                    <button
                      className="
                        relative
                        w-10 h-10 md:w-7 md:h-7
                        flex items-center justify-center
                        cursor-pointer
                        group
                      "
                      onPointerDown={(e) => {
                        // CRITICAL: Stop ALL propagation FIRST
                        e.stopPropagation()
                        e.preventDefault()
                        
                        // CRITICAL: Immediate removal to prevent ghost clicks
                        handleRemoveWaypoint(e, index)
                      }}
                      onPointerUp={(e) => {
                        // CRITICAL: Stop propagation on pointer up too
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => {
                        // CRITICAL: Stop propagation on click
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onMouseDown={(e) => {
                        // CRITICAL: Stop propagation on mouse down
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onTouchStart={(e) => {
                        // CRITICAL: Stop propagation on touch start
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      aria-label="Delete waypoint"
                      title="Delete waypoint"
                      type="button"
                      style={{
                        // CRITICAL: Ensure button is above everything
                        position: 'relative',
                        zIndex: 10001,
                      }}
                    >
                      {/* Visible X button (centered in hit area) */}
                      <div
                        className="
                          w-5 h-5 md:w-4 md:h-4
                          flex items-center justify-center
                          bg-red-500 hover:bg-red-600 active:bg-red-700
                          rounded-full
                          shadow-lg
                          transition-all duration-150
                          group-hover:scale-110
                          group-active:scale-95
                        "
                        style={{
                          // CRITICAL: Prevent any pointer events on child
                          pointerEvents: 'none',
                        }}
                      >
                        <X className="w-3 h-3 md:w-2.5 md:h-2.5 text-white" strokeWidth={3} />
                      </div>
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
