'use client'

import { useEffect, useRef } from 'react'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Section } from '@/lib/supabase/types'

interface DeleteConfirmDialogProps {
  section: Section | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

/**
 * Confirmation dialog for deleting a section
 */
export function DeleteConfirmDialog({
  section,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isDeleting])

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen || !section) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-background border border-border rounded-xl shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'focus:outline-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Sektion löschen?</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-foreground mb-2">
            Möchtest du diese Sektion wirklich löschen?
          </p>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="font-medium text-foreground truncate">
              {section.title || 'Ohne Titel'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Typ: {section.section_type}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'border border-border text-foreground',
              'hover:bg-muted transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-red-600 text-white',
              'hover:bg-red-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Löschen...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Löschen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
