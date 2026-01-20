'use client'

import React, { useEffect, useState } from 'react'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import useSWR from 'swr'

interface StatusHistoryEntry {
  id: string
  status: string
  timestamp: string
}

interface StatusHistoryTimelineProps {
  deviceId: string
  deviceName: string
  hours?: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Status History Timeline Component
 * Shows device UP/DOWN history for last N hours with visual timeline
 */
export default function StatusHistoryTimeline({ 
  deviceId, 
  deviceName,
  hours = 24 
}: StatusHistoryTimelineProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [uptimePercentage, setUptimePercentage] = useState(0)
  const [upCount, setUpCount] = useState(0)
  const [downCount, setDownCount] = useState(0)
  const [totalChanges, setTotalChanges] = useState(0)

  // Set mounted flag on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data, error, isLoading } = useSWR(
    `/api/devices/${deviceId}/history?hours=${hours}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true
    }
  )

  // Calculate statistics in useEffect to avoid hydration errors
  useEffect(() => {
    if (!isMounted || !data?.success || !data.history) return

    const history: StatusHistoryEntry[] = data.history || []

    // Calculate statistics
    const up = history.filter(h => h.status === 'up').length
    const down = history.filter(h => h.status === 'down').length
    const total = history.length

    setUpCount(up)
    setDownCount(down)
    setTotalChanges(total)

    // Calculate uptime percentage
    let uptime = 0
    if (history.length >= 2) {
      const firstTime = new Date(history[0].timestamp).getTime()
      const lastTime = new Date(history[history.length - 1].timestamp).getTime()
      const now = Date.now()
      
      // Use current time if last event is recent (within the time window)
      const totalDuration = Math.max(lastTime - firstTime, now - firstTime)

      let upDuration = 0
      for (let i = 0; i < history.length - 1; i++) {
        if (history[i].status === 'up') {
          const start = new Date(history[i].timestamp).getTime()
          const end = new Date(history[i + 1].timestamp).getTime()
          upDuration += end - start
        }
      }
      
      // Add duration from last status change to now
      const lastEntry = history[history.length - 1]
      if (lastEntry.status === 'up') {
        const lastStart = new Date(lastEntry.timestamp).getTime()
        upDuration += now - lastStart
      }

      uptime = totalDuration > 0 ? (upDuration / totalDuration) * 100 : 0
    } else if (history.length === 1) {
      // If only one entry, calculate from that time to now
      const entryTime = new Date(history[0].timestamp).getTime()
      const now = Date.now()
      const duration = now - entryTime
      
      if (history[0].status === 'up' && duration > 0) {
        uptime = 100
      } else if (history[0].status === 'down' && duration > 0) {
        uptime = 0
      }
    }

    setUptimePercentage(uptime)
  }, [data, isMounted])

  if (isLoading) {
    return (
      <div className="p-3 text-center text-xs text-gray-500">
        Loading history...
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="p-3 text-center text-xs text-red-500">
        Failed to load history
      </div>
    )
  }

  const history: StatusHistoryEntry[] = data.history || []

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  return (
    <div className="border-t pt-3 mt-3" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">
            Last {hours}h History
          </span>
        </div>
        {isMounted && uptimePercentage > 0 && (
          <span className={`text-xs font-medium ${
            uptimePercentage >= 99 ? 'text-green-600' :
            uptimePercentage >= 95 ? 'text-yellow-600' :
            'text-red-600'
          }`} suppressHydrationWarning>
            {uptimePercentage.toFixed(1)}% uptime
          </span>
        )}
      </div>

      {/* Timeline visualization */}
      {history.length > 0 ? (
        <>
          <div className="relative h-8 bg-gray-100 rounded overflow-hidden mb-2" suppressHydrationWarning>
            {history.map((entry, index) => {
              if (index === history.length - 1) return null // Skip last entry

              const startTime = new Date(entry.timestamp).getTime()
              const endTime = new Date(history[index + 1].timestamp).getTime()
              const firstTime = new Date(history[0].timestamp).getTime()
              const lastTime = new Date(history[history.length - 1].timestamp).getTime()
              const totalDuration = lastTime - firstTime

              const leftPercent = ((startTime - firstTime) / totalDuration) * 100
              const widthPercent = ((endTime - startTime) / totalDuration) * 100

              return (
                <div
                  key={entry.id}
                  className={`absolute top-0 h-full ${
                    entry.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  title={`${entry.status.toUpperCase()} - ${new Date(entry.timestamp).toLocaleString('id-ID')}`}
                  suppressHydrationWarning
                />
              )
            })}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 text-[10px]" suppressHydrationWarning>
            <div className="text-center p-1.5 bg-gray-50 rounded">
              <div className="text-gray-500">Changes</div>
              <div className="font-semibold text-gray-900">{totalChanges}</div>
            </div>
            <div className="text-center p-1.5 bg-green-50 rounded">
              <div className="text-green-600 flex items-center justify-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                UP
              </div>
              <div className="font-semibold text-green-700">{upCount}</div>
            </div>
            <div className="text-center p-1.5 bg-red-50 rounded">
              <div className="text-red-600 flex items-center justify-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />
                DOWN
              </div>
              <div className="font-semibold text-red-700">{downCount}</div>
            </div>
          </div>

          {/* Recent events */}
          {history.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] font-medium text-gray-500">Recent Events</div>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {history.slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className={`font-medium ${
                      entry.status === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.status === 'up' ? '↑ UP' : '↓ DOWN'}
                    </span>
                    <span className="text-gray-500" suppressHydrationWarning>
                      {new Date(entry.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4 text-xs text-gray-500">
          No history data available
        </div>
      )}
    </div>
  )
}
