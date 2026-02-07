'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  Loader2,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useElevenLabs } from '@/hooks/useElevenLabs'

interface TextToSpeechProps {
  text: string
  /** Optional: selected text to read instead of full section */
  selectedText?: string
  onParagraphChange?: (index: number | null) => void
  /** Optional: use tablet-optimized touch targets */
  isTabletMode?: boolean
}

export function TextToSpeech({
  text,
  selectedText,
  onParagraphChange,
  isTabletMode = false,
}: TextToSpeechProps) {
  // Track what text was used when playback started
  const [lockedText, setLockedText] = useState<string | null>(null)
  const lastSelectedTextRef = useRef<string | null>(null)

  // Keep track of the last non-empty selected text
  useEffect(() => {
    if (selectedText?.trim()) {
      lastSelectedTextRef.current = selectedText
    }
  }, [selectedText])

  // Determine which text to actually read
  // When playing, use locked text; otherwise show what would be read
  const textToRead = lockedText ?? text

  // Check if there's currently a selection (for UI indication)
  const hasSelection = !!selectedText?.trim() || !!lastSelectedTextRef.current

  const {
    play,
    pause,
    stop,
    skipForward,
    skipBackward,
    isPlaying,
    isLoading,
    error,
    currentParagraph,
    setText,
    progress,
  } = useElevenLabs()

  // Split text into paragraphs for counting
  const paragraphs = useMemo(() => {
    return textToRead
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }, [textToRead])

  // Update text when it changes (only if not currently playing)
  useEffect(() => {
    if (!isPlaying && !lockedText) {
      setText(text)
    }
  }, [text, setText, isPlaying, lockedText])

  // Notify parent of paragraph changes and clear locked text when playback ends
  useEffect(() => {
    if (isPlaying) {
      onParagraphChange?.(currentParagraph)
    } else {
      onParagraphChange?.(null)
      // Clear locked text when playback finishes naturally
      if (lockedText && progress >= 0.99) {
        setLockedText(null)
      }
    }
  }, [isPlaying, currentParagraph, onParagraphChange, lockedText, progress])

  // Get current browser selection text
  const getBrowserSelection = useCallback(() => {
    if (typeof window === 'undefined') return null
    const selection = window.getSelection()
    const selectionText = selection?.toString().trim()
    return selectionText && selectionText.length > 0 ? selectionText : null
  }, [])

  // Store selection on mouse down (before click clears it)
  const pendingSelectionRef = useRef<string | null>(null)

  const handleMouseDown = useCallback(() => {
    // Capture selection BEFORE the click event clears it
    // Priority: 1. Browser selection in the document, 2. selectedText prop, 3. lastSelectedTextRef
    const browserSelection = getBrowserSelection()
    if (browserSelection) {
      pendingSelectionRef.current = browserSelection
    } else if (selectedText?.trim()) {
      // If browser selection is empty (e.g., already cleared), use the prop
      pendingSelectionRef.current = selectedText.trim()
    } else if (lastSelectedTextRef.current) {
      // Fallback to last known selection
      pendingSelectionRef.current = lastSelectedTextRef.current
    }
  }, [getBrowserSelection, selectedText])

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause()
    } else {
      // When starting playback, capture the text to read
      // Priority: 1. Selection captured on mousedown, 2. Current selectedText prop, 3. Last known selection, 4. Full section text
      const capturedOnMouseDown = pendingSelectionRef.current
      const currentSelectedText = selectedText?.trim() || null
      const textToUse = capturedOnMouseDown || currentSelectedText || lastSelectedTextRef.current || text

      // Lock this text for the duration of playback
      setLockedText(textToUse)
      setText(textToUse)

      // Clear the pending selection
      pendingSelectionRef.current = null

      // Clear the last selected text ref after using it
      if (!capturedOnMouseDown && !currentSelectedText && lastSelectedTextRef.current) {
        lastSelectedTextRef.current = null
      }

      await play()
    }
  }

  const handleStop = () => {
    stop()
    setLockedText(null) // Release the locked text
    lastSelectedTextRef.current = null // Clear selection memory
    onParagraphChange?.(null)
  }

  // Calculate progress percentage
  const progressPercent = Math.round(progress * 100)

  // Button size based on mode
  const buttonSize = isTabletMode ? 'icon-touch' : 'icon-sm'

  return (
    <div className="flex items-center gap-2">
      {/* Skip backward */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={skipBackward}
        disabled={currentParagraph === 0 || isLoading}
        title="Vorheriger Absatz"
        className="text-muted-foreground hover:text-foreground"
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      {/* Play/Pause button */}
      <Button
        variant={isPlaying ? 'secondary' : hasSelection ? 'default' : 'premium'}
        size={isTabletMode ? 'touch-sm' : 'sm'}
        onMouseDown={handleMouseDown}
        onClick={handlePlayPause}
        disabled={paragraphs.length === 0 || isLoading}
        className={cn(
          'gap-2 min-w-[100px]',
          isPlaying && 'bg-brand-500/20 hover:bg-brand-500/30',
          hasSelection && !isPlaying && 'bg-amber-500 hover:bg-amber-600 text-white'
        )}
        title={hasSelection && !isPlaying ? 'Markierten Text vorlesen' : 'Abschnitt vorlesen'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Laden...</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : hasSelection ? (
          <>
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Auswahl</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Vorlesen</span>
          </>
        )}
      </Button>

      {/* Stop button */}
      {(isPlaying || currentParagraph > 0) && (
        <Button
          variant="ghost"
          size={buttonSize}
          onClick={handleStop}
          title="Stoppen"
          className="text-muted-foreground hover:text-foreground"
        >
          <Square className="w-4 h-4" />
        </Button>
      )}

      {/* Skip forward */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={skipForward}
        disabled={currentParagraph >= paragraphs.length - 1 || isLoading}
        title="Nächster Absatz"
        className="text-muted-foreground hover:text-foreground"
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      {/* Progress indicator */}
      {(isPlaying || currentParagraph > 0) && (
        <div className="flex items-center gap-2 ml-2">
          <Volume2 className="w-4 h-4 text-brand-500" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">
              {currentParagraph + 1}/{paragraphs.length}
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <span className="text-xs text-destructive ml-2" title={error}>
          Fehler
        </span>
      )}

      {/* Jennifer Meyer voice badge */}
      <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2 py-1 bg-muted/50 rounded-full">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Jennifer Meyer</span>
      </div>
    </div>
  )
}
