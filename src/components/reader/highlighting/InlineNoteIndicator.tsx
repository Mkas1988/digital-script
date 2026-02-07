'use client'

import { StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/hooks/useNotes'

interface InlineNoteIndicatorProps {
  note: Note
  onClick: (note: Note) => void
  className?: string
}

/**
 * Small inline indicator for notes that appears at the text position
 */
export function InlineNoteIndicator({
  note,
  onClick,
  className,
}: InlineNoteIndicatorProps) {
  const previewText = note.content?.slice(0, 40) || ''
  const truncated = note.content && note.content.length > 40

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(note)
      }}
      className={cn(
        'inline-flex items-center justify-center',
        'w-5 h-5 rounded-full',
        'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800/50',
        'text-amber-600 dark:text-amber-400',
        'transition-all duration-200',
        'cursor-pointer',
        'hover:scale-110',
        'align-middle ml-0.5',
        'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
        className
      )}
      title={previewText + (truncated ? '...' : '')}
      aria-label="Notiz anzeigen"
    >
      <StickyNote className="w-3 h-3" />
    </button>
  )
}
