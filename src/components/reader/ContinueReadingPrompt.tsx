'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ReadingPosition {
  sectionId: string
  sectionTitle: string
  scrollPosition: number
  timestamp: string
  chapterNumber?: string
}

interface ContinueReadingPromptProps {
  position: ReadingPosition | null
  visible: boolean
  onContinue: () => void
  onStartFresh: () => void
  onDismiss: () => void
  isTabletMode?: boolean
}

/**
 * Prompt dialog asking users if they want to continue reading from their last position
 */
export function ContinueReadingPrompt({
  position,
  visible,
  onContinue,
  onStartFresh,
  onDismiss,
  isTabletMode = false,
}: ContinueReadingPromptProps) {
  if (!position) return null

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `Vor ${diffMins} Minuten`
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    if (diffDays === 1) return 'Gestern'
    if (diffDays < 7) return `Vor ${diffDays} Tagen`
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[90vw] max-w-md',
              'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl',
              'border border-slate-200 dark:border-slate-700',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white">
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Weiterlesen?</h2>
                  <p className="text-sm text-white/80">{formatTimestamp(position.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Du warst zuletzt hier:
              </p>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-6">
                {position.chapterNumber && (
                  <span className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                    Kapitel {position.chapterNumber}
                  </span>
                )}
                <p className="font-medium text-slate-900 dark:text-white mt-1">
                  {position.sectionTitle}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={onContinue}
                  size={isTabletMode ? 'touch' : 'default'}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Weiterlesen
                </Button>

                <Button
                  onClick={onStartFresh}
                  variant="outline"
                  size={isTabletMode ? 'touch' : 'default'}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Von vorne beginnen
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
