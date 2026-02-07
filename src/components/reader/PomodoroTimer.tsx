'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  X,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { usePomodoro, type PomodoroPhase } from '@/hooks/usePomodoro'

interface PomodoroTimerProps {
  className?: string
}

const phaseConfig: Record<PomodoroPhase, {
  label: string
  color: string
  bgColor: string
  icon: typeof Brain
}> = {
  idle: {
    label: 'Bereit',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: Timer,
  },
  work: {
    label: 'Arbeiten',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    icon: Brain,
  },
  break: {
    label: 'Pause',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    icon: Coffee,
  },
  longBreak: {
    label: 'Lange Pause',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    icon: Coffee,
  },
}

/**
 * Floating Pomodoro Timer component
 */
export function PomodoroTimer({ className }: PomodoroTimerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Wait for client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    state,
    settings,
    start,
    pause,
    reset,
    skip,
    updateSettings,
    progress,
    formattedTime,
  } = usePomodoro()

  const config = phaseConfig[state.phase]
  const PhaseIcon = config.icon

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev)
    setShowSettings(false)
  }, [])

  const handlePlayPause = useCallback(() => {
    if (state.isRunning) {
      pause()
    } else {
      start()
    }
  }, [state.isRunning, start, pause])

  // Calculate SVG circle properties for progress ring
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Don't render until mounted to avoid hydration mismatch from localStorage
  if (!isMounted) {
    return null
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-40', className)}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
              'rounded-2xl shadow-2xl border overflow-hidden',
              'bg-background/95 backdrop-blur-sm',
              'w-64'
            )}
          >
            {/* Header */}
            <div className={cn('px-4 py-3 flex items-center justify-between', config.bgColor)}>
              <div className="flex items-center gap-2">
                <PhaseIcon className={cn('w-4 h-4', config.color)} />
                <span className={cn('font-medium text-sm', config.color)}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleToggle}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b"
                >
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Arbeitszeit</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateSettings({ workDuration: Math.max(5, settings.workDuration - 5) })}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm">{settings.workDuration}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateSettings({ workDuration: Math.min(60, settings.workDuration + 5) })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pausenzeit</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateSettings({ breakDuration: Math.max(1, settings.breakDuration - 1) })}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm">{settings.breakDuration}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateSettings({ breakDuration: Math.min(30, settings.breakDuration + 1) })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Ton</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      >
                        {settings.soundEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer Display */}
            <div className="p-6 flex flex-col items-center">
              {/* Circular Progress */}
              <div className="relative w-32 h-32">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={cn(
                      'transition-all duration-300',
                      state.phase === 'work' && 'text-red-500',
                      state.phase === 'break' && 'text-green-500',
                      state.phase === 'longBreak' && 'text-blue-500',
                      state.phase === 'idle' && 'text-slate-400'
                    )}
                  />
                </svg>
                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-bold">
                    {formattedTime}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {state.sessionsCompleted} Sessions
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={reset}
                  title="Zurücksetzen"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant={state.isRunning ? 'secondary' : 'default'}
                  size="icon"
                  className={cn(
                    'h-12 w-12 rounded-full',
                    state.phase === 'work' && !state.isRunning && 'bg-red-500 hover:bg-red-600 text-white',
                    state.phase === 'break' && !state.isRunning && 'bg-green-500 hover:bg-green-600 text-white',
                    state.phase === 'longBreak' && !state.isRunning && 'bg-blue-500 hover:bg-blue-600 text-white'
                  )}
                  onClick={handlePlayPause}
                >
                  {state.isRunning ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={skip}
                  title="Überspringen"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleToggle}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg border',
              'flex items-center justify-center',
              'transition-colors',
              config.bgColor,
              'hover:ring-2 hover:ring-primary/50'
            )}
          >
            {state.isRunning ? (
              <div className="relative">
                {/* Mini progress ring */}
                <svg
                  className="w-10 h-10 transform -rotate-90"
                  viewBox="0 0 40 40"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-200 dark:text-slate-600"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={(2 * Math.PI * 16) - (progress / 100) * (2 * Math.PI * 16)}
                    className={cn(
                      state.phase === 'work' && 'text-red-500',
                      state.phase === 'break' && 'text-green-500',
                      state.phase === 'longBreak' && 'text-blue-500'
                    )}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold">
                  {Math.floor(state.timeRemaining / 60)}
                </span>
              </div>
            ) : (
              <Timer className={cn('w-6 h-6', config.color)} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
