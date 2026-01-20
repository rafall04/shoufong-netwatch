"use client"

import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  description?: string
  duration?: number
  onClose: () => void
}

export default function Toast({ 
  type, 
  message, 
  description, 
  duration = 5000, 
  onClose 
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      titleColor: 'text-green-900'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      titleColor: 'text-red-900'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900'
    }
  }

  const { icon: Icon, bgColor, borderColor, iconColor, textColor, titleColor } = config[type]

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 max-w-md min-w-[320px]`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${titleColor}`}>{message}</p>
            {description && (
              <p className={`text-sm ${textColor} mt-1`}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`${textColor} hover:${titleColor} transition-colors flex-shrink-0`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    description?: string
    duration?: number
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          description={toast.description}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}
