'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Highlighter,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Settings,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toolbarReveal } from '@/lib/animations'

interface TabletToolbarProps {
  /** Callback when sidebar toggle is pressed */
  onSidebarToggle: () => void
  /** Callback when highlight mode is toggled */
  onHighlightToggle?: () => void
  /** Callback when text-to-speech is toggled */
  onTextToSpeechToggle?: () => void
  /** Callback to go to previous section */
  onPrevSection?: () => void
  /** Callback to go to next section */
  onNextSection?: () => void
  /** Callback when settings is pressed */
  onSettings?: () => void
  /** Whether TTS is currently active */
  isSpeaking?: boolean
  /** Whether highlight sidebar is open */
  isHighlightOpen?: boolean
  /** Current section number */
  currentSection?: number
  /** Total sections */
  totalSections?: number
  /** Whether toolbar is visible */
  visible?: boolean
  /** Auto-hide on scroll (default: true) */
  autoHide?: boolean
}

export function TabletToolbar({
  onSidebarToggle,
  onHighlightToggle,
  onTextToSpeechToggle,
  onPrevSection,
  onNextSection,
  onSettings,
  isSpeaking = false,
  isHighlightOpen = false,
  currentSection,
  totalSections,
  visible = true,
  autoHide = true,
}: TabletToolbarProps) {
  const [isVisible, setIsVisible] = useState(visible)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  // Handle scroll-based visibility
  useEffect(() => {
    if (!autoHide) {
      setIsVisible(visible)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY

      // Show toolbar after scroll stops
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [autoHide, visible])

  // Sync with prop
  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toolbarReveal}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-2',
            'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
            'rounded-full shadow-xl',
            'border border-gray-200/50 dark:border-gray-700/50',
            'px-3 py-2'
          )}
        >
          {/* Menu / Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-11 w-11 rounded-full touch-target"
            aria-label="Inhaltsverzeichnis öffnen"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Section navigation */}
          {onPrevSection && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevSection}
              disabled={currentSection === 1}
              className="h-11 w-11 rounded-full touch-target"
              aria-label="Vorheriger Abschnitt"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
          )}

          {/* Section indicator */}
          {currentSection && totalSections && (
            <div className="flex items-center gap-1 px-3 min-w-[60px] justify-center">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {currentSection}/{totalSections}
              </span>
            </div>
          )}

          {onNextSection && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextSection}
              disabled={currentSection === totalSections}
              className="h-11 w-11 rounded-full touch-target"
              aria-label="Nächster Abschnitt"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Highlight toggle */}
          {onHighlightToggle && (
            <Button
              variant={isHighlightOpen ? 'secondary' : 'ghost'}
              size="icon"
              onClick={onHighlightToggle}
              className="h-11 w-11 rounded-full touch-target"
              aria-label="Markierungen"
            >
              <Highlighter className="w-5 h-5" />
            </Button>
          )}

          {/* Text-to-speech toggle */}
          {onTextToSpeechToggle && (
            <Button
              variant={isSpeaking ? 'secondary' : 'ghost'}
              size="icon"
              onClick={onTextToSpeechToggle}
              className="h-11 w-11 rounded-full touch-target"
              aria-label={isSpeaking ? 'Vorlesen stoppen' : 'Vorlesen'}
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Settings */}
          {onSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              className="h-11 w-11 rounded-full touch-target"
              aria-label="Einstellungen"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
