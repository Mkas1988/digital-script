'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { slideInLeft } from '@/lib/animations'
import { useTouchGestures } from '@/hooks/useTouchGestures'

interface TabletSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Width of sidebar (default: 280) */
  width?: number
  /** Show close button (default: true) */
  showCloseButton?: boolean
  /** Enable swipe to close (default: true) */
  enableSwipeClose?: boolean
  /** Position: left or right (default: left) */
  position?: 'left' | 'right'
  /** Header content (optional) */
  header?: React.ReactNode
}

export function TabletSidebar({
  isOpen,
  onClose,
  children,
  width = 280,
  showCloseButton = true,
  enableSwipeClose = true,
  position = 'left',
  header,
}: TabletSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle swipe to close
  useTouchGestures(
    {
      onEdgeSwipeLeft: position === 'right' ? onClose : undefined,
      onSwipeLeft: position === 'left' && enableSwipeClose ? onClose : undefined,
      onSwipeRight: position === 'right' && enableSwipeClose ? onClose : undefined,
    },
    {
      enableEdgeSwipe: true,
      swipeThreshold: 50,
    }
  )

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const slideVariants = {
    initial: { x: position === 'left' ? '-100%' : '100%', opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring' as const, damping: 25, stiffness: 200 },
    },
    exit: {
      x: position === 'left' ? '-100%' : '100%',
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' as const },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 z-40',
              'bg-black/40 backdrop-blur-sm',
              'touch-none'
            )}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed top-0 bottom-0 z-50',
              position === 'left' ? 'left-0' : 'right-0',
              'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
              'border-r border-gray-200/50 dark:border-gray-700/50',
              position === 'right' && 'border-r-0 border-l',
              'shadow-2xl',
              'flex flex-col',
              'overflow-hidden'
            )}
            style={{ width }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(header || showCloseButton) && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                {header}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-11 w-11 touch-target ml-auto"
                    aria-label="Sidebar schließen"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
