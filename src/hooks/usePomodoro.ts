'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PomodoroSettings {
  workDuration: number // minutes
  breakDuration: number // minutes
  longBreakDuration: number // minutes
  sessionsBeforeLongBreak: number
  soundEnabled: boolean
  autoStartBreaks: boolean
  autoStartWork: boolean
}

export type PomodoroPhase = 'work' | 'break' | 'longBreak' | 'idle'

export interface PomodoroState {
  phase: PomodoroPhase
  timeRemaining: number // seconds
  isRunning: boolean
  sessionsCompleted: number
  totalWorkTime: number // seconds accumulated
}

interface UsePomodoroReturn {
  state: PomodoroState
  settings: PomodoroSettings
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void
  progress: number // 0-100
  formattedTime: string // "mm:ss"
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: false,
  autoStartWork: false,
}

const STORAGE_KEY = 'pomodoro-settings'
const STATE_STORAGE_KEY = 'pomodoro-state'

/**
 * Hook for Pomodoro timer functionality
 */
export function usePomodoro(): UsePomodoroReturn {
  // Load settings from localStorage
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Initialize state
  const [state, setState] = useState<PomodoroState>(() => {
    if (typeof window === 'undefined') {
      return {
        phase: 'idle',
        timeRemaining: settings.workDuration * 60,
        isRunning: false,
        sessionsCompleted: 0,
        totalWorkTime: 0,
      }
    }
    try {
      const stored = localStorage.getItem(STATE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Don't restore running state on page reload
        return { ...parsed, isRunning: false }
      }
    } catch {
      // ignore
    }
    return {
      phase: 'idle',
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
      sessionsCompleted: 0,
      totalWorkTime: 0,
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/timer-complete.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  // Play completion sound
  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }, [settings.soundEnabled])

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings])

  // Save state to localStorage (excluding isRunning)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
        ...state,
        isRunning: false,
      }))
    }
  }, [state])

  // Timer interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            // Timer completed
            playSound()

            if (prev.phase === 'work') {
              const newSessions = prev.sessionsCompleted + 1
              const needsLongBreak = newSessions % settings.sessionsBeforeLongBreak === 0
              const nextPhase = needsLongBreak ? 'longBreak' : 'break'
              const nextDuration = needsLongBreak
                ? settings.longBreakDuration
                : settings.breakDuration

              return {
                ...prev,
                phase: nextPhase,
                timeRemaining: nextDuration * 60,
                isRunning: settings.autoStartBreaks,
                sessionsCompleted: newSessions,
                totalWorkTime: prev.totalWorkTime + settings.workDuration * 60,
              }
            } else {
              // Break completed, start work
              return {
                ...prev,
                phase: 'work',
                timeRemaining: settings.workDuration * 60,
                isRunning: settings.autoStartWork,
              }
            }
          }

          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          }
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isRunning, settings, playSound])

  // Start timer
  const start = useCallback(() => {
    setState(prev => {
      // If idle, start a work session
      if (prev.phase === 'idle') {
        return {
          ...prev,
          phase: 'work',
          timeRemaining: settings.workDuration * 60,
          isRunning: true,
        }
      }
      return { ...prev, isRunning: true }
    })
  }, [settings.workDuration])

  // Pause timer
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }))
  }, [])

  // Reset timer
  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
      sessionsCompleted: 0,
      totalWorkTime: 0,
    })
  }, [settings.workDuration])

  // Skip current phase
  const skip = useCallback(() => {
    setState(prev => {
      if (prev.phase === 'work') {
        const newSessions = prev.sessionsCompleted + 1
        const needsLongBreak = newSessions % settings.sessionsBeforeLongBreak === 0
        return {
          ...prev,
          phase: needsLongBreak ? 'longBreak' : 'break',
          timeRemaining: (needsLongBreak ? settings.longBreakDuration : settings.breakDuration) * 60,
          isRunning: false,
          sessionsCompleted: newSessions,
        }
      } else {
        return {
          ...prev,
          phase: 'work',
          timeRemaining: settings.workDuration * 60,
          isRunning: false,
        }
      }
    })
  }, [settings])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Calculate progress (0-100)
  const progress = (() => {
    const totalDuration = (() => {
      switch (state.phase) {
        case 'work':
          return settings.workDuration * 60
        case 'break':
          return settings.breakDuration * 60
        case 'longBreak':
          return settings.longBreakDuration * 60
        default:
          return settings.workDuration * 60
      }
    })()
    return Math.round(((totalDuration - state.timeRemaining) / totalDuration) * 100)
  })()

  // Format time as "mm:ss"
  const formattedTime = (() => {
    const minutes = Math.floor(state.timeRemaining / 60)
    const seconds = state.timeRemaining % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })()

  return {
    state,
    settings,
    start,
    pause,
    reset,
    skip,
    updateSettings,
    progress,
    formattedTime,
  }
}
