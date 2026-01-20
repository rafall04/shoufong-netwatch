'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import ReactFlow, {
  Node,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MiniMap,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import DeviceNode from '@/components/DeviceNode'
import LayoutNode from '@/components/LayoutNode'
import { Plus, Square, Box, Minus, Type, X, Clock, RefreshCw, Info, Router, Tablet, ScanBarcode, Tv, Copy, Eye, Maximize2, Minimize2, Monitor, Laptop, Printer, Video, Server, Smartphone, Network, Wifi, HelpCircle } from 'lucide-react'
import StatusHistoryTimeline from '@/components/StatusHistoryTimeline'

interface Device {
  id: string
  name: string
  ip: string
  type: 'ROUTER' | 'SWITCH' | 'ACCESS_POINT' | 'PC' | 'LAPTOP' | 'TABLET' | 'PRINTER' | 'SCANNER_GTEX' | 'SMART_TV' | 'CCTV' | 'SERVER' | 'PHONE' | 'OTHER'
  laneName: string
  status: string
  positionX: number
  positionY: number
  lastSeen: string | null
  statusSince: string | null
  roomId: string | null
  room?: {
    id: string
    name: string
    color: string
  } | null
}

interface LayoutElement {
  id: string
  type: 'LANE' | 'ROOM' | 'DIVIDER' | 'LABEL'
  label: string
  laneType?: string | null
  positionX: number
  positionY: number
  width: number
  height: number
  color: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const nodeTypes: NodeTypes = {
  deviceNode: DeviceNode,
  layoutNode: LayoutNode,
}

export default function MapContent() {
  // Simple loading state - NO SSR
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Initializing...</div>
      </div>
    )
  }
  
  return <MapContentInner />
}

function MapContentInner() {
  const { data: session } = useSession()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, , onEdgesChange] = useEdgesState([])
  const [showLayoutTools, setShowLayoutTools] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devicePopupPosition, setDevicePopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    device: Device
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0)
  
  const { data, error, mutate } = useSWR<{ devices: Device[] }>('/api/devices', fetcher, {
    refreshInterval: 20000, // Auto refresh every 20 seconds
    revalidateOnFocus: true,
    onSuccess: () => {
      setLastUpdate(new Date())
      setIsRefreshing(false)
    },
  })
  
  const { data: layoutData, mutate: mutateLayout } = useSWR<{ elements: LayoutElement[] }>('/api/layout', fetcher)
  
  // Initialize lastUpdate on mount
  useEffect(() => {
    setLastUpdate(new Date())
  }, [])
  
  // Update time since last update every second
  useEffect(() => {
    if (!lastUpdate) return
    
    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
      setTimeSinceUpdate(diff)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [lastUpdate])
  
  // Manual refresh - trigger MikroTik sync
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Trigger MikroTik sync in REFRESH mode (no body needed)
      const response = await fetch('/api/mikrotik/sync-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'refresh' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh data immediately
        mutate()
        setLastUpdate(new Date())
        setIsRefreshing(false)
      } else {
        setIsRefreshing(false)
        alert(`Sync failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      setIsRefreshing(false)
      alert('Error syncing with MikroTik')
    }
  }, [mutate])
  
  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return
    
    const newState = !isFullscreen
    setIsFullscreen(newState)
    
    if (newState) {
      document.documentElement.requestFullscreen?.()
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.()
      }
    }
  }, [isFullscreen])
  
  // Listen for fullscreen changes
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])
  
  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator === 'undefined') return
    navigator.clipboard?.writeText(text).then(() => {
      alert(`${label} copied!`)
    })
  }
  
  // Add layout element
  const addLayoutElement = useCallback(
    async (type: 'LANE' | 'ROOM' | 'DIVIDER' | 'LABEL', laneType?: 'IN' | 'OUT' | 'BOTH') => {
      if (session?.user?.role === 'VIEWER') return
      
      try {
        const colors = {
          LANE: '#3b82f6',
          ROOM: '#f59e0b',
          DIVIDER: '#6b7280',
          LABEL: '#1f2937',
        }
        
        const sizes = {
          LANE: { width: 250, height: 180 },
          ROOM: { width: 350, height: 250 },
          DIVIDER: { width: 400, height: 4 },
          LABEL: { width: 150, height: 40 },
        }
        
        const labels = {
          LANE: laneType ? `Lane ${laneType}` : 'Lane',
          ROOM: 'Room',
          DIVIDER: '',
          LABEL: 'Label',
        }
        
        const response = await fetch('/api/layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            label: labels[type],
            laneType: type === 'LANE' ? laneType : null,
            positionX: 100,
            positionY: 100,
            width: sizes[type].width,
            height: sizes[type].height,
            color: colors[type],
          }),
        })
        
        if (response.ok) {
          mutateLayout()
        }
      } catch (error) {
        console.error('Error adding layout:', error)
      }
    },
    [session, mutateLayout]
  )
  
  // Delete layout element
  const deleteSelectedNode = useCallback(
    async (nodeId: string) => {
      if (session?.user?.role === 'VIEWER' || !nodeId.startsWith('layout-')) return
      
      try {
        const layoutId = nodeId.replace('layout-', '')
        const response = await fetch(`/api/layout?id=${layoutId}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          mutateLayout()
        }
      } catch (error) {
        console.error('Error deleting layout:', error)
      }
    },
    [session, mutateLayout]
  )
  
  // Handle label change
  const handleLabelChange = useCallback(
    async (layoutId: string, newLabel: string) => {
      if (session?.user?.role === 'VIEWER') return
      
      try {
        const response = await fetch('/api/layout/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: layoutId, label: newLabel }),
        })
        
        if (response.ok) {
          mutateLayout()
        }
      } catch (error) {
        console.error('Error updating label:', error)
      }
    },
    [session, mutateLayout]
  )
  
  // Handle node drag stop
  const onNodeDragStop = useCallback(
    async (_event: any, node: Node) => {
      if (session?.user?.role === 'VIEWER') return
      
      try {
        if (node.id.startsWith('layout-')) {
          const layoutId = node.id.replace('layout-', '')
          await fetch('/api/layout/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: layoutId,
              positionX: node.position.x,
              positionY: node.position.y,
              width: node.style?.width || 200,
              height: node.style?.height || 100,
            }),
          })
        } else {
          await fetch('/api/device/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: node.id,
              positionX: node.position.x,
              positionY: node.position.y,
            }),
          })
        }
      } catch (error) {
        console.error('Error updating position:', error)
      }
    },
    [session]
  )
  
  // Transform data to nodes
  useEffect(() => {
    const flowNodes: Node[] = []
    
    if (layoutData?.elements) {
      layoutData.elements.forEach((element) => {
        flowNodes.push({
          id: `layout-${element.id}`,
          type: 'layoutNode',
          position: { x: element.positionX, y: element.positionY },
          data: {
            label: element.label,
            type: element.type,
            color: element.color,
            width: element.width,
            height: element.height,
            laneType: element.laneType,
            onLabelChange: (newLabel: string) => handleLabelChange(element.id, newLabel),
            onDelete: () => deleteSelectedNode(`layout-${element.id}`),
          },
          style: {
            width: element.width,
            height: element.height,
            zIndex: -1,
          },
          draggable: session?.user?.role !== 'VIEWER',
          selectable: session?.user?.role !== 'VIEWER',
        })
      })
    }
    
    if (data?.devices) {
      data.devices.forEach((device) => {
        flowNodes.push({
          id: device.id,
          type: 'deviceNode',
          position: { x: device.positionX, y: device.positionY },
          data: {
            name: device.name,
            laneName: device.laneName,
            status: device.status,
            type: device.type,
            ip: device.ip,
            lastSeen: device.lastSeen,
            statusSince: device.statusSince,
            onClick: (e?: React.MouseEvent) => {
              setSelectedDevice(device)
              if (e) {
                setDevicePopupPosition({ x: e.clientX, y: e.clientY })
              }
            },
            onContextMenu: (e: React.MouseEvent) => {
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                device: device
              })
            },
          },
          draggable: session?.user?.role !== 'VIEWER',
          selectable: session?.user?.role !== 'VIEWER',
        })
      })
    }
    
    setNodes(flowNodes)
  }, [data, layoutData, setNodes, session, handleLabelChange, deleteSelectedNode])
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Failed to load devices</div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading devices...</div>
      </div>
    )
  }
  
  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        nodesDraggable={session?.user?.role !== 'VIEWER'}
        nodesConnectable={false}
        elementsSelectable={session?.user?.role !== 'VIEWER'}
        deleteKeyCode={session?.user?.role !== 'VIEWER' ? 'Delete' : null}
        onNodesDelete={(nodes) => {
          if (session?.user?.role !== 'VIEWER') {
            nodes.forEach((node) => {
              if (node.id.startsWith('layout-')) {
                deleteSelectedNode(node.id)
              }
            })
          }
        }}
      >
        <Controls position="top-left" />
        
        {/* Fullscreen Button - 8px gap from Controls */}
        <Panel position="top-left" className="bg-white rounded shadow-sm" style={{ marginTop: '128px' }}>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors rounded"
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen (F11)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-700" />
            )}
          </button>
        </Panel>
        
        <MiniMap position="bottom-right" />
        <Background variant={BackgroundVariant.Dots} />
        
        {/* Status Panel with Refresh */}
        <Panel position="top-right" className="bg-white rounded shadow-sm">
          <div className="p-2 space-y-1.5">
            {/* Status counters */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-700">{data?.devices?.filter(d => d.status === 'up').length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-medium text-gray-700">{data?.devices?.filter(d => d.status === 'down').length || 0}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-medium">{data?.devices?.length || 0}</span>
            </div>
            
            {/* Last update & refresh button */}
            <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 border-t pt-1.5">
              <div className="flex items-center gap-1">
                {isRefreshing ? (
                  <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span suppressHydrationWarning>{timeSinceUpdate}s ago</span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                title="Refresh from MikroTik"
                aria-label="Refresh from MikroTik"
              >
                <RefreshCw className={`w-3 h-3 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </Panel>
        
        {/* Layout Tools */}
        {session?.user?.role !== 'VIEWER' && (
          <Panel position="top-center" className="bg-white rounded">
            <div className="flex flex-col gap-1 p-1.5">
              <button
                onClick={() => setShowLayoutTools(!showLayoutTools)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                Layout Tools
              </button>
              
              {showLayoutTools && (
                <div className="flex flex-col gap-1 p-1 border-t border-gray-200">
                  <div className="text-[10px] font-medium text-gray-500 px-1">Lanes</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addLayoutElement('LANE', 'IN')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      <Square className="w-3.5 h-3.5" />
                      IN
                    </button>
                    <button
                      onClick={() => addLayoutElement('LANE', 'OUT')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      <Square className="w-3.5 h-3.5" />
                      OUT
                    </button>
                    <button
                      onClick={() => addLayoutElement('LANE', 'BOTH')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      <Square className="w-3.5 h-3.5" />
                      BOTH
                    </button>
                  </div>
                  
                  <div className="text-[10px] font-medium text-gray-500 px-1 pt-1">Others</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addLayoutElement('ROOM')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded"
                    >
                      <Box className="w-3.5 h-3.5" />
                      Room
                    </button>
                    <button
                      onClick={() => addLayoutElement('DIVIDER')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-gray-700 bg-gray-50 hover:bg-gray-100 rounded"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      Divider
                    </button>
                    <button
                      onClick={() => addLayoutElement('LABEL')}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-gray-700 bg-gray-50 hover:bg-gray-100 rounded"
                    >
                      <Type className="w-3.5 h-3.5" />
                      Label
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}
        
        {/* Legend Toggle */}
        <Panel position="bottom-left" className="bg-white rounded shadow-sm">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 hover:bg-gray-50 rounded"
            title="Legend"
          >
            <Info className="w-4 h-4 text-gray-600" />
          </button>
        </Panel>
        
        {/* Legend Content */}
        {showLegend && (
          <Panel position="bottom-left" className="bg-white rounded shadow-lg mb-12">
            <div className="p-2 w-56">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700">Legend</div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-2 text-[10px]">
                <div>
                  <div className="font-medium text-gray-600 mb-1">Device Types</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center gap-1">
                      <Router className="w-2.5 h-2.5 text-gray-600" />
                      <span>Router</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Network className="w-2.5 h-2.5 text-gray-600" />
                      <span>Switch</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2.5 h-2.5 text-gray-600" />
                      <span>Access Point</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor className="w-2.5 h-2.5 text-gray-600" />
                      <span>PC</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Laptop className="w-2.5 h-2.5 text-gray-600" />
                      <span>Laptop</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tablet className="w-2.5 h-2.5 text-gray-600" />
                      <span>Tablet</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Printer className="w-2.5 h-2.5 text-gray-600" />
                      <span>Printer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ScanBarcode className="w-2.5 h-2.5 text-gray-600" />
                      <span>Scanner</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tv className="w-2.5 h-2.5 text-gray-600" />
                      <span>Smart TV</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="w-2.5 h-2.5 text-gray-600" />
                      <span>CCTV</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Server className="w-2.5 h-2.5 text-gray-600" />
                      <span>Server</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5 text-gray-600" />
                      <span>Phone</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-2.5 h-2.5 text-gray-600" />
                      <span>Other</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-1 border-t">
                  <div className="font-medium text-gray-600 mb-1">Status</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>UP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <span>DOWN</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                      <span>Unknown</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded shadow-lg border z-50 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              copyToClipboard(contextMenu.device.ip, 'IP Address')
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy IP
          </button>
          <button
            onClick={() => {
              copyToClipboard(contextMenu.device.name, 'Device Name')
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Name
          </button>
          <div className="border-t my-1"></div>
          <button
            onClick={() => {
              setSelectedDevice(contextMenu.device)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </button>
        </div>
      )}
      
      {/* Device Popup */}
      {selectedDevice && devicePopupPosition && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 w-80"
          style={{
            left: devicePopupPosition.x + 10,
            top: devicePopupPosition.y + 10,
          }}
        >
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm">{selectedDevice.name}</h3>
            <button
              onClick={() => {
                setSelectedDevice(null)
                setDevicePopupPosition(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">IP Address</span>
              <span className="font-mono text-gray-900">{selectedDevice.ip}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-900">{selectedDevice.type}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Lane</span>
              <span className="text-gray-900">{selectedDevice.laneName}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${
                selectedDevice.status === 'up' ? 'text-green-600' :
                selectedDevice.status === 'down' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {selectedDevice.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Since</span>
              <span className="text-gray-900 text-[10px]" suppressHydrationWarning>
                {selectedDevice.statusSince 
                  ? new Date(selectedDevice.statusSince).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Last Seen</span>
              <span className="text-gray-900 text-[10px]" suppressHydrationWarning>
                {selectedDevice.lastSeen 
                  ? new Date(selectedDevice.lastSeen).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'}
              </span>
            </div>
            
            <StatusHistoryTimeline 
              deviceId={selectedDevice.id}
              deviceName={selectedDevice.name}
              hours={24}
            />
          </div>
        </div>
      )}
    </div>
  )
}
