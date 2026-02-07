'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Sparkles, Check, Edit3, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard } from '@/components/ui/glass-card'
import { scaleIn } from '@/lib/animations'

interface FlashcardGeneratorProps {
  visible: boolean
  selectedText: string
  onClose: () => void
  onSave: (question: string, answer: string) => Promise<void>
  isTabletMode?: boolean
}

/**
 * Modal component for generating flashcards from selected text
 */
export function FlashcardGenerator({
  visible,
  selectedText,
  onClose,
  onSave,
  isTabletMode = false,
}: FlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Generate flashcard using AI
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Generieren')
      }

      const data = await response.json()
      setQuestion(data.question)
      setAnswer(data.answer)
    } catch (err) {
      console.error('Failed to generate flashcard:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Generieren')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedText])

  // Save flashcard
  const handleSave = useCallback(async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Frage und Antwort sind erforderlich')
      return
    }

    setIsSaving(true)
    try {
      await onSave(question.trim(), answer.trim())
      // Reset state
      setQuestion('')
      setAnswer('')
      setError(null)
      setIsEditing(false)
      onClose()
    } catch (err) {
      console.error('Failed to save flashcard:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }, [question, answer, onSave, onClose])

  // Close and reset
  const handleClose = useCallback(() => {
    setQuestion('')
    setAnswer('')
    setError(null)
    setIsEditing(false)
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed z-50',
              'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-lg',
              'bg-white dark:bg-gray-900',
              'rounded-2xl shadow-2xl',
              'border border-gray-200/50 dark:border-gray-700/50',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="font-semibold">Lernkarte erstellen</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Selected text preview */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Ausgewählter Text
                </label>
                <GlassCard variant="default" className="p-3">
                  <p className="text-sm line-clamp-3 text-muted-foreground italic">
                    "{selectedText}"
                  </p>
                </GlassCard>
              </div>

              {/* Generate button (if not yet generated) */}
              {!question && !answer && (
                <Button
                  variant="premium"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generiere Lernkarte...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mit KI generieren
                    </>
                  )}
                </Button>
              )}

              {/* Question and Answer fields */}
              {(question || answer || isEditing) && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Frage
                      </label>
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Bearbeiten
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Gib die Frage ein..."
                        rows={2}
                        className={isTabletMode ? 'text-base' : ''}
                      />
                    ) : (
                      <GlassCard variant="default" className="p-3">
                        <p className="text-sm">{question}</p>
                      </GlassCard>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Antwort
                    </label>
                    {isEditing ? (
                      <Textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Gib die Antwort ein..."
                        rows={3}
                        className={isTabletMode ? 'text-base' : ''}
                      />
                    ) : (
                      <GlassCard variant="default" className="p-3">
                        <p className="text-sm">{answer}</p>
                      </GlassCard>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Neu generieren
                        </>
                      )}
                    </Button>
                    <Button
                      variant="premium"
                      className="flex-1"
                      onClick={handleSave}
                      disabled={isSaving || !question.trim() || !answer.trim()}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Speichern
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Error message */}
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
