'use client'

import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EditButtonProps {
  onClick: () => void
  className?: string
  disabled?: boolean
  /**
   * Whether the button should be visible at all times or only on hover
   */
  alwaysVisible?: boolean
  /**
   * Size variant
   */
  size?: 'sm' | 'default'
}

/**
 * Edit button for sections
 * Shows a pencil icon that triggers the section editor
 */
export function EditButton({
  onClick,
  className,
  disabled = false,
  alwaysVisible = false,
  size = 'sm',
}: EditButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'icon' : 'default'}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      className={cn(
        'transition-opacity',
        !alwaysVisible && 'opacity-0 group-hover:opacity-100 focus:opacity-100',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-primary/10',
        className
      )}
      title="Bearbeiten"
    >
      <Pencil className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
    </Button>
  )
}
