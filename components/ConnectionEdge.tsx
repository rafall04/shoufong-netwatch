'use client'

import React from 'react'
import { 
  EdgeProps, 
  getBezierPath, 
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  Position
} from 'reactflow'

interface ConnectionEdgeData {
  label?: string
  type?: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep'
  waypoints?: Array<{ x: number; y: number }>
}

export default function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<ConnectionEdgeData>) {
  const edgeType = data?.edgeType || 'default'
  const waypoints = data?.waypoints || []
  
  let edgePath: string
  let labelX: number
  let labelY: number
  
  // Generate path based on edge type
  if (waypoints.length > 0) {
    // Custom path with waypoints
    const points = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY }
    ]
    
    // Create smooth path through waypoints
    edgePath = `M ${sourceX} ${sourceY}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      
      if (i === 0) {
        // First segment from source
        edgePath += ` L ${next.x} ${next.y}`
      } else {
        // Subsequent segments
        edgePath += ` L ${next.x} ${next.y}`
      }
    }
    
    // Calculate label position (middle waypoint or center)
    const midIndex = Math.floor(waypoints.length / 2)
    if (waypoints[midIndex]) {
      labelX = waypoints[midIndex].x
      labelY = waypoints[midIndex].y
    } else {
      labelX = (sourceX + targetX) / 2
      labelY = (sourceY + targetY) / 2
    }
  } else {
    // Standard paths without waypoints
    switch (edgeType) {
      case 'straight':
        [edgePath, labelX, labelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })
        break
      
      case 'step':
        [edgePath, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0, // Sharp corners for step
        })
        break
      
      case 'smoothstep':
        [edgePath, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 8, // Rounded corners
        })
        break
      
      case 'default':
      default:
        [edgePath, labelX, labelY] = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })
        break
    }
  }

  // Determine connection status color
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  
  // Connection is UP only if both devices are UP
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  const strokeColor = isUp ? '#10b981' : isDown ? '#ef4444' : '#6b7280'
  const animated = data?.animated !== false
  
  // Different stroke styles based on connection type
  const strokeDasharray = data?.type === 'WIRELESS' ? '5 5' : 
                          data?.type === 'VIRTUAL' ? '2 4' : 
                          undefined

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
      
      {/* Animated overlay for flow effect - lightweight */}
      {animated && isUp && (
        <path
          d={edgePath}
          strokeWidth={3}
          stroke={strokeColor}
          fill="none"
          strokeDasharray="8 8"
          className="animate-dash"
          opacity={0.5}
        />
      )}
      
      {/* Waypoint markers (visual indicators) */}
      {waypoints.map((point, index) => (
        <circle
          key={`waypoint-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={strokeColor}
          stroke="white"
          strokeWidth={2}
          className="waypoint-marker"
        />
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
            <div className="bg-white px-2 py-0.5 rounded text-[10px] font-medium text-gray-700 border border-gray-200 shadow-sm">
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
        
        .animate-dash {
          animation: dash 1.5s linear infinite;
        }
        
        .waypoint-marker {
          cursor: pointer;
          transition: r 0.2s;
        }
        
        .waypoint-marker:hover {
          r: 6;
        }
      `}</style>
    </>
  )
}
