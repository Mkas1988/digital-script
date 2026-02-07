'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DocumentStats {
  total: number
  inProgress: number
  completed: number
}

interface AnnotationStats {
  highlights: number
  notes: number
  bookmarks: number
}

interface FlashcardStats {
  total: number
  mastered: number
  dueToday: number
}

interface ProgressStats {
  totalSections: number
  completedSections: number
  progressPercent: number
}

export interface DashboardStats {
  documents: DocumentStats
  annotations: AnnotationStats
  flashcards: FlashcardStats
  progress: ProgressStats
  isLoading: boolean
  error: string | null
}

interface UseDashboardStatsReturn extends DashboardStats {
  refetch: () => Promise<void>
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats>({
    documents: { total: 0, inProgress: 0, completed: 0 },
    annotations: { highlights: 0, notes: 0, bookmarks: 0 },
    flashcards: { total: 0, mastered: 0, dueToday: 0 },
    progress: { totalSections: 0, completedSections: 0, progressPercent: 0 },
    isLoading: true,
    error: null,
  })

  const supabase = createClient()

  // Helper to get progress from localStorage for a document
  const getLocalStorageProgress = (documentId: string): Record<string, boolean> => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(`reading-progress-${documentId}`)
      if (stored) {
        const data = JSON.parse(stored)
        return data.completed || {}
      }
    } catch {
      // ignore
    }
    return {}
  }

  const fetchStats = useCallback(async () => {
    setStats(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id')

      if (docError) throw docError

      // Fetch sections
      const { data: sections, error: secError } = await supabase
        .from('sections')
        .select('id, document_id')

      if (secError) throw secError

      // Fetch annotations
      const { data: annotations, error: annoError } = await supabase
        .from('annotations')
        .select('type')

      if (annoError) throw annoError

      // Fetch flashcards
      const { data: flashcards, error: fcError } = await supabase
        .from('flashcards')
        .select('difficulty, next_review')

      if (fcError) throw fcError

      // Get progress from localStorage for each document
      const allCompletedSections = new Set<string>()
      const documentProgress = new Map<string, Set<string>>()

      documents?.forEach(doc => {
        const localProgress = getLocalStorageProgress(doc.id)
        const completedInDoc = new Set<string>()

        Object.entries(localProgress).forEach(([sectionId, isCompleted]) => {
          if (isCompleted) {
            allCompletedSections.add(sectionId)
            completedInDoc.add(sectionId)
          }
        })

        documentProgress.set(doc.id, completedInDoc)
      })

      // Count documents by completion status
      let completedDocs = 0
      let inProgressDocs = 0

      documents?.forEach(doc => {
        const docSections = sections?.filter(s => s.document_id === doc.id) || []
        const completedSectionsInDoc = documentProgress.get(doc.id)?.size || 0

        if (completedSectionsInDoc === docSections.length && docSections.length > 0) {
          completedDocs++
        } else if (completedSectionsInDoc > 0) {
          inProgressDocs++
        }
      })

      // Calculate annotation stats
      const highlights = annotations?.filter(a => a.type === 'highlight').length || 0
      const notesCount = annotations?.filter(a => a.type === 'note').length || 0
      const bookmarks = annotations?.filter(a => a.type === 'bookmark').length || 0

      // Calculate flashcard stats
      const mastered = flashcards?.filter(f => f.difficulty >= 4).length || 0
      const dueToday = flashcards?.filter(f => {
        if (!f.next_review) return true
        return new Date(f.next_review) <= new Date()
      }).length || 0

      // Calculate progress stats
      const totalSections = sections?.length || 0
      const completedSections = allCompletedSections.size
      const progressPercent = totalSections > 0
        ? Math.round((completedSections / totalSections) * 100)
        : 0

      setStats({
        documents: {
          total: documents?.length || 0,
          inProgress: inProgressDocs,
          completed: completedDocs,
        },
        annotations: {
          highlights,
          notes: notesCount,
          bookmarks,
        },
        flashcards: {
          total: flashcards?.length || 0,
          mastered,
          dueToday,
        },
        progress: {
          totalSections,
          completedSections,
          progressPercent,
        },
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch stats',
      }))
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    ...stats,
    refetch: fetchStats,
  }
}
