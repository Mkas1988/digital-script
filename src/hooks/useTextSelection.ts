'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface TextSelection {
  text: string
  sectionId: string | null
  paragraphIndex: number | null
  startOffset: number
  endOffset: number
  rect: DOMRect | null
}

interface UseTextSelectionOptions {
  containerRef?: React.RefObject<HTMLElement | null>
  enabled?: boolean
}

const EMPTY_SELECTION: TextSelection = {
  text: '',
  sectionId: null,
  paragraphIndex: null,
  startOffset: 0,
  endOffset: 0,
  rect: null,
}

/**
 * Hook to detect and manage text selection within reader content
 * Returns selection info including section ID, paragraph index, and character offsets
 */
export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { containerRef, enabled = true } = options
  const [selection, setSelection] = useState<TextSelection>(EMPTY_SELECTION)
  const [isSelecting, setIsSelecting] = useState(false)
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Find the section element containing the selection
   */
  const findSectionId = useCallback((node: Node): string | null => {
    let current: Node | null = node
    while (current && current !== document.body) {
      if (current instanceof HTMLElement) {
        const sectionId = current.id?.startsWith('section-')
          ? current.id.replace('section-', '')
          : null
        if (sectionId) return sectionId
      }
      current = current.parentNode
    }
    return null
  }, [])

  /**
   * Find the paragraph index containing the selection
   */
  const findParagraphIndex = useCallback((node: Node): number | null => {
    let current: Node | null = node
    while (current && current !== document.body) {
      if (current instanceof HTMLElement) {
        const paragraphIndex = current.dataset.paragraphIndex
        if (paragraphIndex !== undefined) {
          return parseInt(paragraphIndex, 10)
        }
      }
      current = current.parentNode
    }
    return null
  }, [])

  /**
   * Calculate the character offset within the section content
   * Only counts text within paragraph elements (data-paragraph-index)
   * This matches how SectionView splits and renders paragraphs
   */
  const calculateSectionOffset = useCallback(
    (
      anchorNode: Node,
      anchorOffset: number,
      sectionElement: HTMLElement
    ): number => {
      // Find the paragraph element containing this node
      let paragraphElement: HTMLElement | null = null
      let current: Node | null = anchorNode
      while (current && current !== sectionElement) {
        if (current instanceof HTMLElement && current.dataset.paragraphIndex !== undefined) {
          paragraphElement = current
          break
        }
        current = current.parentNode
      }

      if (!paragraphElement) {
        // Not in a paragraph (might be in title or summary), return 0
        return 0
      }

      const paragraphIndex = parseInt(paragraphElement.dataset.paragraphIndex || '0', 10)

      // Calculate offset within this paragraph by walking its text nodes
      const walker = document.createTreeWalker(
        paragraphElement,
        NodeFilter.SHOW_TEXT,
        null
      )

      let offsetInParagraph = 0
      let node: Node | null = walker.nextNode()

      while (node) {
        if (node === anchorNode) {
          offsetInParagraph += anchorOffset
          break
        }
        offsetInParagraph += node.textContent?.length || 0
        node = walker.nextNode()
      }

      // Calculate the absolute offset by adding paragraph start positions
      // Get all paragraphs in the section to calculate cumulative offset
      const allParagraphs = sectionElement.querySelectorAll('[data-paragraph-index]')
      let cumulativeOffset = 0

      for (let i = 0; i < paragraphIndex; i++) {
        const para = allParagraphs[i]
        if (para) {
          // Use textContent length + 2 for the \n\n separator between paragraphs
          cumulativeOffset += (para.textContent?.length || 0) + 2
        }
      }

      return cumulativeOffset + offsetInParagraph
    },
    []
  )

  /**
   * Get the bounding rect for the selection
   */
  const getSelectionRect = useCallback((): DOMRect | null => {
    const nativeSelection = window.getSelection()
    if (!nativeSelection || nativeSelection.rangeCount === 0) return null

    const range = nativeSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Return null if rect is empty (collapsed selection)
    if (rect.width === 0 && rect.height === 0) return null

    return rect
  }, [])

  /**
   * Handle selection change
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled) return

    // Clear any pending timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current)
    }

    // Small delay to ensure selection is complete
    selectionTimeoutRef.current = setTimeout(() => {
      const nativeSelection = window.getSelection()

      if (!nativeSelection || nativeSelection.isCollapsed) {
        setSelection(EMPTY_SELECTION)
        setIsSelecting(false)
        return
      }

      const selectedText = nativeSelection.toString().trim()
      if (!selectedText) {
        setSelection(EMPTY_SELECTION)
        setIsSelecting(false)
        return
      }

      // Check if selection is within container (if provided)
      const anchorNode = nativeSelection.anchorNode
      const focusNode = nativeSelection.focusNode

      if (!anchorNode || !focusNode) {
        setSelection(EMPTY_SELECTION)
        return
      }

      if (containerRef?.current) {
        const container = containerRef.current
        if (
          !container.contains(anchorNode) ||
          !container.contains(focusNode)
        ) {
          setSelection(EMPTY_SELECTION)
          return
        }
      }

      // Find section and paragraph info
      const sectionId = findSectionId(anchorNode)
      const paragraphIndex = findParagraphIndex(anchorNode)

      // Get the section element for offset calculation
      let startOffset = 0
      let endOffset = 0

      if (sectionId) {
        const sectionElement = document.getElementById(`section-${sectionId}`)
        if (sectionElement) {
          const range = nativeSelection.getRangeAt(0)
          startOffset = calculateSectionOffset(
            range.startContainer,
            range.startOffset,
            sectionElement
          )
          endOffset = calculateSectionOffset(
            range.endContainer,
            range.endOffset,
            sectionElement
          )
        }
      }

      const rect = getSelectionRect()

      setSelection({
        text: selectedText,
        sectionId,
        paragraphIndex,
        startOffset: Math.min(startOffset, endOffset),
        endOffset: Math.max(startOffset, endOffset),
        rect,
      })
      setIsSelecting(true)
    }, 10)
  }, [
    enabled,
    containerRef,
    findSectionId,
    findParagraphIndex,
    calculateSectionOffset,
    getSelectionRect,
  ])

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setSelection(EMPTY_SELECTION)
    setIsSelecting(false)
  }, [])

  /**
   * Check if there is an active selection
   */
  const hasSelection = selection.text.length > 0

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [enabled, handleSelectionChange])

  return {
    selection,
    isSelecting,
    hasSelection,
    clearSelection,
  }
}
