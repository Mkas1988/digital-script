'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseElevenLabsOptions {
  /** Voice ID or name (default: Jennifer Meyer) */
  voiceId?: string
  /** Model ID (default: eleven_multilingual_v2) */
  modelId?: string
  /** Stability (0-1, default: 0.5) */
  stability?: number
  /** Similarity boost (0-1, default: 0.75) */
  similarityBoost?: number
  /** Auto-play when text changes */
  autoPlay?: boolean
}

interface UseElevenLabsReturn {
  /** Play/resume audio */
  play: (text?: string) => Promise<void>
  /** Pause audio */
  pause: () => void
  /** Stop and reset */
  stop: () => void
  /** Skip to next paragraph */
  skipForward: () => void
  /** Go to previous paragraph */
  skipBackward: () => void
  /** Current playback state */
  isPlaying: boolean
  /** Loading state */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Current paragraph index being spoken */
  currentParagraph: number
  /** Set the text to be spoken (paragraphs separated by \n\n) */
  setText: (text: string) => void
  /** Progress (0-1) */
  progress: number
}

// Jennifer Meyer voice ID on ElevenLabs
const JENNIFER_MEYER_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'

/**
 * Hook for ElevenLabs text-to-speech integration
 * Provides streaming audio playback with paragraph tracking
 */
export function useElevenLabs(
  options: UseElevenLabsOptions = {}
): UseElevenLabsReturn {
  const {
    voiceId = JENNIFER_MEYER_VOICE_ID,
    modelId = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paragraphs, setParagraphs] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentTextRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
      audioRef.current.volume = 1.0 // Maximum volume
      audioRef.current.addEventListener('ended', handleAudioEnded)
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
      audioRef.current.addEventListener('error', handleAudioError)

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleAudioEnded)
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
          audioRef.current.removeEventListener('error', handleAudioError)
          audioRef.current.pause()
          audioRef.current = null
        }
        abortControllerRef.current?.abort()
      }
    }
  }, [])

  const handleAudioEnded = useCallback(() => {
    // Move to next paragraph
    setCurrentParagraph((prev) => {
      const next = prev + 1
      if (next < paragraphs.length) {
        // Auto-play next paragraph
        playParagraph(next)
        return next
      } else {
        // Finished all paragraphs
        setIsPlaying(false)
        setProgress(1)
        return prev
      }
    })
  }, [paragraphs.length])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      const paragraphProgress =
        audioRef.current.currentTime / audioRef.current.duration
      const overallProgress =
        (currentParagraph + paragraphProgress) / Math.max(paragraphs.length, 1)
      setProgress(overallProgress)
    }
  }, [currentParagraph, paragraphs.length])

  const handleAudioError = useCallback((e: Event) => {
    console.error('Audio error:', e)
    setError('Audio playback error')
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  /**
   * Generate speech for a single paragraph using ElevenLabs API
   */
  const generateSpeech = useCallback(
    async (text: string): Promise<Blob | null> => {
      try {
        abortControllerRef.current?.abort()
        abortControllerRef.current = new AbortController()

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk_effe7457eb8146f4b003ccc6bf4b581ad540538e19bf587b',
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
              },
            }),
            signal: abortControllerRef.current.signal,
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.detail?.message || `API error: ${response.status}`
          )
        }

        const blob = await response.blob()
        return blob
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null
        }
        throw err
      }
    },
    [voiceId, modelId, stability, similarityBoost]
  )

  /**
   * Play a specific paragraph
   */
  const playParagraph = useCallback(
    async (index: number) => {
      if (index < 0 || index >= paragraphs.length) return

      setIsLoading(true)
      setError(null)

      try {
        const text = paragraphs[index]
        if (!text.trim()) {
          // Skip empty paragraphs
          handleAudioEnded()
          return
        }

        const audioBlob = await generateSpeech(text)
        if (!audioBlob) return // Aborted

        if (audioRef.current) {
          const url = URL.createObjectURL(audioBlob)
          audioRef.current.src = url
          audioRef.current.volume = 1.0 // Ensure maximum volume
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('TTS error:', err)
        setError(err instanceof Error ? err.message : 'TTS failed')
        setIsPlaying(false)
      } finally {
        setIsLoading(false)
      }
    },
    [paragraphs, generateSpeech, handleAudioEnded]
  )

  /**
   * Set the text to be spoken
   */
  const setText = useCallback((text: string) => {
    currentTextRef.current = text
    const paras = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
    setParagraphs(paras)
    setCurrentParagraph(0)
    setProgress(0)
  }, [])

  /**
   * Start or resume playback
   */
  const play = useCallback(
    async (text?: string) => {
      if (text) {
        setText(text)
        setCurrentParagraph(0)
        await playParagraph(0)
      } else if (audioRef.current?.paused && audioRef.current.src) {
        // Resume
        await audioRef.current.play()
        setIsPlaying(true)
      } else {
        // Start from current paragraph
        await playParagraph(currentParagraph)
      }
    },
    [setText, playParagraph, currentParagraph]
  )

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  /**
   * Stop and reset
   */
  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    setIsLoading(false)
    setCurrentParagraph(0)
    setProgress(0)
  }, [])

  /**
   * Skip to next paragraph
   */
  const skipForward = useCallback(() => {
    const next = currentParagraph + 1
    if (next < paragraphs.length) {
      setCurrentParagraph(next)
      if (isPlaying) {
        playParagraph(next)
      }
    }
  }, [currentParagraph, paragraphs.length, isPlaying, playParagraph])

  /**
   * Go to previous paragraph
   */
  const skipBackward = useCallback(() => {
    const prev = currentParagraph - 1
    if (prev >= 0) {
      setCurrentParagraph(prev)
      if (isPlaying) {
        playParagraph(prev)
      }
    }
  }, [currentParagraph, isPlaying, playParagraph])

  return {
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
  }
}
