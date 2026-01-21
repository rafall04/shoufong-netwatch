# Network Map Components - Modern Design System

## Overview

Komponen Network Map yang telah di-refactor dengan desain modern, elegant, dan high-performance. Menggunakan glassmorphism, smooth Bezier curves, dan animated particles untuk visualisasi network topology yang stunning.

## Key Features

### 1. **Smooth Bezier Curves**
- Menggantikan straight lines dengan smooth cubic Bezier curves
- Automatic control point calculation untuk kurva yang natural
- Support untuk multiple waypoints dengan smooth transitions

### 2. **Glassmorphism Design**
- Device nodes menggunakan glassmorphism effect (backdrop-blur)
- Semi-transparent backgrounds dengan gradient overlays
- Modern card-based design dengan shadow dan glow effects

### 3. **Breathing Animation**
- Device yang UP menampilkan breathing animation (pulsing glow)
- Smooth opacity dan scale transitions
- Hardware-accelerated untuk performa optimal

### 4. **Gradient Connections**
- Connection edges menggunakan SVG linear gradients
- Warna gradient berdasarkan status source dan target device
- Smooth color transitions saat status berubah

### 5. **Animated Particles**
- Moving particles sepanjang connection path untuk visualisasi data flow
- Hanya aktif saat connection UP
- Multiple particles dengan delay untuk efek yang lebih dynamic

### 6. **Enhanced Tooltips**
- Glassmorphism tooltips dengan backdrop blur
- Menampilkan device metrics (IP, status, uptime)
- Smooth fade-in animation
- Arrow indicator untuk better UX

## Components

### ConnectionEdge.tsx
**Purpose:** Render connection lines antara devices dengan Bezier curves dan animations

**Key Features:**
- Smooth Bezier curve paths
- Gradient stroke berdasarkan device status
- Animated particles untuk data flow visualization
- Glow effect untuk active connections
- Editable waypoints dengan glassmorphism style

**Props:**
```typescript
interface ConnectionEdgeData {
  label?: string
  type?: 'LAN' | 'WIRELESS' | 'FIBER_OPTIC'
  animated?: boolean
  sourceStatus?: string
  targetStatus?: string
  waypoints?: Waypoint[]
  isEditable?: boolean
}
```

### DeviceNode.tsx
**Purpose:** Render device icons dengan glassmorphism cards dan status indicators

**Key Features:**
- Glassmorphism card design
- Breathing animation untuk UP status
- Shake animation untuk DOWN status
- Status indicator dot dengan pulse animation
- Enhanced tooltip dengan metrics
- Hover scale effect

**Props:**
```typescript
interface DeviceNodeData {
  name: string
  laneName: string
  status: string
  type: DeviceType
  ip?: string
  lastSeen?: string
  statusSince?: string
}
```

## Utilities

### lib/bezier-utils.ts
**Purpose:** Helper functions untuk Bezier curve calculations

**Functions:**
- `calculateBezierPath()` - Calculate smooth curve between two points
- `calculateMultiPointBezierPath()` - Calculate curve through multiple waypoints
- `distanceToSegment()` - Calculate distance from point to line segment
- `findOptimalWaypointIndex()` - Find best position to insert waypoint
- `calculateStatusGradient()` - Get gradient colors based on device status

## Animations

### Tailwind Config (tailwind.config.ts)
Custom animations yang ditambahkan:
- `breathing` - Pulsing glow effect (3s infinite)
- `pulse-slow` - Slow pulse for status indicators (3s infinite)
- `shake` - Shake effect for offline devices (0.5s)
- `fade-in` - Smooth fade in for tooltips (0.2s)
- `dash` - Dashed line animation for connections (1s infinite)

### Global CSS (app/globals.css)
- Hardware-accelerated animations dengan `will-change`
- Glassmorphism support dengan `backdrop-filter`
- Browser compatibility untuk Safari dan Chrome

## Performance Optimizations

### 1. **Hardware Acceleration**
- Menggunakan `transform` dan `opacity` untuk animations
- `will-change` property untuk smooth rendering
- Avoid layout thrashing

### 2. **Memoization**
- `useMemo` untuk expensive calculations (Bezier paths, gradients)
- `React.memo` untuk device nodes
- Prevent unnecessary re-renders

### 3. **Lightweight Animations**
- Pure CSS animations (no JavaScript)
- SVG animations untuk particles
- No heavy effects (no backdrop-blur on moving elements)

### 4. **Optimized Rendering**
- Conditional rendering untuk animations
- Only animate visible elements
- Debounced updates untuk waypoint dragging

## Usage Example

```tsx
import DeviceNode from '@/components/DeviceNode'
import ConnectionEdge from '@/components/ConnectionEdge'
import { calculateMultiPointBezierPath } from '@/lib/bezier-utils'

// In ReactFlow
const nodeTypes = {
  deviceNode: DeviceNode,
}

const edgeTypes = {
  connection: ConnectionEdge,
}

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
/>
```

## Browser Compatibility

- ✅ Chrome 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support with -webkit- prefix)
- ✅ Edge 90+ (full support)

**Note:** Glassmorphism requires `backdrop-filter` support. Fallback to solid backgrounds on older browsers.

## Accessibility

- ✅ All interactive elements have `aria-label` and `title`
- ✅ Keyboard navigation support
- ✅ High contrast mode compatible
- ✅ Screen reader friendly
- ✅ Touch-friendly targets (40x40px minimum)

## Future Enhancements

### Planned Features:
1. **Dark Mode Support** - Adaptive colors untuk dark theme
2. **Force-Directed Layout** - Auto-arrange nodes dengan physics simulation
3. **Snap to Grid** - Grid snapping untuk precise positioning
4. **Connection Labels** - Editable labels pada connections
5. **Zoom Levels** - Different detail levels based on zoom
6. **Mini Map** - Overview map dengan device clusters

### Performance Improvements:
1. **Virtualization** - Only render visible nodes
2. **LOD (Level of Detail)** - Simplify rendering at low zoom
3. **Web Workers** - Offload calculations to background thread
4. **Canvas Rendering** - Hybrid SVG + Canvas untuk better performance

## Troubleshooting

### Issue: Animations not smooth
**Solution:** Ensure hardware acceleration is enabled. Check `will-change` properties in CSS.

### Issue: Glassmorphism not working
**Solution:** Check browser support for `backdrop-filter`. Add `-webkit-` prefix for Safari.

### Issue: Particles not moving
**Solution:** Verify SVG `animateMotion` is supported. Check connection status is 'up'.

### Issue: Bezier curves look jagged
**Solution:** Increase curvature parameter (default 0.25). Check waypoint positions.

## Credits

**Design System:** Modern Clean Tech with Glassmorphism
**Animations:** Hardware-accelerated CSS + SVG
**Performance:** React.memo + useMemo + useCallback
**Accessibility:** WCAG 2.1 Level AA compliant

---

**Version:** 2.0  
**Last Updated:** January 21, 2026  
**Status:** Production Ready ✅
