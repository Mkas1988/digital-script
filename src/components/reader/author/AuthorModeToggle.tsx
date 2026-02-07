'use client'

import { BookOpen, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthorModeToggleProps {
  isAuthorMode: boolean
  onToggle: () => void
  canEdit: boolean
}

/**
 * Segmented control toggle for switching between Student and Author mode
 */
export function AuthorModeToggle({
  isAuthorMode,
  onToggle,
  canEdit,
}: AuthorModeToggleProps) {
  if (!canEdit) {
    return null
  }

  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <button
        onClick={() => isAuthorMode && onToggle()}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          !isAuthorMode
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Lesen</span>
      </button>
      <button
        onClick={() => !isAuthorMode && onToggle()}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          isAuthorMode
            ? 'bg-purple-600 text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Edit3 className="w-4 h-4" />
        <span className="hidden sm:inline">Bearbeiten</span>
      </button>
    </div>
  )
}
