/**
 * Polyline Drawing Logic - Code Snippets
 * 
 * This file contains the core logic for multi-segment cable routing
 * that prevents premature connection termination.
 */

import { useCallback, useState } from 'react'

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface DrawingState {
  isDrawingMode: boolean
  sourceNodeId: string | null
  waypoints: Array<{ x: number; y: number }>
  mousePosition: { x: number; y: number } | null
}

/**
 * Initialize drawing state
 */
export function useDrawingState() {
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null)
  const [waypoints, setWaypoints] = useState<Array<{ x: number; y: number }>>([])
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
  return {
    isDrawingMode,
    setIsDrawingMode,
    sourceNodeId,
    setSourceNodeId,
    waypoints,
    setWaypoints,
    mousePosition,
    setMousePosition
  }
}

// ============================================================================
// CRITICAL: handleCanvasClick - MUST NOT TERMINATE CONNECTION
// ============================================================================

/**
 * Handle canvas click - Add waypoint WITHOUT terminating connection
 * 
 * CRITICAL LOGIC:
 * - When user clicks empty canvas, ADD waypoint to array
 * - DO NOT call cancelDrawing() or finalizeConnection()
 * - Drawing state MUST remain TRUE
 * - Connection only finalizes when clicking a target node
 * 
 * @param event - Mouse event from ReactFlow onPaneClick
 * @param reactFlowInstance - ReactFlow instance for coordinate conversion
 * @param isDrawingMode - Current drawing mode state
 * @param waypoints - Current waypoints array
 * @param setWaypoints - State setter for waypoints
 */
export function handleCanvasClick(
  event: React.MouseEvent | MouseEvent,
  reactFlowInstance: any,
  isDrawingMode: boolean,
  waypoints: Array<{ x: number; y: number }>,
  setWaypoints: (waypoints: Array<{ x: number; y: number }>) => void
) {
  // Guard: Only process if in drawing mode
  if (!isDrawingMode || !reactFlowInstance) return
  
  // Convert screen coordinates to flow coordinates
  const position = reactFlowInstance.screenToFlowPosition({
    x: (event as MouseEvent).clientX,
    y: (event as MouseEvent).clientY
  })
  
  // CRITICAL: Add waypoint to array
  // This MUST NOT terminate the connection
  // Drawing state remains TRUE
  console.log('✅ Waypoint added:', position, 'Total:', waypoints.length + 1)
  
  setWaypoints([...waypoints, position])
  
  // IMPORTANT: Do NOT call these functions here:
  // ❌ cancelDrawing() - Would reset state
  // ❌ finalizeConnection() - Would close connection
  // 
  // Connection only finalizes when user clicks a target node
}

// ============================================================================
// SVG PATH CALCULATION - Multi-Segment Line
// ============================================================================

/**
 * Calculate SVG path 'd' attribute for multi-segment polyline
 * 
 * Path structure:
 * M (Move to source) -> L (Line to waypoint 1) -> L (Line to waypoint 2) -> ... -> L (Line to mouse)
 * 
 * @param sourcePos - Source node position {x, y}
 * @param waypoints - Array of waypoint positions
 * @param mousePos - Current mouse position
 * @returns SVG path 'd' attribute string
 */
export function calculatePolylinePath(
  sourcePos: { x: number; y: number },
  waypoints: Array<{ x: number; y: number }>,
  mousePos: { x: number; y: number }
): string {
  // Start at source node
  let pathData = `M ${sourcePos.x} ${sourcePos.y}`
  
  // Add line segments to each waypoint
  waypoints.forEach(waypoint => {
    pathData += ` L ${waypoint.x} ${waypoint.y}`
  })
  
  // Add final line segment to mouse cursor
  pathData += ` L ${mousePos.x} ${mousePos.y}`
  
  return pathData
}

// ============================================================================
// EXAMPLE USAGE IN REACT COMPONENT
// ============================================================================

/**
 * Example implementation in a React component
 */
export function ExampleDrawingComponent() {
  const {
    isDrawingMode,
    setIsDrawingMode,
    sourceNodeId,
    setSourceNodeId,
    waypoints,
    setWaypoints,
    mousePosition,
    setMousePosition
  } = useDrawingState()
  
  // Start drawing when clicking source node
  const startDrawing = useCallback((nodeId: string) => {
    console.log('🎨 Drawing started - Source:', nodeId)
    setIsDrawingMode(true)
    setSourceNodeId(nodeId)
    setWaypoints([])
    setMousePosition(null)
  }, [])
  
  // Handle canvas click - Add waypoint
  const onCanvasClick = useCallback((event: MouseEvent, reactFlowInstance: any) => {
    handleCanvasClick(event, reactFlowInstance, isDrawingMode, waypoints, setWaypoints)
  }, [isDrawingMode, waypoints])
  
  // Finalize connection when clicking target node
  const finalizeConnection = useCallback((targetNodeId: string) => {
    if (!sourceNodeId) return
    
    console.log('✅ Connection finalized:', {
      source: sourceNodeId,
      target: targetNodeId,
      waypoints: waypoints.length
    })
    
    // Save connection to database
    // ... API call here
    
    // Reset state
    setIsDrawingMode(false)
    setSourceNodeId(null)
    setWaypoints([])
    setMousePosition(null)
  }, [sourceNodeId, waypoints])
  
  // Cancel drawing (ESC or Right-Click)
  const cancelDrawing = useCallback(() => {
    console.log('❌ Drawing cancelled')
    setIsDrawingMode(false)
    setSourceNodeId(null)
    setWaypoints([])
    setMousePosition(null)
  }, [])
  
  return null // Component implementation
}

// ============================================================================
// SVG RENDERING - Real-Time Preview
// ============================================================================

/**
 * SVG component for rendering the drawing preview
 */
export function DrawingPreviewSVG({
  sourcePos,
  waypoints,
  mousePos
}: {
  sourcePos: { x: number; y: number }
  waypoints: Array<{ x: number; y: number }>
  mousePos: { x: number; y: number }
}) {
  const pathData = calculatePolylinePath(sourcePos, waypoints, mousePos)
  
  return (
    <svg className="absolute inset-0 pointer-events-none z-50">
      <defs>
        <linearGradient id="drawing-gradient">
          <stop offset="0%" stopColor="#39FF14" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
      </defs>
      
      {/* Main preview line - Animated dashed */}
      <path
        d={pathData}
        stroke="url(#drawing-gradient)"
        strokeWidth={4}
        fill="none"
        strokeDasharray="8 4"
        opacity={0.8}
        className="animate-dash"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(57, 255, 20, 0.6))'
        }}
      />
      
      {/* Glow layer for visibility */}
      <path
        d={pathData}
        stroke="#39FF14"
        strokeWidth={8}
        fill="none"
        opacity={0.2}
        style={{ filter: 'blur(4px)' }}
      />
      
      {/* Waypoint markers with numbers */}
      {waypoints.map((waypoint, index) => (
        <g key={index}>
          <circle
            cx={waypoint.x}
            cy={waypoint.y}
            r={8}
            fill="#39FF14"
            stroke="white"
            strokeWidth={2}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(57, 255, 20, 0.8))'
            }}
          />
          <text
            x={waypoint.x}
            y={waypoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {index + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ============================================================================
// KEY POINTS TO REMEMBER
// ============================================================================

/**
 * CRITICAL RULES:
 * 
 * 1. ✅ Canvas click ADDS waypoint - NEVER terminates
 * 2. ✅ Drawing state stays TRUE until target node clicked
 * 3. ✅ Use ReactFlow's onPaneClick for reliable canvas detection
 * 4. ✅ Convert coordinates: screenToFlowPosition for storage, flowToScreenPosition for display
 * 5. ✅ SVG path uses straight lines (L command) for polyline
 * 6. ✅ Animated dashed line for visual feedback
 * 7. ✅ Numbered waypoint markers for clarity
 * 8. ✅ ESC or Right-Click cancels without saving
 * 9. ✅ Only clicking target node finalizes connection
 * 10. ✅ Console logs for debugging
 */
