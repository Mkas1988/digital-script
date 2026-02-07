'use client'

import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface BookmarkButtonProps {
  isBookmarked: boolean
  onToggle: () => void
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Button to toggle bookmark status for a section
 */
export function BookmarkButton({
  isBookmarked,
  onToggle,
  size = 'sm',
  showLabel = false,
  className,
}: BookmarkButtonProps) {
  const iconSize = size === 'lg' ? 'w-5 h-5' : size === 'default' ? 'w-4 h-4' : 'w-3.5 h-3.5'

  return (
    <Button
      variant="ghost"
      size={size === 'lg' ? 'default' : size === 'default' ? 'sm' : 'icon'}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        'relative transition-all',
        isBookmarked && 'text-amber-500 hover:text-amber-600',
        !isBookmarked && 'text-muted-foreground hover:text-amber-500',
        className
      )}
      title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isBookmarked ? [1, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Bookmark
          className={cn(
            iconSize,
            isBookmarked && 'fill-current'
          )}
        />
      </motion.div>
      {showLabel && (
        <span className="ml-2">
          {isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen'}
        </span>
      )}
    </Button>
  )
}
