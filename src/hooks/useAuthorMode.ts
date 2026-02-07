'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'author-mode-enabled'

interface UseAuthorModeReturn {
  isAuthorMode: boolean
  toggleAuthorMode: () => void
  enableAuthorMode: () => void
  disableAuthorMode: () => void
  canEdit: boolean
}

/**
 * Hook to manage Author Mode state
 * Persists preference in localStorage
 *
 * @param userRole - Current user's role (owner, editor, viewer)
 * @returns Author mode state and controls
 */
export function useAuthorMode(userRole?: 'owner' | 'editor' | 'viewer' | null): UseAuthorModeReturn {
  const [isAuthorMode, setIsAuthorMode] = useState(false)

  // User can edit if they're owner or editor
  const canEdit = userRole === 'owner' || userRole === 'editor'

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true' && canEdit) {
      setIsAuthorMode(true)
    }
  }, [canEdit])

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isAuthorMode))
  }, [isAuthorMode])

  // Disable author mode if user loses edit permission
  useEffect(() => {
    if (!canEdit && isAuthorMode) {
      setIsAuthorMode(false)
    }
  }, [canEdit, isAuthorMode])

  const toggleAuthorMode = useCallback(() => {
    if (canEdit) {
      setIsAuthorMode(prev => !prev)
    }
  }, [canEdit])

  const enableAuthorMode = useCallback(() => {
    if (canEdit) {
      setIsAuthorMode(true)
    }
  }, [canEdit])

  const disableAuthorMode = useCallback(() => {
    setIsAuthorMode(false)
  }, [])

  return {
    isAuthorMode: isAuthorMode && canEdit, // Only true if user can actually edit
    toggleAuthorMode,
    enableAuthorMode,
    disableAuthorMode,
    canEdit,
  }
}
