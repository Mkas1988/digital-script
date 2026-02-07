'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Annotation } from '@/lib/supabase/types'

export interface Bookmark extends Annotation {
  type: 'bookmark'
}

interface CreateBookmarkData {
  sectionId: string
  label?: string
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[]
  isLoading: boolean
  error: string | null
  createBookmark: (data: CreateBookmarkData) => Promise<Bookmark | null>
  deleteBookmark: (id: string) => Promise<boolean>
  updateBookmark: (id: string, label: string) => Promise<boolean>
  getBookmarkForSection: (sectionId: string) => Bookmark | null
  hasBookmark: (sectionId: string) => boolean
  toggleBookmark: (sectionId: string, label?: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook for CRUD operations on bookmarks via Supabase
 * Uses the annotations table with type='bookmark'
 */
export function useBookmarks(sectionIds: string[]): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  /**
   * Fetch all bookmarks for the given sections
   */
  const fetchBookmarks = useCallback(async () => {
    if (sectionIds.length === 0) {
      setBookmarks([])
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
        .eq('type', 'bookmark')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setBookmarks((data || []) as Bookmark[])
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks')
    } finally {
      setIsLoading(false)
    }
  }, [sectionIds, supabase])

  /**
   * Create a new bookmark
   */
  const createBookmark = useCallback(
    async (data: CreateBookmarkData): Promise<Bookmark | null> => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        // Check if bookmark already exists for this section
        const existing = bookmarks.find(b => b.section_id === data.sectionId)
        if (existing) {
          return existing
        }

        const newBookmark = {
          user_id: user.id,
          section_id: data.sectionId,
          type: 'bookmark' as const,
          content: data.label || null,
          text_selection: null,
          position_start: null,
          position_end: null,
          color: null,
          for_review: false,
        }

        const { data: inserted, error: insertError } = await supabase
          .from('annotations')
          .insert(newBookmark)
          .select()
          .single()

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Optimistic update
        setBookmarks((prev) => [inserted as Bookmark, ...prev])

        return inserted as Bookmark
      } catch (err) {
        console.error('Failed to create bookmark:', err)
        setError(err instanceof Error ? err.message : 'Failed to create bookmark')
        return null
      }
    },
    [supabase, bookmarks]
  )

  /**
   * Update a bookmark label
   */
  const updateBookmark = useCallback(
    async (id: string, label: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('annotations')
          .update({ content: label })
          .eq('id', id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Optimistic update
        setBookmarks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, content: label } : b))
        )

        return true
      } catch (err) {
        console.error('Failed to update bookmark:', err)
        setError(err instanceof Error ? err.message : 'Failed to update bookmark')
        return false
      }
    },
    [supabase]
  )

  /**
   * Delete a bookmark
   */
  const deleteBookmark = useCallback(
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
        setBookmarks((prev) => prev.filter((b) => b.id !== id))

        return true
      } catch (err) {
        console.error('Failed to delete bookmark:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete bookmark')
        return false
      }
    },
    [supabase]
  )

  /**
   * Get bookmark for a specific section
   */
  const getBookmarkForSection = useCallback(
    (sectionId: string): Bookmark | null => {
      return bookmarks.find((b) => b.section_id === sectionId) || null
    },
    [bookmarks]
  )

  /**
   * Check if a section has a bookmark
   */
  const hasBookmark = useCallback(
    (sectionId: string): boolean => {
      return bookmarks.some((b) => b.section_id === sectionId)
    },
    [bookmarks]
  )

  /**
   * Toggle bookmark for a section (create if doesn't exist, delete if exists)
   */
  const toggleBookmark = useCallback(
    async (sectionId: string, label?: string): Promise<void> => {
      const existing = getBookmarkForSection(sectionId)
      if (existing) {
        await deleteBookmark(existing.id)
      } else {
        await createBookmark({ sectionId, label })
      }
    },
    [getBookmarkForSection, deleteBookmark, createBookmark]
  )

  // Fetch bookmarks on mount and when sectionIds change
  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  return {
    bookmarks,
    isLoading,
    error,
    createBookmark,
    deleteBookmark,
    updateBookmark,
    getBookmarkForSection,
    hasBookmark,
    toggleBookmark,
    refetch: fetchBookmarks,
  }
}
