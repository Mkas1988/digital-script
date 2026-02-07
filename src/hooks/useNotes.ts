'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Annotation } from '@/lib/supabase/types'

export interface Note extends Annotation {
  type: 'note'
}

interface CreateNoteData {
  sectionId: string
  content: string
  textSelection?: string
  positionStart?: number
  positionEnd?: number
}

interface UpdateNoteData {
  content?: string
  textSelection?: string
}

interface UseNotesReturn {
  notes: Note[]
  isLoading: boolean
  error: string | null
  createNote: (data: CreateNoteData) => Promise<Note | null>
  updateNote: (id: string, data: UpdateNoteData) => Promise<boolean>
  deleteNote: (id: string) => Promise<boolean>
  getNotesForSection: (sectionId: string) => Note[]
  refetch: () => Promise<void>
}

/**
 * Hook for CRUD operations on notes via Supabase
 * Notes are stored in the annotations table with type='note'
 */
export function useNotes(sectionIds: string[]): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Fetch all notes for the given sections
   */
  const fetchNotes = useCallback(async () => {
    if (sectionIds.length === 0) {
      setNotes([])
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
        .eq('type', 'note')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setNotes((data || []) as Note[])
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [sectionIds, supabase])

  /**
   * Create a new note
   */
  const createNote = useCallback(
    async (data: CreateNoteData): Promise<Note | null> => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const newNote = {
          user_id: user.id,
          section_id: data.sectionId,
          type: 'note' as const,
          content: data.content,
          text_selection: data.textSelection || null,
          position_start: data.positionStart || null,
          position_end: data.positionEnd || null,
          color: null, // Notes don't have colors
        }

        const { data: inserted, error: insertError } = await supabase
          .from('annotations')
          .insert(newNote)
          .select()
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Optimistic update
        setNotes((prev) => [inserted as Note, ...prev])

        return inserted as Note
      } catch (err) {
        console.error('Failed to create note:', err)
        setError(err instanceof Error ? err.message : 'Failed to create note')
        return null
      }
    },
    [supabase]
  )

  /**
   * Update an existing note
   */
  const updateNote = useCallback(
    async (id: string, data: UpdateNoteData): Promise<boolean> => {
      try {
        const updateData: Record<string, unknown> = {}
        if (data.content !== undefined) updateData.content = data.content
        if (data.textSelection !== undefined)
          updateData.text_selection = data.textSelection

        const { error: updateError } = await supabase
          .from('annotations')
          .update(updateData)
          .eq('id', id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Optimistic update
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, ...updateData } : n))
        )

        return true
      } catch (err) {
        console.error('Failed to update note:', err)
        setError(err instanceof Error ? err.message : 'Failed to update note')
        return false
      }
    },
    [supabase]
  )

  /**
   * Delete a note
   */
  const deleteNote = useCallback(
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
        setNotes((prev) => prev.filter((n) => n.id !== id))

        return true
      } catch (err) {
        console.error('Failed to delete note:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete note')
        return false
      }
    },
    [supabase]
  )

  /**
   * Get notes for a specific section
   */
  const getNotesForSection = useCallback(
    (sectionId: string): Note[] => {
      return notes.filter((n) => n.section_id === sectionId)
    },
    [notes]
  )

  // Fetch notes on mount and when sectionIds change
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNotesForSection,
    refetch: fetchNotes,
  }
}
