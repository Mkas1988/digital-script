'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Tablet,
  Smartphone,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTabletMode } from '@/contexts/TabletModeContext'

type DeviceMode = 'auto' | 'desktop' | 'tablet'

interface DeviceModeSelectorProps {
  className?: string
}

export function DeviceModeSelector({ className }: DeviceModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isTabletMode,
    setTabletMode,
    deviceInfo,
    autoEnableTabletMode,
    setAutoEnableTabletMode,
  } = useTabletMode()

  // Determine current mode
  const getCurrentMode = (): DeviceMode => {
    if (autoEnableTabletMode) return 'auto'
    return isTabletMode ? 'tablet' : 'desktop'
  }

  const currentMode = getCurrentMode()

  // Get display info for current mode
  const getModeInfo = (mode: DeviceMode) => {
    switch (mode) {
      case 'auto':
        return {
          icon: Sparkles,
          label: 'Auto',
          description: `Erkannt: ${deviceInfo.screenSize === 'tablet' ? 'Tablet' : deviceInfo.screenSize === 'mobile' ? 'Mobil' : 'Desktop'}`,
        }
      case 'desktop':
        return {
          icon: Monitor,
          label: 'Desktop',
          description: 'Optimiert für Maus & Tastatur',
        }
      case 'tablet':
        return {
          icon: Tablet,
          label: 'Tablet',
          description: 'Optimiert für Touch',
        }
    }
  }

  const currentInfo = getModeInfo(currentMode)
  const CurrentIcon = currentInfo.icon

  const handleModeChange = (mode: DeviceMode) => {
    if (mode === 'auto') {
      setAutoEnableTabletMode(true)
      // Auto-detect and apply
      if (deviceInfo.isTablet || deviceInfo.screenSize === 'tablet' || deviceInfo.screenSize === 'mobile') {
        setTabletMode(true)
      } else {
        setTabletMode(false)
      }
    } else {
      setAutoEnableTabletMode(false)
      setTabletMode(mode === 'tablet')
    }
    setIsOpen(false)
  }

  const modes: DeviceMode[] = ['auto', 'desktop', 'tablet']

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'gap-2 px-3',
          isOpen && 'bg-muted'
        )}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden md:inline">{currentInfo.label}</span>
        <ChevronDown className={cn(
          'w-3 h-3 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-64 p-2',
                'bg-white dark:bg-gray-900',
                'rounded-xl shadow-xl',
                'border border-gray-200/50 dark:border-gray-700/50'
              )}
            >
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Anzeigemodus
                </p>
              </div>

              {modes.map((mode) => {
                const info = getModeInfo(mode)
                const Icon = info.icon
                const isActive = currentMode === mode

                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-left transition-colors',
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      isActive
                        ? 'bg-brand-500/20'
                        : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'w-5 h-5',
                        isActive ? 'text-brand-500' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        isActive && 'text-brand-600 dark:text-brand-400'
                      )}>
                        {info.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {info.description}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}

              {/* Device info */}
              <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    {deviceInfo.isTouchDevice ? (
                      <>
                        <Tablet className="w-3 h-3" />
                        Touch-Gerät erkannt
                      </>
                    ) : (
                      <>
                        <Monitor className="w-3 h-3" />
                        Desktop-Gerät erkannt
                      </>
                    )}
                  </p>
                  <p className="mt-1 opacity-75">
                    {deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}px
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Compact mode indicator for narrow toolbars
 */
export function DeviceModeIndicator({ className }: { className?: string }) {
  const { isTabletMode, deviceInfo, autoEnableTabletMode } = useTabletMode()

  const Icon = autoEnableTabletMode
    ? Sparkles
    : isTabletMode
      ? Tablet
      : Monitor

  const label = autoEnableTabletMode
    ? 'Auto'
    : isTabletMode
      ? 'Tablet'
      : 'Desktop'

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md',
      'text-xs text-muted-foreground',
      'bg-muted/50',
      className
    )}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}
