'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Copy,
  Check,
  ChevronDown,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { scaleIn } from '@/lib/animations'

interface AIAssistantProps {
  /** Selected text to analyze */
  selectedText: string
  /** Whether the assistant is visible */
  visible: boolean
  /** Close callback */
  onClose: () => void
  /** Position for floating mode */
  position?: { x: number; y: number }
  /** Tablet mode for larger touch targets */
  isTabletMode?: boolean
  /** Save response as note callback */
  onSaveAsNote?: (content: string, textSelection: string) => void
}

interface QuickPrompt {
  id: string
  label: string
  icon: React.ReactNode
  prompt: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'explain-simple',
    label: 'Einfach erklären',
    icon: <Lightbulb className="w-4 h-4" />,
    prompt: 'Erkläre in 2-3 Sätzen einfach:',
  },
  {
    id: 'summarize',
    label: 'Zusammenfassen',
    icon: <BookOpen className="w-4 h-4" />,
    prompt: 'Fasse in 1-2 Sätzen zusammen:',
  },
  {
    id: 'examples',
    label: 'Beispiel',
    icon: <MessageCircle className="w-4 h-4" />,
    prompt: 'Gib ein kurzes praktisches Beispiel:',
  },
]

export function AIAssistant({
  selectedText,
  visible,
  onClose,
  position,
  isTabletMode = false,
  onSaveAsNote,
}: AIAssistantProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  // Focus input when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  // Scroll to bottom of response
  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || !selectedText.trim()) return

      setIsLoading(true)
      setError(null)
      setResponse('')
      setShowQuickPrompts(false)

      try {
        const fullPrompt = `${prompt}\n\n"${selectedText}"`

        const res = await fetch('/api/ai/explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            selectedText,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || `API error: ${res.status}`)
        }

        // Handle streaming response
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response stream')
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          setResponse((prev) => prev + text)
        }
      } catch (err) {
        console.error('AI error:', err)
        setError(
          err instanceof Error ? err.message : 'KI-Anfrage fehlgeschlagen'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [selectedText]
  )

  const handleQuickPrompt = useCallback(
    (prompt: QuickPrompt) => {
      handleSubmit(prompt.prompt)
    },
    [handleSubmit]
  )

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSubmit(customPrompt)
      setCustomPrompt('')
    },
    [customPrompt, handleSubmit]
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [response])

  const handleSaveAsNote = useCallback(() => {
    if (onSaveAsNote && response) {
      onSaveAsNote(response, selectedText)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }, [onSaveAsNote, response, selectedText])

  const handleReset = useCallback(() => {
    setResponse('')
    setError(null)
    setShowQuickPrompts(true)
    setCustomPrompt('')
  }, [])

  // Calculate position styles
  const positionStyles = position
    ? {
        position: 'fixed' as const,
        left: Math.min(position.x, window.innerWidth - 420),
        top: Math.min(position.y + 16, window.innerHeight - 500),
        zIndex: 50,
      }
    : {}

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            style={positionStyles}
            className={cn(
              position
                ? ''
                : 'fixed inset-x-4 top-1/4 z-50 mx-auto max-w-md',
              'z-50'
            )}
          >
            <GlassCard
              variant="elevated"
              className="w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">KI-Assistent</h3>
                    <p className="text-xs text-muted-foreground">
                      Frage mich zum markierten Text
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected text preview */}
              <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Markierter Text:
                </p>
                <p className="text-sm italic line-clamp-3">"{selectedText}"</p>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[300px] overflow-y-auto" ref={responseRef}>
                {/* Quick prompts */}
                {showQuickPrompts && !response && !isLoading && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Wähle eine Aktion:
                    </p>
                    {QUICK_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt.id}
                        variant="outline"
                        size={isTabletMode ? 'touch' : 'default'}
                        className="w-full justify-start gap-3"
                        onClick={() => handleQuickPrompt(prompt)}
                      >
                        <span className="text-purple-500">{prompt.icon}</span>
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm">KI denkt nach...</span>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Response */}
                {response && (
                  <div className="space-y-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{response}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            Kopiert
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Kopieren
                          </>
                        )}
                      </Button>
                      {onSaveAsNote && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveAsNote}
                          className="gap-2"
                        >
                          {saved ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              Gespeichert
                            </>
                          ) : (
                            <>
                              <StickyNote className="w-4 h-4" />
                              Als Notiz
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                      >
                        Neue Frage
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom prompt input */}
              <form
                onSubmit={handleCustomSubmit}
                className="p-4 border-t border-border/50"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Eigene Frage stellen..."
                    className={cn(
                      'flex-1 min-h-[60px] max-h-[120px] p-3 rounded-lg',
                      'bg-muted/50 border border-input',
                      'resize-none text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                      isTabletMode && 'min-h-[80px] text-base'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleCustomSubmit(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="premium"
                    size={isTabletMode ? 'icon-touch' : 'icon'}
                    disabled={!customPrompt.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    ⌘/Ctrl + Enter
                  </kbd>{' '}
                  zum Senden
                </p>
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
