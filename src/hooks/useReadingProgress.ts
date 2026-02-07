'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SectionProgress {
  sectionId: string
  progress: number // 0-100
  completed: boolean
  completedAt: string | null
  lastReadAt: string
}

/** Position in the document for "continue reading" feature */
export interface ReadingPosition {
  sectionId: string
  sectionTitle: string
  scrollPosition: number
  timestamp: string
  chapterNumber?: string
}

interface UseReadingProgressOptions {
  documentId: string
  sectionIds: string[]
}

interface UseReadingProgressReturn {
  /** Progress for each section (0-100) */
  progress: Record<string, number>
  /** Whether each section is marked as completed */
  completed: Record<string, boolean>
  /** Mark a section as completed */
  markCompleted: (sectionId: string, completed?: boolean) => Promise<void>
  /** Update progress for a section */
  updateProgress: (sectionId: string, progress: number) => void
  /** Get overall document progress (0-100) */
  overallProgress: number
  /** Number of completed sections */
  completedCount: number
  /** Loading state */
  isLoading: boolean
  /** Last reading position */
  lastPosition: ReadingPosition | null
  /** Save current reading position */
  savePosition: (position: Omit<ReadingPosition, 'timestamp'>) => void
  /** Clear saved position */
  clearPosition: () => void
}

const STORAGE_KEY_PREFIX = 'reading-progress-'
const POSITION_KEY_PREFIX = 'reading-position-'

/**
 * Hook for tracking reading progress across sections
 * Persists to localStorage with optional Supabase sync
 */
export function useReadingProgress({
  documentId,
  sectionIds,
}: UseReadingProgressOptions): UseReadingProgressReturn {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [lastPosition, setLastPosition] = useState<ReadingPosition | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Debounce timer ref for position saving
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()
  const storageKey = `${STORAGE_KEY_PREFIX}${documentId}`
  const positionKey = `${POSITION_KEY_PREFIX}${documentId}`

  // Load progress and position from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Load progress
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored) as {
          progress: Record<string, number>
          completed: Record<string, boolean>
        }
        setProgress(data.progress || {})
        setCompleted(data.completed || {})
      }

      // Load last position
      const storedPosition = localStorage.getItem(positionKey)
      if (storedPosition) {
        const position = JSON.parse(storedPosition) as ReadingPosition
        setLastPosition(position)
      }
    } catch (err) {
      console.warn('Failed to load reading progress:', err)
    }

    setIsLoading(false)
  }, [storageKey, positionKey])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ progress, completed })
      )
    } catch (err) {
      console.warn('Failed to save reading progress:', err)
    }
  }, [progress, completed, storageKey, isLoading])

  // Optional: Sync to Supabase for logged-in users
  const syncToSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Could implement a reading_progress table in Supabase
      // For now, we just use localStorage
    } catch (err) {
      console.warn('Failed to sync reading progress:', err)
    }
  }, [supabase])

  /**
   * Update progress for a section
   */
  const updateProgress = useCallback(
    (sectionId: string, newProgress: number) => {
      const clampedProgress = Math.min(100, Math.max(0, newProgress))

      setProgress((prev) => ({
        ...prev,
        [sectionId]: clampedProgress,
      }))

      // Auto-mark as completed if 100%
      if (clampedProgress >= 100) {
        setCompleted((prev) => ({
          ...prev,
          [sectionId]: true,
        }))
      }
    },
    []
  )

  /**
   * Manually mark a section as completed or incomplete
   */
  const markCompleted = useCallback(
    async (sectionId: string, isCompleted: boolean = true) => {
      setCompleted((prev) => ({
        ...prev,
        [sectionId]: isCompleted,
      }))

      // Set progress to 100% when marking complete, or 0% when marking incomplete
      setProgress((prev) => ({
        ...prev,
        [sectionId]: isCompleted ? 100 : 0,
      }))

      // Sync to Supabase
      await syncToSupabase()
    },
    [syncToSupabase]
  )

  /**
   * Save current reading position (debounced)
   */
  const savePosition = useCallback(
    (position: Omit<ReadingPosition, 'timestamp'>) => {
      // Clear existing timeout
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current)
      }

      // Debounce: save after 2 seconds of no activity
      savePositionTimeoutRef.current = setTimeout(() => {
        const fullPosition: ReadingPosition = {
          ...position,
          timestamp: new Date().toISOString(),
        }

        try {
          localStorage.setItem(positionKey, JSON.stringify(fullPosition))
          setLastPosition(fullPosition)
        } catch (err) {
          console.warn('Failed to save reading position:', err)
        }
      }, 2000)
    },
    [positionKey]
  )

  /**
   * Clear saved reading position
   */
  const clearPosition = useCallback(() => {
    try {
      localStorage.removeItem(positionKey)
      setLastPosition(null)
    } catch (err) {
      console.warn('Failed to clear reading position:', err)
    }
  }, [positionKey])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current)
      }
    }
  }, [])

  // Calculate overall progress
  const overallProgress =
    sectionIds.length > 0
      ? Math.round(
          sectionIds.reduce((sum, id) => sum + (progress[id] || 0), 0) /
            sectionIds.length
        )
      : 0

  // Count completed sections
  const completedCount = sectionIds.filter((id) => completed[id]).length

  return {
    progress,
    completed,
    markCompleted,
    updateProgress,
    overallProgress,
    completedCount,
    isLoading,
    lastPosition,
    savePosition,
    clearPosition,
  }
}
