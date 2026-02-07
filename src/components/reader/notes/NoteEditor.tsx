'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, PenTool, Keyboard, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { scaleIn } from '@/lib/animations'

interface NoteEditorProps {
  /** Initial content for editing existing note */
  initialContent?: string
  /** Selected text that prompted the note */
  selectedText?: string
  /** Whether in tablet mode */
  isTabletMode?: boolean
  /** Callback when note is saved */
  onSave: (content: string) => Promise<void>
  /** Callback when editor is closed */
  onClose: () => void
  /** Callback when note is deleted (only for existing notes) */
  onDelete?: () => Promise<void>
  /** Position for floating editor */
  position?: { x: number; y: number }
  /** Whether editor is visible */
  visible: boolean
}

type InputMode = 'keyboard' | 'handwriting' | 'voice'

export function NoteEditor({
  initialContent = '',
  selectedText,
  isTabletMode = false,
  onSave,
  onClose,
  onDelete,
  position,
  visible,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [inputMode, setInputMode] = useState<InputMode>('keyboard')
  const [isSaving, setIsSaving] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Drawing state for handwriting
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Focus textarea on open
  useEffect(() => {
    if (visible && inputMode === 'keyboard' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [visible, inputMode])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // Setup canvas for handwriting
  useEffect(() => {
    if (inputMode === 'handwriting' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [inputMode])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    if (visible) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose, content])

  // Handle save
  const handleSave = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      await onSave(content.trim())
      onClose()
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return

    setIsSaving(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      console.error('Failed to delete note:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Voice input handling
  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt.')
      return
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'de-DE'

    recognitionRef.current.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setContent((prev) => prev + transcript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.start()
    setIsRecording(true)
  }, [])

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // Canvas drawing handlers for tablet handwriting
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDrawing(true)
      lastPointRef.current = { x, y }
    },
    []
  )

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !canvasRef.current || !lastPointRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Use pressure for pen input
      const pressure = e.pressure || 0.5
      ctx.lineWidth = 2 + pressure * 4

      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(x, y)
      ctx.stroke()

      lastPointRef.current = { x, y }
    },
    [isDrawing]
  )

  const handleCanvasPointerUp = useCallback(() => {
    setIsDrawing(false)
    lastPointRef.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [])

  // Calculate position
  const editorStyle = position
    ? {
        position: 'fixed' as const,
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.min(position.y + 10, window.innerHeight - 300),
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

          {/* Editor */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            style={editorStyle}
            className={cn(
              position ? '' : 'fixed inset-x-4 top-1/4 z-50 mx-auto max-w-lg',
              'z-50'
            )}
          >
            <GlassCard variant="elevated" className="p-4 w-full max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {initialContent ? 'Notiz bearbeiten' : 'Neue Notiz'}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Input mode toggle (tablet only) */}
                  {isTabletMode && (
                    <div className="flex items-center gap-1 mr-2">
                      <Button
                        variant={inputMode === 'keyboard' ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setInputMode('keyboard')}
                        title="Tastatur"
                      >
                        <Keyboard className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={inputMode === 'handwriting' ? 'secondary' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setInputMode('handwriting')}
                        title="Handschrift (Pencil)"
                      >
                        <PenTool className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Selected text preview */}
              {selectedText && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Markierter Text:
                  </p>
                  <p className="text-sm italic line-clamp-2">"{selectedText}"</p>
                </div>
              )}

              {/* Input area */}
              {inputMode === 'keyboard' && (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Notiz eingeben..."
                    className={cn(
                      'w-full min-h-[120px] max-h-[300px] p-3 rounded-lg',
                      'bg-background border border-input',
                      'resize-none focus:outline-none focus:ring-2 focus:ring-ring',
                      'text-sm leading-relaxed',
                      isTabletMode && 'min-h-[160px] text-base'
                    )}
                  />
                  {/* Voice input button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      'absolute bottom-2 right-2',
                      isRecording && 'text-red-500'
                    )}
                    onClick={isRecording ? stopVoiceInput : startVoiceInput}
                    title={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe'}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {inputMode === 'handwriting' && (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className={cn(
                      'w-full h-[200px] rounded-lg border border-input bg-white',
                      'cursor-crosshair touch-none'
                    )}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearCanvas}
                  >
                    Löschen
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Mit Apple Pencil schreiben. Handschrifterkennung wird
                    automatisch durchgeführt.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <div>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size={isTabletMode ? 'touch-sm' : 'sm'}
                      className="text-destructive hover:text-destructive"
                      onClick={handleDelete}
                      disabled={isSaving}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size={isTabletMode ? 'touch-sm' : 'sm'}
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="premium"
                    size={isTabletMode ? 'touch-sm' : 'sm'}
                    onClick={handleSave}
                    disabled={!content.trim() || isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </div>

              {/* Keyboard shortcut hint (desktop only) */}
              {!isTabletMode && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    ⌘/Ctrl + S
                  </kbd>{' '}
                  zum Speichern,{' '}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>{' '}
                  zum Schließen
                </p>
              )}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}
