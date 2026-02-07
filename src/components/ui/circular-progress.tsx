'use client'

import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showValue?: boolean
  className?: string
  strokeWidth?: number
  trackColor?: string
  progressColor?: string
}

const sizes = {
  xs: { diameter: 24, stroke: 3, fontSize: 'text-[8px]' },
  sm: { diameter: 36, stroke: 3, fontSize: 'text-[10px]' },
  md: { diameter: 48, stroke: 4, fontSize: 'text-xs' },
  lg: { diameter: 64, stroke: 5, fontSize: 'text-sm' },
  xl: { diameter: 96, stroke: 6, fontSize: 'text-base' },
}

export function CircularProgress({
  value,
  size = 'md',
  showValue = true,
  className,
  strokeWidth,
  trackColor,
  progressColor,
}: CircularProgressProps) {
  const { diameter, stroke, fontSize } = sizes[size]
  const actualStroke = strokeWidth || stroke
  const radius = (diameter - actualStroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={diameter}
        height={diameter}
        className="-rotate-90 transform"
      >
        {/* Track */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={trackColor || 'currentColor'}
          strokeWidth={actualStroke}
          className={cn(!trackColor && 'text-muted/30')}
        />
        {/* Progress */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={progressColor || 'currentColor'}
          strokeWidth={actualStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500 ease-out',
            !progressColor && 'text-brand-500'
          )}
        />
      </svg>
      {showValue && (
        <span className={cn(
          'absolute font-medium text-foreground',
          fontSize
        )}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

interface LinearProgressProps {
  value: number
  className?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export function LinearProgress({
  value,
  className,
  showValue = false,
  size = 'md',
  animated = false,
}: LinearProgressProps) {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'w-full bg-muted/30 rounded-full overflow-hidden',
        heights[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r from-brand-400 to-brand-600',
            animated && 'animate-pulse-soft'
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  )
}
