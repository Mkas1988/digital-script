'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Annotation } from '@/lib/supabase/types'

interface CreateHighlightData {
  sectionId: string
  textSelection: string
  positionStart: number
  positionEnd: number
  color: string
  content?: string
  forReview?: boolean
}

interface UpdateHighlightData {
  color?: string
  content?: string
  forReview?: boolean
}

interface UseAnnotationsReturn {
  highlights: Annotation[]
  reviewHighlights: Annotation[]
  isLoading: boolean
  error: string | null
  createHighlight: (data: CreateHighlightData) => Promise<Annotation | null>
  updateHighlight: (id: string, data: UpdateHighlightData) => Promise<boolean>
  deleteHighlight: (id: string) => Promise<boolean>
  getHighlightsForSection: (sectionId: string) => Annotation[]
  toggleForReview: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Hook for CRUD operations on annotations/highlights via Supabase
 */
export function useAnnotations(sectionIds: string[]): UseAnnotationsReturn {
  const [highlights, setHighlights] = useState<Annotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Fetch all highlights for the given sections
   */
  const fetchHighlights = useCallback(async () => {
    if (sectionIds.length === 0) {
      setHighlights([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('annotations')
        .select('*')
        .in('section_id', sectionIds)
        .eq('type', 'highlight')
        .order('position_start', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setHighlights(data || [])
    } catch (err) {
      console.error('Failed to fetch highlights:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch highlights')
    } finally {
      setIsLoading(false)
    }
  }, [sectionIds, supabase])

  /**
   * Create a new highlight
   */
  const createHighlight = useCallback(
    async (data: CreateHighlightData): Promise<Annotation | null> => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const newHighlight = {
          user_id: user.id,
          section_id: data.sectionId,
          type: 'highlight' as const,
          text_selection: data.textSelection,
          position_start: data.positionStart,
          position_end: data.positionEnd,
          color: data.color,
          content: data.content || null,
          for_review: data.forReview || false,
        }

        const { data: inserted, error: insertError } = await supabase
          .from('annotations')
          .insert(newHighlight)
          .select()
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Optimistic update
        setHighlights((prev) => [...prev, inserted].sort(
          (a, b) => (a.position_start || 0) - (b.position_start || 0)
        ))

        return inserted
      } catch (err) {
        console.error('Failed to create highlight:', err)
        setError(err instanceof Error ? err.message : 'Failed to create highlight')
        return null
      }
    },
    [supabase]
  )

  /**
   * Update an existing highlight
   */
  const updateHighlight = useCallback(
    async (id: string, data: UpdateHighlightData): Promise<boolean> => {
      try {
        const updateData: Record<string, unknown> = {}
        if (data.color !== undefined) updateData.color = data.color
        if (data.content !== undefined) updateData.content = data.content
        if (data.forReview !== undefined) updateData.for_review = data.forReview

        const { error: updateError } = await supabase
          .from('annotations')
          .update(updateData)
          .eq('id', id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Optimistic update
        setHighlights((prev) =>
          prev.map((h) => (h.id === id ? { ...h, ...updateData } : h))
        )

        return true
      } catch (err) {
        console.error('Failed to update highlight:', err)
        setError(err instanceof Error ? err.message : 'Failed to update highlight')
        return false
      }
    },
    [supabase]
  )

  /**
   * Toggle for_review status of a highlight
   */
  const toggleForReview = useCallback(
    async (id: string): Promise<boolean> => {
      const highlight = highlights.find((h) => h.id === id)
      if (!highlight) return false

      const newValue = !highlight.for_review
      return updateHighlight(id, { forReview: newValue })
    },
    [highlights, updateHighlight]
  )

  /**
   * Delete a highlight
   */
  const deleteHighlight = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('annotations')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        // Optimistic update
        setHighlights((prev) => prev.filter((h) => h.id !== id))

        return true
      } catch (err) {
        console.error('Failed to delete highlight:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete highlight')
        return false
      }
    },
    [supabase]
  )

  /**
   * Get highlights for a specific section
   */
  const getHighlightsForSection = useCallback(
    (sectionId: string): Annotation[] => {
      return highlights.filter((h) => h.section_id === sectionId)
    },
    [highlights]
  )

  /**
   * Get highlights marked for review ("Zur Vertiefung")
   */
  const reviewHighlights = highlights.filter((h) => h.for_review === true)

  // Fetch highlights on mount and when sectionIds change
  useEffect(() => {
    fetchHighlights()
  }, [fetchHighlights])

  return {
    highlights,
    reviewHighlights,
    isLoading,
    error,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    getHighlightsForSection,
    toggleForReview,
    refetch: fetchHighlights,
  }
}
