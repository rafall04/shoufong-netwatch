'use client'

import React from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'

interface ConnectionEdgeData {
  label?: string
  type?: 'CABLE' | 'WIRELESS' | 'VIRTUAL'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Determine connection status color
  const sourceStatus = data?.sourceStatus || 'unknown'
  const targetStatus = data?.targetStatus || 'unknown'
  
  // Connection is UP only if both devices are UP
  const isUp = sourceStatus === 'up' && targetStatus === 'up'
  const isDown = sourceStatus === 'down' || targetStatus === 'down'
  
  const strokeColor = isUp ? '#10b981' : isDown ? '#ef4444' : '#6b7280'
  const animated = data?.animated !== false

  return (
    <>
      {/* Main path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={strokeColor}
        fill="none"
        markerEnd={markerEnd}
      />
      
      {/* Animated overlay for flow effect - lightweight */}
      {animated && isUp && (
        <path
          d={edgePath}
          strokeWidth={2}
          stroke={strokeColor}
          fill="none"
          strokeDasharray="5 5"
          className="animate-dash"
          opacity={0.6}
        />
      )}
      
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
            stroke-dashoffset: -10;
          }
        }
        
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </>
  )
}
