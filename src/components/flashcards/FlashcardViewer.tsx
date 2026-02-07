'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Flashcard } from '@/lib/supabase/types'

interface FlashcardViewerProps {
  flashcard: Flashcard
  onCorrect: () => void
  onIncorrect: () => void
  onSkip?: () => void
  showNavigation?: boolean
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  currentIndex?: number
  totalCount?: number
}

/**
 * Single flashcard with flip animation
 */
export function FlashcardViewer({
  flashcard,
  onCorrect,
  onIncorrect,
  onSkip,
  showNavigation = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalCount,
}: FlashcardViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleFlip = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsFlipped((prev) => !prev)
    setTimeout(() => setIsAnimating(false), 300)
  }, [isAnimating])

  const handleCorrect = useCallback(() => {
    onCorrect()
    setIsFlipped(false)
  }, [onCorrect])

  const handleIncorrect = useCallback(() => {
    onIncorrect()
    setIsFlipped(false)
  }, [onIncorrect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
      } else if (e.key === 'ArrowRight' && isFlipped) {
        handleCorrect()
      } else if (e.key === 'ArrowLeft' && isFlipped) {
        handleIncorrect()
      }
    },
    [handleFlip, handleCorrect, handleIncorrect, isFlipped]
  )

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress indicator */}
      {currentIndex !== undefined && totalCount !== undefined && (
        <div className="text-center mb-4">
          <span className="text-sm text-muted-foreground">
            Karte {currentIndex + 1} von {totalCount}
          </span>
        </div>
      )}

      {/* Card container */}
      <div
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? 'Antwort anzeigen' : 'Frage anzeigen'}
      >
        <motion.div
          className="absolute inset-0 w-full h-full preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front - Question - FOM Grün */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full backface-hidden',
              'rounded-2xl shadow-xl',
              'bg-gradient-to-br from-teal-500 to-teal-600',
              'p-6 flex flex-col'
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-xs font-medium text-white/70 mb-2">FRAGE</div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl font-medium text-white text-center leading-relaxed">
                {flashcard.question}
              </p>
            </div>
            <div className="text-center text-white/60 text-sm mt-4">
              Klicken zum Umdrehen
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full backface-hidden',
              'rounded-2xl shadow-xl',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'p-6 flex flex-col'
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">ANTWORT</div>
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <p className="text-lg text-foreground text-center leading-relaxed whitespace-pre-wrap">
                {flashcard.answer}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-4">
        {/* Correct/Incorrect buttons - only show when flipped */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              variant="outline"
              size="lg"
              className="flex-1 max-w-[160px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={(e) => {
                e.stopPropagation()
                handleIncorrect()
              }}
            >
              <X className="w-5 h-5 mr-2" />
              Falsch
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 max-w-[160px] border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
              onClick={(e) => {
                e.stopPropagation()
                handleCorrect()
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              Richtig
            </Button>
          </motion.div>
        )}

        {/* Navigation and skip */}
        <div className="flex items-center justify-between">
          {showNavigation && onPrevious ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(false)
                onPrevious()
              }}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          ) : (
            <div />
          )}

          {!isFlipped && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleFlip()
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Umdrehen
            </Button>
          )}

          {showNavigation && onNext ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(false)
                onNext()
              }}
              disabled={!hasNext}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Leertaste</kbd> umdrehen
          {isFlipped && (
            <>
              {' · '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">←</kbd> falsch
              {' · '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">→</kbd> richtig
            </>
          )}
        </span>
      </div>
    </div>
  )
}
