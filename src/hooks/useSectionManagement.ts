'use client'

import { useState, useCallback } from 'react'
import type { Section, SectionType, SectionMetadata, SectionFormatting } from '@/lib/supabase/types'

interface CreateSectionData {
  section_type: SectionType
  title: string
  content?: string
  afterSectionId?: string | null // Insert after this section, null = at beginning
  metadata?: Partial<SectionMetadata>
  formatting?: Partial<SectionFormatting>
}

interface UseSectionManagementReturn {
  // CRUD Operations
  createSection: (data: CreateSectionData) => Promise<Section | null>
  deleteSection: (sectionId: string) => Promise<boolean>
  reorderSection: (sectionId: string, direction: 'up' | 'down') => Promise<boolean>
  updateSectionType: (sectionId: string, newType: SectionType) => Promise<boolean>

  // Loading States
  isCreating: boolean
  isDeleting: boolean
  isReordering: boolean

  // Error
  error: string | null
  clearError: () => void

  // UI State for Add Section
  showAddMenuAfter: string | null
  setShowAddMenuAfter: (sectionId: string | null) => void

  // UI State for Delete Confirmation
  confirmDeleteId: string | null
  setConfirmDeleteId: (sectionId: string | null) => void
}

/**
 * Hook for managing sections (create, delete, reorder)
 *
 * @param documentId - The document ID
 * @param sections - Current sections array
 * @param onSectionsChange - Callback when sections are modified (for refetching)
 */
export function useSectionManagement(
  documentId: string,
  sections: Section[],
  onSectionsChange?: () => void
): UseSectionManagementReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [showAddMenuAfter, setShowAddMenuAfter] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  /**
   * Create a new section
   */
  const createSection = useCallback(async (data: CreateSectionData): Promise<Section | null> => {
    setIsCreating(true)
    setError(null)

    try {
      // Calculate order_index
      let orderIndex = 0

      if (data.afterSectionId) {
        const afterSection = sections.find(s => s.id === data.afterSectionId)
        if (afterSection) {
          orderIndex = afterSection.order_index + 1
        }
      }

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          section_type: data.section_type,
          title: data.title,
          content: data.content || '',
          order_index: orderIndex,
          metadata: data.metadata || {},
          formatting: data.formatting || {},
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Erstellen')
      }

      // Close add menu
      setShowAddMenuAfter(null)

      // Trigger refetch
      onSectionsChange?.()

      return result.section
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [documentId, sections, onSectionsChange])

  /**
   * Delete a section
   */
  const deleteSection = useCallback(async (sectionId: string): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Löschen')
      }

      // Close delete confirmation
      setConfirmDeleteId(null)

      // Trigger refetch
      onSectionsChange?.()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [onSectionsChange])

  /**
   * Reorder a section up or down
   */
  const reorderSection = useCallback(async (
    sectionId: string,
    direction: 'up' | 'down'
  ): Promise<boolean> => {
    setIsReordering(true)
    setError(null)

    try {
      const section = sections.find(s => s.id === sectionId)
      if (!section) {
        throw new Error('Sektion nicht gefunden')
      }

      const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index)
      const currentIndex = sortedSections.findIndex(s => s.id === sectionId)

      let newOrderIndex: number

      if (direction === 'up') {
        if (currentIndex === 0) {
          // Already at top
          return true
        }
        newOrderIndex = sortedSections[currentIndex - 1].order_index
      } else {
        if (currentIndex === sortedSections.length - 1) {
          // Already at bottom
          return true
        }
        newOrderIndex = sortedSections[currentIndex + 1].order_index
      }

      const response = await fetch('/api/sections/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          section_id: sectionId,
          new_order_index: newOrderIndex,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Verschieben')
      }

      // Trigger refetch
      onSectionsChange?.()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      return false
    } finally {
      setIsReordering(false)
    }
  }, [documentId, sections, onSectionsChange])

  /**
   * Update section type (quick action from ActionBar)
   */
  const updateSectionType = useCallback(async (
    sectionId: string,
    newType: SectionType
  ): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_type: newType }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Ändern des Typs')
      }

      // Trigger refetch
      onSectionsChange?.()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      return false
    }
  }, [onSectionsChange])

  return {
    createSection,
    deleteSection,
    reorderSection,
    updateSectionType,
    isCreating,
    isDeleting,
    isReordering,
    error,
    clearError,
    showAddMenuAfter,
    setShowAddMenuAfter,
    confirmDeleteId,
    setConfirmDeleteId,
  }
}
