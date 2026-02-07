'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useTextSelection, type TextSelection } from '@/hooks/useTextSelection'
import { useAnnotations } from '@/hooks/useAnnotations'
import { DEFAULT_HIGHLIGHT_COLOR } from '@/lib/highlighting/constants'
import type { Annotation } from '@/lib/supabase/types'

interface HighlightContextValue {
  // Selection state
  selection: TextSelection
  hasSelection: boolean
  clearSelection: () => void

  // Highlights data
  highlights: Annotation[]
  isLoading: boolean
  getHighlightsForSection: (sectionId: string) => Annotation[]

  // UI state
  showColorPicker: boolean
  setShowColorPicker: (show: boolean) => void
  activeHighlight: Annotation | null
  setActiveHighlight: (highlight: Annotation | null) => void
  showHighlightSidebar: boolean
  setShowHighlightSidebar: (show: boolean) => void

  // Actions
  createHighlight: (color?: string) => Promise<Annotation | null>
  deleteHighlight: (id: string) => Promise<boolean>
  updateHighlightNote: (id: string, content: string) => Promise<boolean>

  // Container ref for selection detection
  containerRef: React.RefObject<HTMLDivElement | null>
}

const HighlightContext = createContext<HighlightContextValue | null>(null)

interface HighlightProviderProps {
  children: ReactNode
  sectionIds: string[]
}

export function HighlightProvider({
  children,
  sectionIds,
}: HighlightProviderProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)

  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<Annotation | null>(null)
  const [showHighlightSidebar, setShowHighlightSidebar] = useState(false)

  // Text selection hook
  const { selection, hasSelection, clearSelection } = useTextSelection({
    containerRef,
    enabled: true,
  })

  // Annotations hook
  const {
    highlights,
    isLoading,
    createHighlight: createHighlightBase,
    updateHighlight,
    deleteHighlight: deleteHighlightBase,
    getHighlightsForSection,
    refetch,
  } = useAnnotations(sectionIds)

  // Show color picker when there's a selection
  const handleSelectionChange = useCallback(() => {
    if (hasSelection && selection.sectionId) {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
  }, [hasSelection, selection.sectionId])

  // Create highlight with selected text
  const createHighlight = useCallback(
    async (color: string = DEFAULT_HIGHLIGHT_COLOR): Promise<Annotation | null> => {
      if (!selection.sectionId || !selection.text) {
        return null
      }

      const result = await createHighlightBase({
        sectionId: selection.sectionId,
        textSelection: selection.text,
        positionStart: selection.startOffset,
        positionEnd: selection.endOffset,
        color,
      })

      if (result) {
        clearSelection()
        setShowColorPicker(false)
      }

      return result
    },
    [selection, createHighlightBase, clearSelection]
  )

  // Delete highlight
  const deleteHighlight = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await deleteHighlightBase(id)
      if (result) {
        setActiveHighlight(null)
      }
      return result
    },
    [deleteHighlightBase]
  )

  // Update highlight note
  const updateHighlightNote = useCallback(
    async (id: string, content: string): Promise<boolean> => {
      return updateHighlight(id, { content })
    },
    [updateHighlight]
  )

  // Effect to show/hide color picker based on selection
  // Properly using useEffect instead of render-time state changes
  useEffect(() => {
    if (hasSelection && selection.sectionId) {
      setShowColorPicker(true)
    } else if (!hasSelection) {
      // Small delay before hiding to allow clicking on the popup
      const timeout = setTimeout(() => {
        if (!window.getSelection()?.toString()) {
          setShowColorPicker(false)
        }
      }, 150) // Increased delay for more reliable behavior
      return () => clearTimeout(timeout)
    }
  }, [hasSelection, selection.sectionId])

  const value: HighlightContextValue = {
    selection,
    hasSelection,
    clearSelection,
    highlights,
    isLoading,
    getHighlightsForSection,
    showColorPicker,
    setShowColorPicker,
    activeHighlight,
    setActiveHighlight,
    showHighlightSidebar,
    setShowHighlightSidebar,
    createHighlight,
    deleteHighlight,
    updateHighlightNote,
    containerRef,
  }

  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  )
}

export function useHighlightContext() {
  const context = useContext(HighlightContext)
  if (!context) {
    throw new Error('useHighlightContext must be used within a HighlightProvider')
  }
  return context
}
