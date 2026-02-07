'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  Module,
  ModuleRole,
  ModuleMember,
  ModuleDocument,
  Document,
} from '@/lib/supabase/types'

interface ModuleWithRole extends Module {
  role: ModuleRole
}

interface ModuleWithDetails extends Module {
  role: ModuleRole
  documents: (ModuleDocument & { document: Document })[]
  members: ModuleMember[]
}

interface CreateModuleData {
  title: string
  description?: string
  cover_image_url?: string
  is_published?: boolean
}

interface UpdateModuleData {
  title?: string
  description?: string
  cover_image_url?: string
  is_published?: boolean
  sequence_order?: number
}

interface UseModulesReturn {
  modules: ModuleWithRole[]
  isLoading: boolean
  error: string | null
  createModule: (data: CreateModuleData) => Promise<ModuleWithRole | null>
  updateModule: (id: string, data: UpdateModuleData) => Promise<boolean>
  deleteModule: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

interface UseModuleReturn {
  module: ModuleWithDetails | null
  isLoading: boolean
  error: string | null
  updateModule: (data: UpdateModuleData) => Promise<boolean>
  addDocument: (documentId: string) => Promise<boolean>
  removeDocument: (documentId: string) => Promise<boolean>
  reorderDocuments: (documentIds: string[]) => Promise<boolean>
  addMember: (email: string, role: ModuleRole) => Promise<boolean>
  updateMemberRole: (userId: string, role: ModuleRole) => Promise<boolean>
  removeMember: (userId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Hook for listing and managing modules
 */
export function useModules(): UseModulesReturn {
  const [modules, setModules] = useState<ModuleWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/modules')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden der Module')
      }

      setModules(data.modules || [])
    } catch (err) {
      console.error('Failed to fetch modules:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Module')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createModule = useCallback(
    async (data: CreateModuleData): Promise<ModuleWithRole | null> => {
      try {
        const response = await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Erstellen')
        }

        const newModule = result.module as ModuleWithRole
        setModules((prev) => [newModule, ...prev])

        return newModule
      } catch (err) {
        console.error('Failed to create module:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
        return null
      }
    },
    []
  )

  const updateModule = useCallback(
    async (id: string, data: UpdateModuleData): Promise<boolean> => {
      try {
        const response = await fetch(`/api/modules/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Speichern')
        }

        const updatedModule = result.module as ModuleWithRole
        setModules((prev) =>
          prev.map((m) => (m.id === id ? updatedModule : m))
        )

        return true
      } catch (err) {
        console.error('Failed to update module:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
        return false
      }
    },
    []
  )

  const deleteModule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Fehler beim Löschen')
      }

      setModules((prev) => prev.filter((m) => m.id !== id))

      return true
    } catch (err) {
      console.error('Failed to delete module:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen')
      return false
    }
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return {
    modules,
    isLoading,
    error,
    createModule,
    updateModule,
    deleteModule,
    refetch: fetchModules,
  }
}

/**
 * Hook for managing a single module with its details
 */
export function useModule(moduleId: string | null): UseModuleReturn {
  const [module, setModule] = useState<ModuleWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModule = useCallback(async () => {
    if (!moduleId) {
      setModule(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/modules/${moduleId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Moduls')
      }

      setModule(data.module)
    } catch (err) {
      console.error('Failed to fetch module:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden')
    } finally {
      setIsLoading(false)
    }
  }, [moduleId])

  const updateModule = useCallback(
    async (data: UpdateModuleData): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(`/api/modules/${moduleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Speichern')
        }

        setModule((prev) =>
          prev ? { ...prev, ...result.module } : null
        )

        return true
      } catch (err) {
        console.error('Failed to update module:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
        return false
      }
    },
    [moduleId]
  )

  const addDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(`/api/modules/${moduleId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: documentId }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Hinzufügen')
        }

        // Refetch to get updated documents list
        await fetchModule()

        return true
      } catch (err) {
        console.error('Failed to add document:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen')
        return false
      }
    },
    [moduleId, fetchModule]
  )

  const removeDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(
          `/api/modules/${moduleId}/documents?document_id=${documentId}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Fehler beim Entfernen')
        }

        setModule((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter(
                  (d) => d.document_id !== documentId
                ),
              }
            : null
        )

        return true
      } catch (err) {
        console.error('Failed to remove document:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Entfernen')
        return false
      }
    },
    [moduleId]
  )

  const reorderDocuments = useCallback(
    async (documentIds: string[]): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(`/api/modules/${moduleId}/documents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_ids: documentIds }),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Fehler beim Sortieren')
        }

        // Update local state with new order
        setModule((prev) => {
          if (!prev) return null
          const reordered = documentIds
            .map((id, index) => {
              const doc = prev.documents.find((d) => d.document_id === id)
              return doc ? { ...doc, sequence_order: index } : null
            })
            .filter(Boolean) as typeof prev.documents
          return { ...prev, documents: reordered }
        })

        return true
      } catch (err) {
        console.error('Failed to reorder documents:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Sortieren')
        return false
      }
    },
    [moduleId]
  )

  const addMember = useCallback(
    async (email: string, role: ModuleRole): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(`/api/modules/${moduleId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Hinzufügen')
        }

        // Refetch to get updated members list
        await fetchModule()

        return true
      } catch (err) {
        console.error('Failed to add member:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen')
        return false
      }
    },
    [moduleId, fetchModule]
  )

  const updateMemberRole = useCallback(
    async (userId: string, role: ModuleRole): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(`/api/modules/${moduleId}/members`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, role }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Aktualisieren')
        }

        setModule((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((m) =>
                  m.user_id === userId ? { ...m, role } : m
                ),
              }
            : null
        )

        return true
      } catch (err) {
        console.error('Failed to update member role:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren')
        return false
      }
    },
    [moduleId]
  )

  const removeMember = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!moduleId) return false

      try {
        const response = await fetch(
          `/api/modules/${moduleId}/members?user_id=${userId}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Fehler beim Entfernen')
        }

        setModule((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.user_id !== userId),
              }
            : null
        )

        return true
      } catch (err) {
        console.error('Failed to remove member:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Entfernen')
        return false
      }
    },
    [moduleId]
  )

  useEffect(() => {
    fetchModule()
  }, [fetchModule])

  return {
    module,
    isLoading,
    error,
    updateModule,
    addDocument,
    removeDocument,
    reorderDocuments,
    addMember,
    updateMemberRole,
    removeMember,
    refetch: fetchModule,
  }
}
