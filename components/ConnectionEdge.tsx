'use client'

import React, { useState, useRef } from 'react'
import { 
  EdgeProps, 
  EdgeLabelRenderer,
} from 'reactflow'
import { X } from 'lucide-react'

interface Waypoint {
  x: number
  y: number
  label?: string
}

interface ConnectionEdgeData {
  label?: string
  type?: 'LAN' | 'WIRELESS' | 'FIBER_OPTIC'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  waypoints?: Waypoint[]
  onWaypointDrag?: (index: number, x: number, y: number, isDragEnd: boolean) => void
  onWaypointLabelChange?: (index: number, label: string) => void
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
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [labelInput, setLabelInput] = useState('')
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
    
    const svg = (e.target as SVGElement).ownerSVGElement
    if (!svg) return
    
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse())
    data.onAddWaypoint(svgPoint.x, svgPoint.y)
  }

  // Handle waypoint label click
  const handleWaypointClick = (index: number, currentLabel?: string) => {
    if (!isEditable || isDragging) return
    setEditingLabel(index)
    setLabelInput(currentLabel || '')
  }

  // Save waypoint label
  const saveWaypointLabel = (index: number) => {
    if (data?.onWaypointLabelChange) {
      data.onWaypointLabelChange(index, labelInput.trim())
    }
    setEditingLabel(null)
    setLabelInput('')
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
      
      {/* Wide invisible path for easier double-click */}
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
          style={{ pointerEvents: 'stroke' }}
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
          style={{ animation: 'dash 1s linear infinite' }}
        />
      )}
      
      {/* Waypoint markers and labels - using EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        {waypoints.map((waypoint, index) => {
          const isEditing = editingLabel === index
          const hasLabel = waypoint.label && waypoint.label.trim() !== ''
          
          return (
            <div
              key={`waypoint-${index}`}
              className="nodrag nopan"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)`,
                pointerEvents: 'all',
              }}
            >
              {/* Waypoint marker */}
              <div
                className={`
                  relative
                  ${isEditable ? 'cursor-move' : 'cursor-default'}
                `}
                onMouseDown={(e) => {
                  if (!isEditable) return
                  e.stopPropagation()
                  setIsDragging(true)
                  dragStartPos.current = { x: e.clientX, y: e.clientY }
                  setHoveredWaypoint(index)
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    if (data?.onWaypointDrag) {
                      data.onWaypointDrag(index, moveEvent.clientX, moveEvent.clientY, false)
                    }
                  }
                  
                  const handleMouseUp = (upEvent: MouseEvent) => {
                    if (data?.onWaypointDrag) {
                      data.onWaypointDrag(index, upEvent.clientX, upEvent.clientY, true)
                    }
                    setIsDragging(false)
                    setHoveredWaypoint(null)
                    dragStartPos.current = null
                    document.removeEventListener('mousemove', handleMouseMove)
                    document.removeEventListener('mouseup', handleMouseUp)
                  }
                  
                  document.addEventListener('mousemove', handleMouseMove)
                  document.addEventListener('mouseup', handleMouseUp)
                }}
                onTouchStart={(e) => {
                  if (!isEditable) return
                  e.stopPropagation()
                  setIsDragging(true)
                  const touch = e.touches[0]
                  dragStartPos.current = { x: touch.clientX, y: touch.clientY }
                  setHoveredWaypoint(index)
                  
                  const handleTouchMove = (moveEvent: TouchEvent) => {
                    const moveTouch = moveEvent.touches[0]
                    if (data?.onWaypointDrag) {
                      data.onWaypointDrag(index, moveTouch.clientX, moveTouch.clientY, false)
                    }
                  }
                  
                  const handleTouchEnd = (endEvent: TouchEvent) => {
                    const endTouch = endEvent.changedTouches[0]
                    if (data?.onWaypointDrag) {
                      data.onWaypointDrag(index, endTouch.clientX, endTouch.clientY, true)
                    }
                    setIsDragging(false)
                    setHoveredWaypoint(null)
                    dragStartPos.current = null
                    document.removeEventListener('touchmove', handleTouchMove)
                    document.removeEventListener('touchend', handleTouchEnd)
                  }
                  
                  document.addEventListener('touchmove', handleTouchMove)
                  document.addEventListener('touchend', handleTouchEnd)
                }}
              >
                {/* Waypoint circle */}
                <div
                  className={`
                    w-11 h-11 rounded-full border-2 bg-white
                    flex items-center justify-center
                    transition-all duration-200
                    ${hoveredWaypoint === index ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-400 shadow-md'}
                  `}
                  style={{
                    borderColor: hoveredWaypoint === index ? '#3b82f6' : strokeColor,
                  }}
                >
                  <span className="text-xs font-semibold text-gray-700">
                    #{index + 1}
                  </span>
                </div>
                
                {/* Remove waypoint button */}
                {isEditable && data?.onRemoveWaypoint && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Hapus waypoint #${index + 1}?`)) {
                        data.onRemoveWaypoint?.(index)
                      }
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                    title="Hapus waypoint"
                    aria-label="Hapus waypoint"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {/* Label display/edit */}
              <div className="mt-1 min-w-[120px]">
                {isEditing ? (
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        saveWaypointLabel(index)
                      } else if (e.key === 'Escape') {
                        setEditingLabel(null)
                        setLabelInput('')
                      }
                    }}
                    onBlur={() => saveWaypointLabel(index)}
                    autoFocus
                    placeholder="Label waypoint..."
                    className="w-full px-2 py-1 text-xs border border-blue-500 rounded bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div
                    onClick={() => handleWaypointClick(index, waypoint.label)}
                    className={`
                      px-2 py-1 text-xs rounded text-center cursor-pointer transition-all
                      ${hasLabel 
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }
                    `}
                    title={hasLabel ? 'Klik untuk edit label' : 'Klik untuk tambah label'}
                  >
                    {hasLabel ? waypoint.label : `#${index + 1} (klik untuk label)`}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </EdgeLabelRenderer>
    </>
  )
}
