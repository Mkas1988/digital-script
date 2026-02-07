'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  GraduationCap,
  Trophy,
  RotateCcw,
  X,
  Check,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { FlashcardViewer } from './FlashcardViewer'
import type { Flashcard } from '@/lib/supabase/types'

type LearningMode = 'all' | 'review' | 'new'
type SessionState = 'idle' | 'learning' | 'completed'

interface SessionStats {
  total: number
  correct: number
  incorrect: number
}

interface FlashcardDeckProps {
  flashcards: Flashcard[]
  onUpdateReview: (id: string, correct: boolean) => Promise<boolean>
  onClose?: () => void
  isLoading?: boolean
}

/**
 * Flashcard learning deck with session management
 */
export function FlashcardDeck({
  flashcards,
  onUpdateReview,
  onClose,
  isLoading = false,
}: FlashcardDeckProps) {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [learningMode, setLearningMode] = useState<LearningMode>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([])
  const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, incorrect: 0 })

  // Filter flashcards based on mode
  const dueForReview = useMemo(() => {
    const now = new Date()
    return flashcards.filter((f) => {
      if (!f.next_review) return true
      return new Date(f.next_review) <= now
    })
  }, [flashcards])

  const newCards = useMemo(() => {
    return flashcards.filter((f) => f.review_count === 0)
  }, [flashcards])

  // Start learning session
  const startSession = useCallback((mode: LearningMode) => {
    let cards: Flashcard[]

    switch (mode) {
      case 'review':
        cards = dueForReview
        break
      case 'new':
        cards = newCards
        break
      default:
        cards = flashcards
    }

    // Shuffle cards
    const shuffled = [...cards].sort(() => Math.random() - 0.5)

    setLearningMode(mode)
    setSessionCards(shuffled)
    setCurrentIndex(0)
    setStats({ total: shuffled.length, correct: 0, incorrect: 0 })
    setSessionState('learning')
  }, [flashcards, dueForReview, newCards])

  // Handle correct answer
  const handleCorrect = useCallback(async () => {
    const card = sessionCards[currentIndex]
    await onUpdateReview(card.id, true)

    setStats((prev) => ({ ...prev, correct: prev.correct + 1 }))

    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setSessionState('completed')
    }
  }, [sessionCards, currentIndex, onUpdateReview])

  // Handle incorrect answer
  const handleIncorrect = useCallback(async () => {
    const card = sessionCards[currentIndex]
    await onUpdateReview(card.id, false)

    setStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }))

    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setSessionState('completed')
    }
  }, [sessionCards, currentIndex, onUpdateReview])

  // Reset to start screen
  const handleReset = useCallback(() => {
    setSessionState('idle')
    setCurrentIndex(0)
    setSessionCards([])
    setStats({ total: 0, correct: 0, incorrect: 0 })
  }, [])

  // Navigation in review mode
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, sessionCards.length])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Lernkarten</h3>
        <p className="text-muted-foreground text-sm">
          Erstelle Lernkarten, indem du Text im Dokument markierst und "Lernkarte erstellen" wählst.
        </p>
      </GlassCard>
    )
  }

  // Session start screen
  if (sessionState === 'idle') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Lernkarten</h2>
              <p className="text-sm text-muted-foreground">
                {flashcards.length} Karten insgesamt
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-500">
              {flashcards.length}
            </div>
            <div className="text-xs text-muted-foreground">Gesamt</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {dueForReview.length}
            </div>
            <div className="text-xs text-muted-foreground">Zur Wiederholung</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {newCards.length}
            </div>
            <div className="text-xs text-muted-foreground">Neu</div>
          </GlassCard>
        </div>

        {/* Learning mode selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Lernmodus wählen</h3>

          <button
            onClick={() => startSession('review')}
            disabled={dueForReview.length === 0}
            className={cn(
              'w-full p-4 rounded-xl border transition-all text-left',
              'hover:border-amber-500/50 hover:bg-amber-500/5',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-border'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  Wiederholung
                  {dueForReview.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                      {dueForReview.length} fällig
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Karten die zur Wiederholung anstehen
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          <button
            onClick={() => startSession('new')}
            disabled={newCards.length === 0}
            className={cn(
              'w-full p-4 rounded-xl border transition-all text-left',
              'hover:border-green-500/50 hover:bg-green-500/5',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-border'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  Neue Karten
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    {newCards.length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Noch nicht gelernte Karten
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          <button
            onClick={() => startSession('all')}
            className={cn(
              'w-full p-4 rounded-xl border transition-all text-left',
              'hover:border-teal-500/50 hover:bg-teal-500/5',
              'border-border'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-teal-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Alle Karten</div>
                <div className="text-sm text-muted-foreground">
                  Alle {flashcards.length} Karten durchgehen
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Learning session
  if (sessionState === 'learning' && sessionCards.length > 0) {
    const currentCard = sessionCards[currentIndex]

    return (
      <div className="space-y-6">
        {/* Header with progress */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            Beenden
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-medium">{stats.correct}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <X className="w-4 h-4 text-red-500" />
              <span className="text-red-500 font-medium">{stats.incorrect}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <FlashcardViewer
              flashcard={currentCard}
              onCorrect={handleCorrect}
              onIncorrect={handleIncorrect}
              currentIndex={currentIndex}
              totalCount={sessionCards.length}
              showNavigation={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // Completion screen
  if (sessionState === 'completed') {
    const percentage = stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-teal-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Geschafft!</h2>
          <p className="text-muted-foreground">
            Du hast alle {stats.total} Karten durchgearbeitet
          </p>
        </div>

        {/* Stats */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-500">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Karten</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{stats.correct}</div>
              <div className="text-sm text-muted-foreground">Richtig</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{stats.incorrect}</div>
              <div className="text-sm text-muted-foreground">Falsch</div>
            </div>
          </div>

          {/* Success rate bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Erfolgsquote</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full',
                  percentage >= 80 ? 'bg-green-500' :
                  percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Erneut lernen
          </Button>
          {onClose && (
            <Button onClick={onClose}>
              Fertig
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return null
}
