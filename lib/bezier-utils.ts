/**
 * Bezier Curve Utilities for Network Map
 * Provides smooth curve calculations for connection edges
 */

export interface Point {
  x: number
  y: number
}

/**
 * Calculate smooth Bezier curve path between two points
 * Uses cubic Bezier with automatic control point calculation
 */
export function calculateBezierPath(
  start: Point,
  end: Point,
  curvature: number = 0.3
): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Control point offset based on distance and curvature
  const offset = distance * curvature
  
  // Calculate angle between points
  const angle = Math.atan2(dy, dx)
  
  // Control points for smooth S-curve
  const cp1x = start.x + Math.cos(angle) * offset
  const cp1y = start.y + Math.sin(angle) * offset
  const cp2x = end.x - Math.cos(angle) * offset
  const cp2y = end.y - Math.sin(angle) * offset
  
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`
}

/**
 * Calculate Bezier path through multiple waypoints
 * Creates smooth curves between each segment
 */
export function calculateMultiPointBezierPath(
  start: Point,
  waypoints: Point[],
  end: Point,
  curvature: number = 0.3
): string {
  if (waypoints.length === 0) {
    return calculateBezierPath(start, end, curvature)
  }
  
  let path = ''
  
  // First segment: start to first waypoint
  path += calculateBezierPath(start, waypoints[0], curvature)
  
  // Middle segments: waypoint to waypoint
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = calculateBezierPath(waypoints[i], waypoints[i + 1], curvature)
    // Remove 'M' from subsequent segments
    path += ' ' + segment.substring(2)
  }
  
  // Last segment: last waypoint to end
  const lastSegment = calculateBezierPath(
    waypoints[waypoints.length - 1],
    end,
    curvature
  )
  path += ' ' + lastSegment.substring(2)
  
  return path
}

/**
 * Calculate distance from point to line segment
 * Used for determining where to insert waypoints
 */
export function distanceToSegment(
  point: Point,
  segmentStart: Point,
  segmentEnd: Point
): number {
  const { x: px, y: py } = point
  const { x: x1, y: y1 } = segmentStart
  const { x: x2, y: y2 } = segmentEnd
  
  const dx = x2 - x1
  const dy = y2 - y1
  
  if (dx === 0 && dy === 0) {
    // Segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  }
  
  // Calculate projection of point onto line
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  
  // Find closest point on segment
  const closestX = x1 + t * dx
  const closestY = y1 + t * dy
  
  // Return distance
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
}

/**
 * Find optimal insertion index for new waypoint
 * Inserts waypoint at the closest segment to the click point
 */
export function findOptimalWaypointIndex(
  clickPoint: Point,
  start: Point,
  waypoints: Point[],
  end: Point
): number {
  // Build array of all points in path
  const allPoints = [start, ...waypoints, end]
  
  let minDistance = Infinity
  let insertIndex = waypoints.length // Default: insert at end
  
  // Check each segment
  for (let i = 0; i < allPoints.length - 1; i++) {
    const distance = distanceToSegment(clickPoint, allPoints[i], allPoints[i + 1])
    
    if (distance < minDistance) {
      minDistance = distance
      insertIndex = i // Insert after point i (which is waypoint index i-1 if i > 0)
    }
  }
  
  return insertIndex
}

/**
 * Calculate gradient color based on two status colors
 * Returns CSS gradient string with HIGH CONTRAST neon colors
 */
export function calculateStatusGradient(
  sourceStatus: string,
  targetStatus: string
): { sourceColor: string; targetColor: string } {
  const getColor = (status: string) => {
    switch (status) {
      case 'up':
        return '#39FF14' // Neon Green - High contrast for visibility
      case 'down':
        return '#FF073A' // Neon Red - High contrast
      default:
        return '#9ca3af' // gray-400
    }
  }
  
  return {
    sourceColor: getColor(sourceStatus),
    targetColor: getColor(targetStatus),
  }
}
