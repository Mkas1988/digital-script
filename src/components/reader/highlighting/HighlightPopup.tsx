'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Trash2, Sparkles, StickyNote, BookmarkPlus, BookmarkCheck, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { scaleIn } from '@/lib/animations'
import {
  HIGHLIGHT_COLOR_VALUES,
  type HighlightColor,
} from '@/lib/highlighting/constants'

interface HighlightPopupProps {
  position: { x: number; y: number } | null
  visible: boolean
  onColorSelect: (color: string) => void
  onClose: () => void
  mode?: 'create' | 'edit'
  onDelete?: () => void
  onAddNote?: () => void
  onAskAI?: () => void
  onCreateFlashcard?: () => void
  onToggleForReview?: () => void
  currentColor?: string
  isForReview?: boolean
}

export function HighlightPopup({
  position,
  visible,
  onColorSelect,
  onClose,
  mode = 'create',
  onDelete,
  onAddNote,
  onAskAI,
  onCreateFlashcard,
  onToggleForReview,
  currentColor,
  isForReview = false,
}: HighlightPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popup in viewport
  useEffect(() => {
    if (!position || !popupRef.current) {
      setAdjustedPosition(position)
      return
    }

    const popup = popupRef.current
    const rect = popup.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + rect.width / 2 > viewportWidth - 16) {
      x = viewportWidth - rect.width / 2 - 16
    }
    if (x - rect.width / 2 < 16) {
      x = rect.width / 2 + 16
    }

    // Adjust vertical position (show above selection if no room below)
    if (y + rect.height > viewportHeight - 16) {
      y = position.y - rect.height - 60 // Show above selection
    }

    setAdjustedPosition({ x, y })
  }, [position])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose])

  // Close on click outside
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Increased delay to avoid race conditions with selection and color button clicks
        timeoutId = setTimeout(() => {
          const selection = window.getSelection()
          if (!selection?.toString().trim()) {
            onClose()
          }
        }, 150) // Increased from 50ms to 150ms for reliability
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
  }, [visible, onClose])

  if (!adjustedPosition) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={popupRef}
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'fixed z-50 transform -translate-x-1/2',
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
            'rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50',
            'p-2'
          )}
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y + 8,
          }}
        >
          <div className="flex items-center gap-1">
            {/* Color options */}
            {HIGHLIGHT_COLOR_VALUES.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorSelect(color.value)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all duration-200',
                  'hover:scale-110 hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
                  currentColor === color.value && 'ring-2 ring-brand-500 scale-110'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
                aria-label={`Markieren mit ${color.label}`}
              />
            ))}

            {/* Separator */}
            {(onAddNote || onAskAI || (mode === 'edit' && onDelete)) && (
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
            )}

            {/* Note button - available in both modes */}
            {onAddNote && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={onAddNote}
                title="Notiz erstellen"
              >
                <StickyNote className="w-4 h-4" />
              </Button>
            )}

            {/* AI button - available in both modes */}
            {onAskAI && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                onClick={onAskAI}
                title="KI fragen"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}

            {/* Flashcard button - available in create mode */}
            {onCreateFlashcard && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                onClick={onCreateFlashcard}
                title="Lernkarte erstellen"
              >
                <GraduationCap className="w-4 h-4" />
              </Button>
            )}

            {/* For Review button - edit mode only */}
            {mode === 'edit' && onToggleForReview && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  isForReview
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/30'
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                )}
                onClick={onToggleForReview}
                title={isForReview ? 'Aus Vertiefung entfernen' : 'Zur Vertiefung markieren'}
              >
                {isForReview ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Delete button - edit mode only */}
            {mode === 'edit' && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                title="Markierung löschen"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-1"
              onClick={onClose}
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tooltip arrow */}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-2',
              'w-4 h-4 rotate-45',
              'bg-white/90 dark:bg-gray-900/90',
              'border-l border-t border-white/20 dark:border-gray-700/50'
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
