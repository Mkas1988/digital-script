'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearningUnit, Section } from '@/lib/supabase/types'

interface LearningUnitWithSections extends LearningUnit {
  sections: {
    id: string
    section_id: string
    sequence_order: number
    section: Section
  }[]
}

interface CreateLearningUnitData {
  document_id: string
  title: string
  description?: string
  learning_objectives?: string[]
  estimated_minutes?: number
}

interface UpdateLearningUnitData {
  title?: string
  description?: string
  learning_objectives?: string[]
  estimated_minutes?: number
  sequence_order?: number
}

interface UseLearningUnitsReturn {
  learningUnits: LearningUnitWithSections[]
  isLoading: boolean
  error: string | null
  createUnit: (data: CreateLearningUnitData) => Promise<LearningUnitWithSections | null>
  updateUnit: (id: string, data: UpdateLearningUnitData) => Promise<boolean>
  deleteUnit: (id: string) => Promise<boolean>
  addSection: (unitId: string, sectionId: string) => Promise<boolean>
  removeSection: (unitId: string, sectionId: string) => Promise<boolean>
  reorderSections: (unitId: string, sectionIds: string[]) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Hook for managing learning units for a document
 */
export function useLearningUnits(documentId: string | null): UseLearningUnitsReturn {
  const [learningUnits, setLearningUnits] = useState<LearningUnitWithSections[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnits = useCallback(async () => {
    if (!documentId) {
      setLearningUnits([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/learning-units?document_id=${documentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden der Lerneinheiten')
      }

      setLearningUnits(data.learning_units || [])
    } catch (err) {
      console.error('Failed to fetch learning units:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  const createUnit = useCallback(
    async (data: CreateLearningUnitData): Promise<LearningUnitWithSections | null> => {
      try {
        const response = await fetch('/api/learning-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Erstellen')
        }

        const newUnit = result.learning_unit as LearningUnitWithSections
        setLearningUnits((prev) => [...prev, newUnit])

        return newUnit
      } catch (err) {
        console.error('Failed to create learning unit:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
        return null
      }
    },
    []
  )

  const updateUnit = useCallback(
    async (id: string, data: UpdateLearningUnitData): Promise<boolean> => {
      try {
        const response = await fetch(`/api/learning-units/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Speichern')
        }

        setLearningUnits((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, ...result.learning_unit } : u
          )
        )

        return true
      } catch (err) {
        console.error('Failed to update learning unit:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
        return false
      }
    },
    []
  )

  const deleteUnit = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/learning-units/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Fehler beim Löschen')
      }

      setLearningUnits((prev) => prev.filter((u) => u.id !== id))

      return true
    } catch (err) {
      console.error('Failed to delete learning unit:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen')
      return false
    }
  }, [])

  const addSection = useCallback(
    async (unitId: string, sectionId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/learning-units/${unitId}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section_id: sectionId }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Hinzufügen')
        }

        // Refetch to get updated sections
        await fetchUnits()

        return true
      } catch (err) {
        console.error('Failed to add section:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen')
        return false
      }
    },
    [fetchUnits]
  )

  const removeSection = useCallback(
    async (unitId: string, sectionId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/learning-units/${unitId}/sections?section_id=${sectionId}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Fehler beim Entfernen')
        }

        setLearningUnits((prev) =>
          prev.map((u) =>
            u.id === unitId
              ? {
                  ...u,
                  sections: u.sections.filter((s) => s.section_id !== sectionId),
                }
              : u
          )
        )

        return true
      } catch (err) {
        console.error('Failed to remove section:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Entfernen')
        return false
      }
    },
    []
  )

  const reorderSections = useCallback(
    async (unitId: string, sectionIds: string[]): Promise<boolean> => {
      try {
        const response = await fetch(`/api/learning-units/${unitId}/sections`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section_ids: sectionIds }),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Fehler beim Sortieren')
        }

        // Update local state with new order
        setLearningUnits((prev) =>
          prev.map((u) => {
            if (u.id !== unitId) return u
            const reordered = sectionIds
              .map((id, index) => {
                const section = u.sections.find((s) => s.section_id === id)
                return section ? { ...section, sequence_order: index } : null
              })
              .filter(Boolean) as typeof u.sections
            return { ...u, sections: reordered }
          })
        )

        return true
      } catch (err) {
        console.error('Failed to reorder sections:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Sortieren')
        return false
      }
    },
    []
  )

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  return {
    learningUnits,
    isLoading,
    error,
    createUnit,
    updateUnit,
    deleteUnit,
    addSection,
    removeSection,
    reorderSections,
    refetch: fetchUnits,
  }
}
