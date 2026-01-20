'use client'

import React, { memo, useState } from 'react'
import { NodeProps, NodeResizer } from 'reactflow'
import { Trash2 } from 'lucide-react'

type LayoutType = 'LANE' | 'ROOM' | 'DIVIDER' | 'LABEL'

interface LayoutNodeData {
  label: string
  type: LayoutType
  color: string
  width: number
  height: number
  laneType?: string | null
  onLabelChange?: (newLabel: string) => void
  onDelete?: () => void
}

const LayoutNode = ({ data, selected }: NodeProps<LayoutNodeData>) => {
  const { label, type, color, laneType, onLabelChange, onDelete } = data
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label)

  // Display label with lane type if applicable
  const displayLabel = type === 'LANE' && laneType ? `${label} (${laneType})` : label

  // Simple styles - no transitions, no effects
  const getStyles = () => {
    switch (type) {
      case 'LANE':
        return 'w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg'
      case 'ROOM':
        return 'w-full h-full flex items-center justify-center border-4 border-solid rounded-2xl'
      case 'DIVIDER':
        return 'w-full h-full flex items-center justify-center border-t-4 border-solid'
      case 'LABEL':
        return 'w-full h-full flex items-center justify-center font-bold text-xl'
      default:
        return 'w-full h-full flex items-center justify-center'
    }
  }

  const getOpacity = () => {
    switch (type) {
      case 'LANE':
        return 0.1
      case 'ROOM':
        return 0.15
      case 'DIVIDER':
        return 1
      case 'LABEL':
        return 1
      default:
        return 0.2
    }
  }

  const handleDoubleClick = () => {
    if (onLabelChange) {
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (onLabelChange && editLabel !== label) {
      onLabelChange(editLabel)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditLabel(label)
      setIsEditing(false)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm(`Delete this ${type.toLowerCase()}?`)) {
      onDelete()
    }
  }

  return (
    <>
      <NodeResizer
        color={selected ? '#3b82f6' : 'transparent'}
        isVisible={selected}
        minWidth={type === 'DIVIDER' ? 200 : 150}
        minHeight={type === 'DIVIDER' ? 4 : 100}
      />
      
      {/* Delete Button - Show when selected */}
      {selected && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-8 h-8 md:w-6 md:h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg z-50 transition-colors"
          title="Delete"
          aria-label="Delete layout element"
        >
          <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
        </button>
      )}
      
      <div
        className={getStyles()}
        style={{
          backgroundColor: type === 'LABEL' ? 'transparent' : color,
          borderColor: color,
          opacity: getOpacity(),
        }}
        onDoubleClick={handleDoubleClick}
      >
        {label && !isEditing && (
          <span
            className={`font-semibold px-2 py-1 rounded ${
              type === 'ROOM' ? 'text-base' : 'text-sm'
            }`}
            style={{
              color: type === 'LABEL' ? color : '#1f2937',
              backgroundColor: type === 'LABEL' ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
            }}
          >
            {displayLabel}
          </span>
        )}
        {isEditing && (
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 text-sm border rounded"
            autoFocus
            style={{ minWidth: '100px' }}
          />
        )}
      </div>
    </>
  )
}

export default memo(LayoutNode)
