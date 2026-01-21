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
  
  // Build smooth Bezier curve path through waypoints using utility
  const edgePath = useMemo(() => {
    const start: Point = { x: sourceX, y: sourceY }
    const end: Point = { x: targetX, y: targetY }
    return calculateMultiPointBezierPath(start, waypoints, end, 0.25)
  }, [sourceX, sourceY, targetX, targetY, waypoints])

  // Status colors with gradient support using utility
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  // Get gradient colors from utility
  const { sourceColor, targetColor } = useMemo(
    () => calculateStatusGradient(sourceStatus, targetStatus),
    [sourceStatus, targetStatus]
  )
  
  const gradientId = `gradient-${id}`
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
    
    e.stopPropagation()
    e.preventDefault()
    
    setDraggingWaypoint(index)
    
    if (isTouchDevice) {
      setSelectedWaypoint(index)
    }
    
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    
    // CRITICAL FIX: Store last valid position to avoid (0,0) bug on pointerup
    let lastValidX = e.clientX
    let lastValidY = e.clientY
    
    const handleMove = (moveEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // Only update if coordinates are valid (not 0,0)
      if (moveEvent.clientX !== 0 || moveEvent.clientY !== 0) {
        lastValidX = moveEvent.clientX
        lastValidY = moveEvent.clientY
        data.onWaypointDrag(index, moveEvent.clientX, moveEvent.clientY, false)
      }
    }
    
    const handleEnd = (endEvent: PointerEvent) => {
      if (!data?.onWaypointDrag) return
      
      // CRITICAL FIX: Use last valid position if pointerup gives (0,0)
      const finalX = (endEvent.clientX === 0 && endEvent.clientY === 0) ? lastValidX : endEvent.clientX
      const finalY = (endEvent.clientX === 0 && endEvent.clientY === 0) ? lastValidY : endEvent.clientY
      
      data.onWaypointDrag(index, finalX, finalY, true)
      
      setDraggingWaypoint(null)
      target.releasePointerCapture(endEvent.pointerId)
      
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleEnd)
      document.removeEventListener('pointercancel', handleEnd)
    }
    
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

  // Handle waypoint removal via delete button - with native confirmation
  const handleDeleteClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus waypoint ini?\n\nTindakan ini tidak dapat dibatalkan.'
    )
    
    if (confirmed) {
      setHoveredWaypoint(null)
      setSelectedWaypoint(null)
      setDraggingWaypoint(null)
      data.onRemoveWaypoint(index)
    }
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
      {/* Define gradient for connection */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      
      {/* Main connection line with gradient - HIGH CONTRAST */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={4} // Increased from 3 to 4 for better visibility
        stroke={`url(#${gradientId})`}
        fill="none"
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        style={{
          transition: draggingWaypoint !== null ? 'none' : 'stroke 0.3s ease',
          filter: isUp ? 'drop-shadow(0 0 8px rgba(57, 255, 20, 0.6))' : // Neon green glow
                  isDown ? 'drop-shadow(0 0 8px rgba(255, 7, 58, 0.6))' : // Neon red glow
                  'none',
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
      
      {/* Animated flow effect - moving particles along path */}
      {animated && isUp && (
        <>
          {/* Particle 1 */}
          <circle r="3" fill={sourceColor} className="pointer-events-none">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Particle 2 (delayed) */}
          <circle r="3" fill={targetColor} className="pointer-events-none">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
              begin="1s"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
          
          {/* Glow effect on active connection - ENHANCED */}
          <path
            d={edgePath}
            strokeWidth={8} // Increased from 5 to 8 for stronger glow
            stroke={`url(#${gradientId})`}
            fill="none"
            opacity={0.3} // Increased from 0.2 to 0.3
            className="pointer-events-none"
            style={{
              filter: 'blur(6px)', // Increased from 4px to 6px
            }}
          />
        </>
      )}
      
      {/* Waypoint markers - ONLY visible in edit mode - READ ONLY (no drag) */}
      {isEditable && (
        <EdgeLabelRenderer>
          {waypoints.map((waypoint, index) => {
            return (
              <div
                key={`waypoint-${index}`}
                className="nodrag nopan waypoint-container"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)`,
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              >
                {/* Waypoint dot - SMALL and SUBTLE - NO INTERACTION */}
                <div
                  className="
                    w-2 h-2 rounded-full
                    bg-blue-500/60 backdrop-blur-sm
                    border border-blue-600
                    shadow-sm
                  "
                  title={`Waypoint ${index + 1}`}
                >
                  {/* Inner glow */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${sourceColor}20 0%, transparent 70%)`,
                    }}
                  />
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
