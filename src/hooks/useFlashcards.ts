'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Flashcard } from '@/lib/supabase/types'

interface CreateFlashcardData {
  documentId: string
  sectionId?: string
  question: string
  answer: string
  sourceText?: string
}

interface UseFlashcardsReturn {
  flashcards: Flashcard[]
  isLoading: boolean
  error: string | null
  createFlashcard: (data: CreateFlashcardData) => Promise<Flashcard | null>
  deleteFlashcard: (id: string) => Promise<boolean>
  updateReview: (id: string, correct: boolean) => Promise<boolean>
  getFlashcardsForReview: () => Flashcard[]
  refetch: () => Promise<void>
}

/**
 * Hook for CRUD operations on flashcards via Supabase
 * Includes spaced repetition logic for review scheduling
 */
export function useFlashcards(documentId: string): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Fetch all flashcards for the document
   */
  const fetchFlashcards = useCallback(async () => {
    if (!documentId) {
      setFlashcards([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setFlashcards(data || [])
    } catch (err) {
      console.error('Failed to fetch flashcards:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch flashcards')
    } finally {
      setIsLoading(false)
    }
  }, [documentId, supabase])

  /**
   * Create a new flashcard
   */
  const createFlashcard = useCallback(
    async (data: CreateFlashcardData): Promise<Flashcard | null> => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const newFlashcard = {
          user_id: user.id,
          document_id: data.documentId,
          section_id: data.sectionId || null,
          question: data.question,
          answer: data.answer,
          difficulty: 3, // Initial difficulty (1-5)
          next_review: new Date().toISOString(), // Review immediately available
          review_count: 0,
        }

        const { data: inserted, error: insertError } = await supabase
          .from('flashcards')
          .insert(newFlashcard)
          .select()
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Optimistic update
        setFlashcards((prev) => [inserted, ...prev])

        return inserted
      } catch (err) {
        console.error('Failed to create flashcard:', err)
        setError(err instanceof Error ? err.message : 'Failed to create flashcard')
        return null
      }
    },
    [supabase]
  )

  /**
   * Delete a flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('flashcards')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        // Optimistic update
        setFlashcards((prev) => prev.filter((f) => f.id !== id))

        return true
      } catch (err) {
        console.error('Failed to delete flashcard:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete flashcard')
        return false
      }
    },
    [supabase]
  )

  /**
   * Update review status using simple spaced repetition
   * Correct: increase interval, decrease difficulty
   * Incorrect: reset interval, increase difficulty
   */
  const updateReview = useCallback(
    async (id: string, correct: boolean): Promise<boolean> => {
      try {
        const flashcard = flashcards.find((f) => f.id === id)
        if (!flashcard) return false

        // Simple spaced repetition algorithm
        let newDifficulty = flashcard.difficulty
        let nextReviewDays = 1

        if (correct) {
          // Decrease difficulty (easier), increase interval
          newDifficulty = Math.max(1, flashcard.difficulty - 1)
          const baseInterval = Math.pow(2, flashcard.review_count + 1)
          nextReviewDays = Math.min(30, baseInterval) // Cap at 30 days
        } else {
          // Increase difficulty (harder), short interval
          newDifficulty = Math.min(5, flashcard.difficulty + 1)
          nextReviewDays = 1
        }

        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + nextReviewDays)

        const updateData = {
          difficulty: newDifficulty,
          next_review: nextReview.toISOString(),
          review_count: flashcard.review_count + 1,
        }

        const { error: updateError } = await supabase
          .from('flashcards')
          .update(updateData)
          .eq('id', id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Optimistic update
        setFlashcards((prev) =>
          prev.map((f) => (f.id === id ? { ...f, ...updateData } : f))
        )

        return true
      } catch (err) {
        console.error('Failed to update flashcard review:', err)
        setError(err instanceof Error ? err.message : 'Failed to update review')
        return false
      }
    },
    [flashcards, supabase]
  )

  /**
   * Get flashcards that are due for review
   */
  const getFlashcardsForReview = useCallback((): Flashcard[] => {
    const now = new Date()
    return flashcards.filter((f) => {
      if (!f.next_review) return true
      return new Date(f.next_review) <= now
    })
  }, [flashcards])

  // Fetch flashcards on mount and when documentId changes
  useEffect(() => {
    fetchFlashcards()
  }, [fetchFlashcards])

  return {
    flashcards,
    isLoading,
    error,
    createFlashcard,
    deleteFlashcard,
    updateReview,
    getFlashcardsForReview,
    refetch: fetchFlashcards,
  }
}
