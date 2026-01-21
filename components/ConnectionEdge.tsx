'use client'

import React, { useState, useCallback } from 'react'
import { 
  EdgeProps, 
  EdgeLabelRenderer,
  getSmoothStepPath,
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
  const [draggingWaypoint, setDraggingWaypoint] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [labelInput, setLabelInput] = useState('')
  
  const waypoints = data?.waypoints || []
  const isEditable = data?.isEditable || false
  
  // Build path through waypoints
  const buildPath = useCallback(() => {
    if (waypoints.length === 0) {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
    
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

  // Handle click on path to add waypoint - BEST PRACTICE: Click exact position
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

  // Handle waypoint drag start
  const handleWaypointDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (!isEditable) return
    
    e.stopPropagation()
    setDraggingWaypoint(index)
    setHoveredWaypoint(index)
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!data?.onWaypointDrag) return
      
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY
      
      // Update position in real-time (optimistic update)
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

  // Handle waypoint label click
  const handleLabelClick = useCallback((index: number, currentLabel?: string) => {
    if (!isEditable || draggingWaypoint !== null) return
    setEditingLabel(index)
    setLabelInput(currentLabel || '')
  }, [isEditable, draggingWaypoint])

  // Save waypoint label
  const saveLabel = useCallback((index: number) => {
    if (data?.onWaypointLabelChange) {
      data.onWaypointLabelChange(index, labelInput.trim())
    }
    setEditingLabel(null)
    setLabelInput('')
  }, [data, labelInput])

  // Handle waypoint right-click to remove
  const handleWaypointContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    if (!isEditable || !data?.onRemoveWaypoint) return
    
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm(`Hapus waypoint #${index + 1}?`)) {
      data.onRemoveWaypoint(index)
    }
  }, [isEditable, data])

  return (
    <>
      {/* Main path - visible line */}
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
      
      {/* Wide invisible path for easier clicking - BEST PRACTICE */}
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
      
      {/* Waypoint markers and labels - using EdgeLabelRenderer for proper positioning */}
      <EdgeLabelRenderer>
        {waypoints.map((waypoint, index) => {
          const isEditing = editingLabel === index
          const isDragging = draggingWaypoint === index
          const isHovered = hoveredWaypoint === index
          const hasLabel = waypoint.label && waypoint.label.trim() !== ''
          
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
              {/* Waypoint marker circle */}
              <div
                className={`
                  relative
                  ${isEditable ? 'cursor-move' : 'cursor-default'}
                  ${isDragging ? 'scale-110' : ''}
                  transition-transform duration-150
                `}
                onMouseDown={(e) => handleWaypointDragStart(e, index)}
                onTouchStart={(e) => handleWaypointDragStart(e, index)}
                onMouseEnter={() => !isDragging && setHoveredWaypoint(index)}
                onMouseLeave={() => !isDragging && setHoveredWaypoint(null)}
                onContextMenu={(e) => handleWaypointContextMenu(e, index)}
              >
                {/* Circle with number */}
                <div
                  className={`
                    w-11 h-11 rounded-full border-2 bg-white
                    flex items-center justify-center
                    transition-all duration-200
                    shadow-md
                    ${isHovered || isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-400'}
                  `}
                  style={{
                    borderColor: isHovered || isDragging ? '#3b82f6' : strokeColor,
                  }}
                >
                  <span className="text-xs font-semibold text-gray-700">
                    #{index + 1}
                  </span>
                </div>
                
                {/* Remove button (X) - only show on hover in edit mode */}
                {isEditable && isHovered && !isDragging && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Hapus waypoint #${index + 1}?`)) {
                        data?.onRemoveWaypoint?.(index)
                      }
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                    title="Hapus waypoint (atau klik kanan)"
                    aria-label="Hapus waypoint"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {/* Label display/edit - below waypoint */}
              <div className="mt-1 min-w-[140px]">
                {isEditing ? (
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        saveLabel(index)
                      } else if (e.key === 'Escape') {
                        setEditingLabel(null)
                        setLabelInput('')
                      }
                    }}
                    onBlur={() => saveLabel(index)}
                    autoFocus
                    placeholder="Nama lokasi/ruangan..."
                    className="w-full px-2 py-1 text-xs border border-blue-500 rounded bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div
                    onClick={() => handleLabelClick(index, waypoint.label)}
                    className={`
                      px-2 py-1 text-xs rounded text-center cursor-pointer transition-all
                      ${hasLabel 
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 font-medium' 
                        : 'bg-gray-50 text-gray-500 border border-gray-300 hover:bg-gray-100'
                      }
                    `}
                    title={hasLabel ? 'Klik untuk edit label' : 'Klik untuk tambah label'}
                  >
                    {hasLabel ? waypoint.label : 'Klik untuk label'}
                  </div>
                )}
              </div>
              
              {/* Helper text - only show on hover for empty labels */}
              {isEditable && isHovered && !hasLabel && !isEditing && (
                <div className="mt-0.5 text-[9px] text-gray-400 text-center">
                  Klik kanan untuk hapus
                </div>
              )}
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
