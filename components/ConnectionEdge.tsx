'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  EdgeProps, 
  EdgeLabelRenderer,
} from 'reactflow'
import { X } from 'lucide-react'
import { calculateMultiPointBezierPath, calculateStatusGradient, Point } from '@/lib/bezier-utils'

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

  // Handle waypoint drag start - SIMPLIFIED with GLOBAL listeners
  const handleWaypointPointerDown = useCallback((e: React.PointerEvent, index: number) => {
    if (!isEditable) return
    
    e.stopPropagation()
    e.preventDefault()
    
    setDraggingWaypoint(index)
    
    // Store initial position
    const startX = e.clientX
    const startY = e.clientY
    
    // CRITICAL: Attach listeners to DOCUMENT for unlimited drag range
    const handleMove = (moveEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // Update position in real-time
      data.onWaypointDrag(index, moveEvent.clientX, moveEvent.clientY, false)
    }
    
    const handleEnd = (endEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // Save final position to DB
      data.onWaypointDrag(index, endEvent.clientX, endEvent.clientY, true)
      
      // Cleanup
      setDraggingWaypoint(null)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleEnd)
      document.removeEventListener('pointercancel', handleEnd)
    }
    
    // Attach to document for global tracking
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleEnd)
    document.addEventListener('pointercancel', handleEnd)
  }, [isEditable, data])
  
  // Remove unused handlers
  // handleWaypointPointerMove and handleWaypointPointerUp are now handled in handleWaypointPointerDown
  
  // Handle waypoint delete - SIMPLIFIED
  const handleWaypointDelete = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    const confirmed = window.confirm('Hapus waypoint ini?')
    if (confirmed) {
      data.onRemoveWaypoint(index)
    }
  }, [isEditable, data])
  
  // Handle add waypoint on path click - SIMPLIFIED
  const handlePathClick = useCallback((e: React.PointerEvent<SVGPathElement>) => {
    if (!isEditable || !data?.onAddWaypoint) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const svg = (e.target as SVGElement).ownerSVGElement
    if (!svg) return
    
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse())
    data.onAddWaypoint(svgPoint.x, svgPoint.y)
  }, [isEditable, data])
  
  // Build smooth Bezier curve path through waypoints using utility
  const edgePath = useMemo(() => {
    const start: Point = { x: sourceX, y: sourceY }
    const end: Point = { x: targetX, y: targetY }
    return calculateMultiPointBezierPath(start, waypoints, end, 0.25)
  }, [sourceX, sourceY, targetX, targetY, waypoints])

  // Status colors - Refined engineering palette
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  // Get gradient colors - Subtle slate for normal, colored for status
  const { sourceColor, targetColor } = useMemo(() => {
    if (isDown) {
      return { sourceColor: '#f43f5e', targetColor: '#f43f5e' } // Rose
    }
    if (isUp) {
      return { sourceColor: '#10b981', targetColor: '#10b981' } // Emerald
    }
    return { sourceColor: '#cbd5e1', targetColor: '#cbd5e1' } // Slate-300
  }, [isUp, isDown])
  
  const gradientId = `gradient-${id}`
  const animated = data?.animated !== false
  
  // Stroke style based on type
  const strokeDasharray = data?.type === 'WIRELESS' ? '8 4' : 
                          data?.type === 'FIBER_OPTIC' ? '2 2' : 
                          undefined

  return (
    <>
      {/* Define gradient for connection */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      
      {/* Main connection line - Refined and subtle */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={1.5} // Reduced from 4 to 1.5 for refined look
        stroke={`url(#${gradientId})`}
        fill="none"
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        style={{
          transition: draggingWaypoint !== null ? 'none' : 'stroke 0.3s ease',
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
          onPointerDown={handlePathClick}
          style={{ pointerEvents: 'stroke' }}
        />
      )}
      
      {/* Animated flow effect - Subtle marching ants for active connections */}
      {animated && isUp && (
        <>
          {/* Marching ants animation */}
          <path
            d={edgePath}
            strokeWidth={1.5}
            stroke="#6366f1" // Indigo for active flow
            fill="none"
            strokeDasharray="4 4"
            className="pointer-events-none"
            style={{
              animation: 'dash 1s linear infinite',
            }}
          />
        </>
      )}
      
      {/* Waypoint markers - SIMPLE drag with GLOBAL listeners */}
      {isEditable && (
        <EdgeLabelRenderer>
          {waypoints.map((waypoint, index) => {
            const isDragging = draggingWaypoint === index
            const isHovered = hoveredWaypoint === index
            
            return (
              <div
                key={`waypoint-${index}`}
                className="nodrag nopan waypoint-container"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)`,
                  pointerEvents: 'all',
                  zIndex: 9999,
                }}
              >
                <div 
                  className="relative"
                  onMouseEnter={() => setHoveredWaypoint(index)}
                  onMouseLeave={() => setHoveredWaypoint(null)}
                  style={{
                    padding: '12px',
                    margin: '-12px',
                  }}
                >
                  {/* Waypoint dot - Clean and minimal */}
                  <div
                    className={`
                      relative rounded-full
                      bg-indigo-500/80 backdrop-blur-sm
                      border-2 border-white
                      shadow-sm
                      transition-all duration-150
                      cursor-move
                      ${isDragging ? 'w-4 h-4 scale-125 shadow-md' : 
                        isHovered ? 'w-3 h-3 scale-110 shadow-sm' : 
                        'w-2.5 h-2.5'}
                    `}
                    onPointerDown={(e) => handleWaypointPointerDown(e, index)}
                    title="Drag untuk geser waypoint (unlimited range)"
                  />
                  
                  {/* Delete button - show on hover */}
                  {isHovered && !isDragging && (
                    <button
                      className="
                        absolute -top-1 -right-1
                        w-4 h-4
                        flex items-center justify-center
                        bg-red-500 hover:bg-red-600
                        rounded-full
                        shadow-md
                        transition-colors
                      "
                      onClick={(e) => handleWaypointDelete(e, index)}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label="Hapus waypoint"
                      title="Hapus waypoint"
                    >
                      <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </EdgeLabelRenderer>
      )}
      
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
