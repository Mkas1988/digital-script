'use client'

import { useState, useCallback } from 'react'
import type { Section, SectionType, SectionMetadata, SectionFormatting } from '@/lib/supabase/types'

interface UpdateSectionData {
  title?: string
  content?: string
  section_type?: SectionType
  metadata?: Partial<SectionMetadata>
  formatting?: Partial<SectionFormatting>
  order_index?: number
}

interface UseEditSectionOptions {
  /**
   * Callback when a section is successfully saved
   */
  onSave?: (section: Section) => void
  /**
   * Callback when editing is cancelled
   */
  onCancel?: () => void
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void
}

interface UseEditSectionReturn {
  /**
   * Whether the editor is currently open
   */
  isEditing: boolean
  /**
   * The section being edited (null if not editing)
   */
  editingSection: Section | null
  /**
   * Start editing a section
   */
  startEditing: (section: Section) => void
  /**
   * Cancel editing and close the editor
   */
  cancelEditing: () => void
  /**
   * Save changes to the section
   */
  saveSection: (updates: UpdateSectionData) => Promise<boolean>
  /**
   * Whether a save operation is in progress
   */
  isSaving: boolean
  /**
   * Current error message (if any)
   */
  error: string | null
  /**
   * Clear the current error
   */
  clearError: () => void
  /**
   * Whether there are unsaved changes
   */
  isDirty: boolean
  /**
   * Mark the section as having unsaved changes
   */
  setDirty: (dirty: boolean) => void
}

/**
 * Hook for editing sections with API integration
 * Provides state management for the section editor and handles API calls
 */
export function useEditSection(options: UseEditSectionOptions = {}): UseEditSectionReturn {
  const { onSave, onCancel, onError } = options

  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const isEditing = editingSection !== null

  /**
   * Start editing a section
   */
  const startEditing = useCallback((section: Section) => {
    setEditingSection(section)
    setError(null)
    setIsDirty(false)
  }, [])

  /**
   * Cancel editing and close the editor
   */
  const cancelEditing = useCallback(() => {
    setEditingSection(null)
    setError(null)
    setIsDirty(false)
    onCancel?.()
  }, [onCancel])

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Save changes to the section via API
   */
  const saveSection = useCallback(async (updates: UpdateSectionData): Promise<boolean> => {
    if (!editingSection) {
      setError('Keine Sektion zum Speichern ausgewählt')
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/sections/${editingSection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      // Update the editing section with the saved data
      const updatedSection = data.section as Section
      setEditingSection(updatedSection)
      setIsDirty(false)

      // Call onSave callback with the updated section
      onSave?.(updatedSection)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten'
      setError(errorMessage)
      onError?.(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [editingSection, onSave, onError])

  /**
   * Mark the section as having unsaved changes
   */
  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty)
  }, [])

  return {
    isEditing,
    editingSection,
    startEditing,
    cancelEditing,
    saveSection,
    isSaving,
    error,
    clearError,
    isDirty,
    setDirty,
  }
}

/**
 * Helper function to check if section type is valid
 */
export function isValidSectionType(type: string): type is SectionType {
  const validTypes: SectionType[] = [
    'chapter',
    'subchapter',
    'learning_objectives',
    'task',
    'practice_impulse',
    'reflection',
    'tip',
    'summary',
    'definition',
    'example',
    'important',
    'exercise',
    'solution',
    'reference',
  ]
  return validTypes.includes(type as SectionType)
}

/**
 * Section type labels in German
 */
export const sectionTypeLabels: Record<SectionType, string> = {
  chapter: 'Kapitel',
  subchapter: 'Unterkapitel',
  learning_objectives: 'Lernziele',
  task: 'Aufgabe',
  practice_impulse: 'Praxisimpuls',
  reflection: 'Reflexion',
  tip: 'Tipp',
  summary: 'Zusammenfassung',
  definition: 'Definition',
  example: 'Beispiel',
  important: 'Wichtig',
  exercise: 'Übung',
  solution: 'Lösung',
  reference: 'Verweis',
}

/**
 * Section type groups for UI organization
 */
export const sectionTypeGroups = {
  structure: ['chapter', 'subchapter'] as SectionType[],
  content: ['learning_objectives', 'summary', 'definition', 'example', 'reference'] as SectionType[],
  interactive: ['task', 'practice_impulse', 'reflection', 'exercise', 'solution'] as SectionType[],
  emphasis: ['important', 'tip'] as SectionType[],
}
