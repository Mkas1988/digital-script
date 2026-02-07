'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddSectionButtonProps {
  onClick: () => void
  isFirst?: boolean
}

/**
 * Button that appears between sections to add new content
 */
export function AddSectionButton({ onClick, isFirst = false }: AddSectionButtonProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center justify-center',
        isFirst ? 'py-4' : 'py-2'
      )}
    >
      {/* Dashed line */}
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-transparent group-hover:border-purple-300 dark:group-hover:border-purple-700 transition-colors" />

      {/* Add button */}
      <button
        onClick={onClick}
        className={cn(
          'relative z-10 flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-background border border-border/50',
          'text-muted-foreground text-sm',
          'opacity-0 group-hover:opacity-100',
          'hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30',
          'transition-all duration-200',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Neues Element</span>
      </button>
    </div>
  )
}
