'use client'

import { forwardRef, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ZoomIn,
  Sparkles,
  BookOpen,
  Target,
  ClipboardCheck,
  Lightbulb,
  HelpCircle,
  Info,
  FileText,
  Quote,
  AlertTriangle,
  PenTool,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  Library,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'
import { HighlightedText } from './highlighting/HighlightedText'
import { HighlightPopup } from './highlighting/HighlightPopup'
import type { Section, DocumentImage, Annotation, SectionType, SectionMetadata } from '@/lib/supabase/types'
import type { Note } from '@/hooks/useNotes'

// Section type styles for Studienbrief elements
// Based on FOM Corporate Design Hochschulbereichsfarben
const sectionTypeStyles: Record<SectionType, string> = {
  chapter: '',
  subchapter: '',
  // Lernziele: Spezielles Design mit Rahmen wie im Studienbrief-Screenshot
  learning_objectives: '', // Handled separately with special layout
  // Aufgaben: IT Management Blau (#0091C6)
  task: 'bg-cyan-50 dark:bg-cyan-900/20 border-l-4 border-cyan-600 pl-4 rounded-r-lg',
  // Praxisimpuls: Gesundheit & Soziales Lila (#910CC1)
  practice_impulse: 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-600 pl-4 rounded-r-lg',
  // Reflexion: Wirtschaft & Recht Orange (#DD9F1F)
  reflection: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 pl-4 rounded-r-lg',
  // Hinweis/Tipp: Spezielles Design mit Notizblock-Icon wie im Studienbrief
  tip: '', // Handled separately with special layout
  // Zusammenfassung: Neutral
  summary: 'bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 pl-4 rounded-r-lg',
  // Definition: Ingenieurwesen Dunkelblau (#003A72)
  definition: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-800 pl-4 rounded-r-lg',
  // Beispiel: Spezielles Design mit Zahnrad-Icon wie im Studienbrief
  example: '', // Handled separately with special layout
  // Wichtig: Spezielles Design mit Rahmen rundherum (wie im Studienbrief-Screenshot)
  important: '', // Handled separately with special layout
  // Übungsaufgabe: Spezielles Design mit Klemmbrett-Icon wie im Studienbrief
  exercise: '', // Handled separately with special layout
  // Lösung: Grün für erfolgreiche Lösung
  solution: 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 pl-4 rounded-r-lg',
  // Verweis/Link: Neutral mit Akzent
  reference: 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 pl-4 rounded-r-lg',
}

const sectionTypeIcons: Partial<Record<SectionType, LucideIcon>> = {
  learning_objectives: Target,
  task: ClipboardCheck,
  practice_impulse: Lightbulb,
  reflection: HelpCircle,
  tip: Info,
  summary: FileText,
  definition: BookOpen,
  example: Quote,
  important: AlertTriangle,
  exercise: PenTool,
  solution: CheckCircle2,
  reference: ExternalLink,
}

const sectionTypeLabels: Partial<Record<SectionType, string>> = {
  learning_objectives: 'Lernziele',
  task: 'Aufgabe',
  practice_impulse: 'Praxisimpuls',
  reflection: 'Reflexion',
  tip: 'Hinweis',
  summary: 'Zusammenfassung',
  definition: 'Definition',
  example: 'Beispiel',
  important: 'Wichtig',
  exercise: 'Übungsaufgabe',
  solution: 'Lösung',
  reference: 'Verweis',
}

// FOM Corporate Design colors for icons
const sectionTypeIconColors: Partial<Record<SectionType, string>> = {
  learning_objectives: 'text-lime-600 dark:text-lime-400',      // Wirtschaft & Management
  task: 'text-cyan-600 dark:text-cyan-400',                     // IT Management
  practice_impulse: 'text-violet-600 dark:text-violet-400',     // Gesundheit & Soziales
  reflection: 'text-amber-600 dark:text-amber-400',             // Wirtschaft & Recht
  tip: 'text-teal-600 dark:text-teal-400',                      // FOM Grün
  summary: 'text-slate-600 dark:text-slate-400',                // Neutral
  definition: 'text-blue-800 dark:text-blue-400',               // Ingenieurwesen
  example: 'text-cyan-600 dark:text-cyan-400',                  // Beispiel Cyan
  important: 'text-red-600 dark:text-red-400',                  // Wichtig Rot
  exercise: 'text-orange-600 dark:text-orange-400',             // Übungsaufgabe Orange
  solution: 'text-emerald-600 dark:text-emerald-400',           // Lösung Grün
  reference: 'text-indigo-600 dark:text-indigo-400',            // Verweis Indigo
}

interface SectionViewProps {
  section: Section
  isActive: boolean
  speakingParagraph: number | null
  sectionIndex?: number
  highlights?: Annotation[]
  notes?: Note[]
  onCreateHighlight?: (color: string) => Promise<void>
  onDeleteHighlight?: (id: string) => Promise<boolean | void>
  onAddNote?: () => void
  onAskAI?: () => void
  onCreateFlashcard?: () => void
  onNoteClick?: (note: Note) => void
  selectionRect?: DOMRect | null
  hasSelection?: boolean
  // Solution section for exercises (collapsed by default)
  solutionSection?: Section | null
  // Bookmark functionality
  isBookmarked?: boolean
  onToggleBookmark?: () => void
  // Edit mode functionality
  isEditMode?: boolean
  onEdit?: () => void
}

export const SectionView = forwardRef<HTMLElement, SectionViewProps>(
  function SectionView(
    {
      section,
      isActive,
      speakingParagraph,
      sectionIndex,
      highlights = [],
      notes = [],
      onCreateHighlight,
      onDeleteHighlight,
      onAddNote,
      onAskAI,
      onCreateFlashcard,
      onNoteClick,
      selectionRect,
      hasSelection,
      solutionSection,
      isBookmarked = false,
      onToggleBookmark,
      isEditMode = false,
      onEdit,
    },
    ref
  ) {
    const [lightboxImage, setLightboxImage] = useState<DocumentImage | null>(null)
    const [activeHighlight, setActiveHighlight] = useState<Annotation | null>(null)
    const [highlightPopupPosition, setHighlightPopupPosition] = useState<{
      x: number
      y: number
    } | null>(null)
    // State for collapsible solution
    const [solutionExpanded, setSolutionExpanded] = useState(false)
    // State for collapsible AI summary
    const [aiSummaryExpanded, setAiSummaryExpanded] = useState(false)

    // Check if content contains markdown tables
    const hasMarkdownTable = useMemo(() => {
      return /\|.*\|.*\n\|[-:| ]+\|/m.test(section.content)
    }, [section.content])

    // Split content into paragraphs
    const paragraphs = useMemo(() => {
      return section.content
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    }, [section.content])

    // Calculate which highlights belong to which paragraph
    const paragraphHighlights = useMemo(() => {
      const result: Map<number, Annotation[]> = new Map()
      let charOffset = 0

      paragraphs.forEach((para, index) => {
        const paraStart = charOffset
        const paraEnd = charOffset + para.length
        charOffset = paraEnd + 2 // +2 for the \n\n separator

        const paraHighlights = highlights.filter((h) => {
          const hStart = h.position_start || 0
          const hEnd = h.position_end || 0
          // Check if highlight overlaps with this paragraph
          return hStart < paraEnd && hEnd > paraStart
        }).map((h) => ({
          ...h,
          // Adjust positions relative to paragraph
          position_start: Math.max(0, (h.position_start || 0) - paraStart),
          position_end: Math.min(para.length, (h.position_end || 0) - paraStart),
        }))

        if (paraHighlights.length > 0) {
          result.set(index, paraHighlights)
        }
      })

      return result
    }, [paragraphs, highlights])

    // Calculate which notes belong to which paragraph (for inline indicators)
    const paragraphNotes = useMemo(() => {
      const result: Map<number, Note[]> = new Map()
      let charOffset = 0

      paragraphs.forEach((para, index) => {
        const paraStart = charOffset
        const paraEnd = charOffset + para.length
        charOffset = paraEnd + 2 // +2 for the \n\n separator

        const paraNotes = notes.filter((n) => {
          // Only include notes that have position data
          if (n.position_start === null || n.position_end === null) return false
          const nStart = n.position_start || 0
          const nEnd = n.position_end || 0
          // Check if note overlaps with this paragraph
          return nStart < paraEnd && nEnd > paraStart
        }).map((n) => ({
          ...n,
          // Adjust positions relative to paragraph
          position_start: Math.max(0, (n.position_start || 0) - paraStart),
          position_end: Math.min(para.length, (n.position_end || 0) - paraStart),
        }))

        if (paraNotes.length > 0) {
          result.set(index, paraNotes)
        }
      })

      return result
    }, [paragraphs, notes])

    // Get images for this section (parse from JSON if needed)
    const sectionImages: DocumentImage[] = Array.isArray(section.images)
      ? (section.images as DocumentImage[])
      : []

    // Handle highlight click
    const handleHighlightClick = useCallback(
      (highlight: Annotation, event: React.MouseEvent) => {
        setActiveHighlight(highlight)
        setHighlightPopupPosition({
          x: event.clientX,
          y: event.clientY,
        })
      },
      []
    )

    // Handle color select for existing highlight
    const handleColorSelect = useCallback(
      async (color: string) => {
        if (activeHighlight && onDeleteHighlight) {
          // For now, we re-create with new color (could add update endpoint)
          await onDeleteHighlight(activeHighlight.id)
        } else if (onCreateHighlight) {
          await onCreateHighlight(color)
        }
        setActiveHighlight(null)
        setHighlightPopupPosition(null)
      },
      [activeHighlight, onCreateHighlight, onDeleteHighlight]
    )

    // Handle delete highlight
    const handleDeleteHighlight = useCallback(async () => {
      if (activeHighlight && onDeleteHighlight) {
        await onDeleteHighlight(activeHighlight.id)
        setActiveHighlight(null)
        setHighlightPopupPosition(null)
      }
    }, [activeHighlight, onDeleteHighlight])

    // Close popup
    const closePopup = useCallback(() => {
      setActiveHighlight(null)
      setHighlightPopupPosition(null)
    }, [])

    // Popup position for new selection
    const selectionPopupPosition = useMemo(() => {
      if (!selectionRect || !hasSelection) return null
      return {
        x: selectionRect.left + selectionRect.width / 2,
        y: selectionRect.bottom,
      }
    }, [selectionRect, hasSelection])

    // Get section type and metadata
    const sectionType = (section.section_type as SectionType) || 'chapter'
    const metadata = (section.metadata as SectionMetadata) || {}
    const TypeIcon = sectionTypeIcons[sectionType]
    const typeLabel = sectionTypeLabels[sectionType]
    const typeStyle = sectionTypeStyles[sectionType]
    const iconColor = sectionTypeIconColors[sectionType]
    const isSpecialType = sectionType !== 'chapter' && sectionType !== 'subchapter'
    const isImportant = sectionType === 'important'
    const isLearningObjectives = sectionType === 'learning_objectives'
    const isExample = sectionType === 'example'
    const isTip = sectionType === 'tip'
    const isExercise = sectionType === 'exercise'
    // Literature/Bibliography section detection
    const isLiteratureSection = sectionType === 'reference' && (
      section.title.toLowerCase().includes('literatur') ||
      section.title.toLowerCase().includes('quellen') ||
      section.title.toLowerCase().includes('bibliograph')
    )
    const hasSpecialLayout = isImportant || isLearningObjectives || isExample || isTip || isExercise || isLiteratureSection

    return (
      <>
        <motion.section
          ref={ref}
          id={`section-${section.id}`}
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className={cn(
            'scroll-mt-24 transition-all duration-500',
            isActive ? 'opacity-100' : 'opacity-80',
            // Special styling for "important" sections - full border with icon
            isImportant && 'relative border-2 border-red-500 rounded-2xl p-6 bg-white dark:bg-gray-950',
            // Special styling for "learning_objectives" sections - teal border design
            isLearningObjectives && 'relative border-2 border-teal-500 rounded-2xl p-6 pt-8 bg-white dark:bg-gray-950',
            // Special styling for "example" sections - teal border with gear icon
            isExample && 'relative border-2 border-teal-500 rounded-2xl p-6 bg-white dark:bg-gray-950',
            // Special styling for "tip" sections - blue border with notepad icon
            isTip && 'relative border-2 border-blue-400 rounded-2xl p-6 bg-blue-50 dark:bg-blue-950/30',
            // Special styling for "exercise" sections - orange border with clipboard icon
            isExercise && 'relative border-2 border-orange-400 rounded-2xl p-6 bg-orange-50 dark:bg-orange-950/30',
            // Special styling for "literature" sections - purple/indigo academic design
            isLiteratureSection && 'relative border border-purple-300 dark:border-purple-700 rounded-2xl p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 overflow-hidden',
            // Regular special sections
            typeStyle && !hasSpecialLayout && 'p-4 -ml-4'
          )}
        >
          {/* Special "Wichtig" box design with icon on right */}
          {isImportant && (
            <>
              {/* Decorative corner accent */}
              <div className="absolute -top-px -left-px w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-2xl" />
              <div className="absolute -bottom-px -left-px w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-2xl" />

              {/* Icon on the right side */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <span className="text-red-500 text-2xl font-bold">!</span>
                </div>
              </div>

              {/* Label */}
              <div className="mb-3">
                <span className="text-red-600 dark:text-red-400 font-semibold text-base">
                  Wichtig
                </span>
              </div>
            </>
          )}

          {/* Special "Lernziele" box design with target icon */}
          {isLearningObjectives && (
            <>
              {/* Top line with title */}
              <div className="absolute -top-px right-0 left-1/3 h-0 border-t-2 border-teal-500" />
              <div className="absolute -top-3 right-6 bg-white dark:bg-gray-950 px-3">
                <span className="text-teal-600 dark:text-teal-400 font-semibold text-xl">
                  Lernziele
                </span>
              </div>

              {/* Bottom-left corner accent */}
              <div className="absolute -bottom-px -left-px w-12 h-12 border-b-2 border-l-2 border-teal-500 rounded-bl-2xl" />

              {/* Target icon on the right side */}
              <div className="absolute -right-5 top-6 w-14 h-14 bg-white dark:bg-gray-950 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2">
                  {/* Outer circle */}
                  <circle cx="24" cy="28" r="16" />
                  {/* Middle circle */}
                  <circle cx="24" cy="28" r="10" />
                  {/* Inner circle (bullseye) */}
                  <circle cx="24" cy="28" r="4" fill="currentColor" />
                  {/* Arrow */}
                  <line x1="24" y1="28" x2="38" y2="8" strokeWidth="2.5" />
                  <polygon points="40,4 42,12 34,10" fill="currentColor" stroke="none" />
                  {/* Arrow feathers */}
                  <line x1="36" y1="10" x2="32" y2="6" strokeWidth="1.5" />
                  <line x1="38" y1="12" x2="34" y2="8" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Intro text */}
              <p className="text-teal-700 dark:text-teal-300 italic mb-4 pr-12">
                Wenn Sie diese Lerneinheit erfolgreich bearbeiten, dann können Sie...
              </p>
            </>
          )}

          {/* Special "Beispiel" box design with gear icon */}
          {isExample && (
            <>
              {/* Left border accent */}
              <div className="absolute top-4 -left-px bottom-4 w-0 border-l-4 border-teal-500 rounded-l" />

              {/* Gear icon on the right side */}
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-white dark:bg-gray-950 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-teal-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Main gear */}
                  <path d="M24 18a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
                  <path d="M24 14v-2M24 36v-2M30 24h2M14 24h2M28.24 19.76l1.42-1.42M18.34 29.66l1.42-1.42M28.24 28.24l1.42 1.42M18.34 18.34l1.42 1.42" />
                  {/* Small gear */}
                  <circle cx="36" cy="14" r="4" />
                  <path d="M36 8v2M36 18v2M40 14h2M30 14h2M38.83 11.17l1.42 1.42M31.75 18.25l1.42 1.42M38.83 16.83l1.42-1.42M31.75 9.75l1.42-1.42" strokeWidth="1" />
                  {/* Connecting line */}
                  <path d="M29 19l3-3" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Label */}
              <div className="mb-2">
                <span className="text-teal-600 dark:text-teal-400 font-semibold text-base">
                  Beispiel
                </span>
              </div>
            </>
          )}

          {/* Special "Tipp" box design with notepad icon */}
          {isTip && (
            <>
              {/* Notepad icon on the right side */}
              <div className="absolute -right-4 top-4 w-12 h-14 bg-white dark:bg-gray-950 flex items-center justify-center">
                <svg viewBox="0 0 40 48" className="w-10 h-12 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Notepad body */}
                  <rect x="4" y="8" width="28" height="36" rx="2" fill="currentColor" fillOpacity="0.1" />
                  <rect x="4" y="8" width="28" height="36" rx="2" />
                  {/* Spiral binding */}
                  <circle cx="10" cy="6" r="2" fill="currentColor" />
                  <circle cx="18" cy="6" r="2" fill="currentColor" />
                  <circle cx="26" cy="6" r="2" fill="currentColor" />
                  {/* Lines on notepad */}
                  <line x1="10" y1="18" x2="26" y2="18" strokeWidth="1" />
                  <line x1="10" y1="24" x2="26" y2="24" strokeWidth="1" />
                  <line x1="10" y1="30" x2="26" y2="30" strokeWidth="1" />
                  <line x1="10" y1="36" x2="20" y2="36" strokeWidth="1" />
                  {/* Folded corner */}
                  <path d="M24 44 L32 44 L32 36 Z" fill="white" stroke="currentColor" />
                </svg>
              </div>

              {/* Label */}
              <div className="mb-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-base">
                  Tipp
                </span>
              </div>
            </>
          )}

          {/* Special "Übungsaufgabe" box design with clipboard icon */}
          {isExercise && (
            <>
              {/* Clipboard icon on the right side */}
              <div className="absolute -right-5 top-4 w-14 h-16 bg-white dark:bg-gray-950 flex items-center justify-center">
                <svg viewBox="0 0 44 52" className="w-12 h-14 text-orange-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Clipboard board */}
                  <rect x="4" y="10" width="36" height="38" rx="3" fill="currentColor" fillOpacity="0.1" />
                  <rect x="4" y="10" width="36" height="38" rx="3" />
                  {/* Clipboard clip at top */}
                  <rect x="14" y="4" width="16" height="10" rx="2" fill="white" stroke="currentColor" />
                  <rect x="18" y="2" width="8" height="4" rx="1" fill="currentColor" />
                  {/* Checkboxes with checks */}
                  <rect x="10" y="22" width="6" height="6" rx="1" />
                  <path d="M11 25 L13 27 L15 23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="10" y="32" width="6" height="6" rx="1" />
                  <path d="M11 35 L13 37 L15 33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="10" y="42" width="6" height="6" rx="1" />
                  {/* Lines for text */}
                  <line x1="20" y1="25" x2="34" y2="25" strokeWidth="1.5" />
                  <line x1="20" y1="35" x2="34" y2="35" strokeWidth="1.5" />
                  <line x1="20" y1="45" x2="30" y2="45" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Label with task number */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-orange-600 dark:text-orange-400 font-semibold text-base">
                  Übungsaufgabe{metadata.task_number && ` ${metadata.task_number}`}
                </span>
                {/* "Zur Lösung" link */}
                {solutionSection && (
                  <button
                    type="button"
                    className={cn(
                      "text-sm font-medium flex items-center gap-1 transition-colors pr-8",
                      solutionExpanded
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-orange-600 dark:text-orange-400 hover:text-orange-700"
                    )}
                    onClick={() => setSolutionExpanded(!solutionExpanded)}
                  >
                    {solutionExpanded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Lösung ausblenden
                      </>
                    ) : (
                      <>
                        Zur Lösung →
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Special "Literaturverzeichnis" box design with library icon */}
          {isLiteratureSection && (
            <>
              {/* Large decorative icon in background */}
              <div className="absolute -right-4 -top-4 w-32 h-32 text-purple-200/50 dark:text-purple-800/30 pointer-events-none">
                <Library className="w-full h-full" />
              </div>

              {/* Decorative book stack on left */}
              <div className="absolute left-4 bottom-4 w-12 h-12 text-purple-300/60 dark:text-purple-700/40 pointer-events-none">
                <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                  <rect x="8" y="32" width="32" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="26" width="36" height="4" rx="1" fill="currentColor" fillOpacity="0.8" />
                  <rect x="10" y="20" width="28" height="4" rx="1" fill="currentColor" fillOpacity="0.6" />
                </svg>
              </div>

              {/* Header with icon */}
              <div className="relative flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl shadow-sm">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                    {section.title}
                  </h3>
                  <p className="text-sm text-purple-600/70 dark:text-purple-400/70">
                    Weiterführende Literatur & Quellen
                  </p>
                </div>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-purple-300 to-transparent dark:from-purple-700" />
                <BookOpen className="w-3 h-3 text-purple-400 dark:text-purple-600" />
                <div className="h-px flex-1 bg-gradient-to-l from-purple-300 to-transparent dark:from-purple-700" />
              </div>
            </>
          )}

          {/* Section type badge for other special sections (not special layout types) */}
          {isSpecialType && !hasSpecialLayout && TypeIcon && typeLabel && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TypeIcon className={cn('w-4 h-4', iconColor)} />
                <span className={cn('text-xs font-medium uppercase tracking-wide', iconColor)}>
                  {typeLabel}
                  {metadata.task_number && ` ${metadata.task_number}`}
                </span>
              </div>
              {/* Jump links for exercises and solutions */}
              <div className="flex items-center gap-2">
                {solutionSection && (
                  <button
                    type="button"
                    className={cn(
                      "text-xs font-medium flex items-center gap-1 transition-colors",
                      solutionExpanded
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-orange-600 dark:text-orange-400 hover:text-orange-700"
                    )}
                    onClick={() => setSolutionExpanded(!solutionExpanded)}
                  >
                    {solutionExpanded ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Lösung ausblenden
                      </>
                    ) : (
                      <>
                        Lösung anzeigen →
                      </>
                    )}
                  </button>
                )}
                {metadata.external_link && (
                  <a
                    href={metadata.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {metadata.external_link_label || 'Extern öffnen'}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Section header - not shown for special layout sections which have their own design */}
          {!hasSpecialLayout && (
            <div className="flex items-start gap-4 mb-6">
              {typeof sectionIndex === 'number' && !isSpecialType && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {sectionIndex + 1}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className={cn(
                  'font-semibold leading-tight',
                  isSpecialType ? 'text-xl text-foreground' : 'text-2xl text-teal-700 dark:text-teal-400'
                )}>
                  {section.title}
                </h2>
                {section.page_start && section.page_end && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Seite {section.page_start}
                    {section.page_end !== section.page_start && ` - ${section.page_end}`}
                  </p>
                )}
                {/* Keywords/Marginalien */}
                {metadata.keywords && metadata.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {metadata.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Edit Button - only shown in edit mode */}
              {isEditMode && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="flex-shrink-0 transition-colors text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  title="Abschnitt bearbeiten"
                >
                  <Pencil className="w-5 h-5" />
                </Button>
              )}
              {/* Bookmark Button */}
              {onToggleBookmark && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark()
                  }}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isBookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'
                  )}
                  title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}
                >
                  <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
                </Button>
              )}
            </div>
          )}

          {/* AI Summary - Collapsible */}
          {section.ai_summary && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setAiSummaryExpanded(!aiSummaryExpanded)}
                className="flex items-center gap-2 text-xs text-brand-500 hover:text-brand-600 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiSummaryExpanded ? 'KI-Zusammenfassung ausblenden' : 'KI-Zusammenfassung anzeigen'}</span>
              </button>
              <AnimatePresence>
                {aiSummaryExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <GlassCard variant="default" className="mt-2 p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.ai_summary}
                      </p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Content - Paragraph-based rendering with highlights */}
          <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none studienbrief-content">
            {hasMarkdownTable ? (
              // For content with tables, use ReactMarkdown for the whole content
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/50">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-border">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-foreground/90">{children}</td>
                  ),
                  p: ({ children }) => (
                    <p className="text-base leading-[1.8] mb-4 text-foreground/90">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground/80">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-5 text-foreground/90">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-5 text-foreground/90">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-base leading-[1.7]">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h3 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h4 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h4>
                  ),
                  h3: ({ children }) => (
                    <h5 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h5>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-brand-600 dark:text-brand-400">
                        {children}
                      </code>
                    ) : (
                      <code className="block p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                        {children}
                      </code>
                    )
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-brand-500 pl-4 py-2 my-4 bg-muted/30 rounded-r-lg italic text-foreground/80">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-6 border-border" />,
                }}
              >
                {section.content}
              </ReactMarkdown>
            ) : (
              // For regular content, render paragraph by paragraph with highlights
              // First, group consecutive list items together
              (() => {
                const groupedContent: Array<{
                  type: 'paragraph' | 'list' | 'heading' | 'blockquote' | 'code'
                  items: Array<{ text: string; index: number }>
                  listType?: 'ul' | 'ol'
                }> = []

                // Pre-process paragraphs: merge orphan bullet points with their content
                // This handles cases where "•" is on a separate line from the text
                const processedParagraphs: Array<{ text: string; index: number }> = []
                let i = 0
                while (i < paragraphs.length) {
                  const paragraph = paragraphs[i]
                  // Check if this is just a bullet point marker
                  const isOrphanBullet = paragraph === '•' || paragraph === '-' || paragraph === '*'

                  if (isOrphanBullet && i + 1 < paragraphs.length) {
                    // Merge with next paragraph
                    processedParagraphs.push({
                      text: `• ${paragraphs[i + 1]}`,
                      index: i
                    })
                    i += 2 // Skip next paragraph since we merged it
                  } else {
                    processedParagraphs.push({ text: paragraph, index: i })
                    i++
                  }
                }

                processedParagraphs.forEach(({ text: paragraph, index: pIndex }) => {
                  const isOrderedListItem = /^\d+\.\s/.test(paragraph)
                  // Extended to include bullet character (•)
                  const isUnorderedListItem = paragraph.startsWith('- ') ||
                                               paragraph.startsWith('* ') ||
                                               paragraph.startsWith('• ')
                  const isHeading = paragraph.startsWith('#')
                  const isBlockquote = paragraph.startsWith('>')
                  const isCodeBlock = paragraph.startsWith('```')

                  if (isOrderedListItem) {
                    const lastGroup = groupedContent[groupedContent.length - 1]
                    if (lastGroup && lastGroup.type === 'list' && lastGroup.listType === 'ol') {
                      lastGroup.items.push({ text: paragraph, index: pIndex })
                    } else {
                      groupedContent.push({
                        type: 'list',
                        items: [{ text: paragraph, index: pIndex }],
                        listType: 'ol'
                      })
                    }
                  } else if (isUnorderedListItem) {
                    const lastGroup = groupedContent[groupedContent.length - 1]
                    if (lastGroup && lastGroup.type === 'list' && lastGroup.listType === 'ul') {
                      lastGroup.items.push({ text: paragraph, index: pIndex })
                    } else {
                      groupedContent.push({
                        type: 'list',
                        items: [{ text: paragraph, index: pIndex }],
                        listType: 'ul'
                      })
                    }
                  } else if (isHeading || isBlockquote || isCodeBlock) {
                    groupedContent.push({
                      type: isHeading ? 'heading' : isBlockquote ? 'blockquote' : 'code',
                      items: [{ text: paragraph, index: pIndex }]
                    })
                  } else {
                    groupedContent.push({
                      type: 'paragraph',
                      items: [{ text: paragraph, index: pIndex }]
                    })
                  }
                })

                return groupedContent.map((group, groupIndex) => {
                  if (group.type === 'list') {
                    // Combine list items and render as single list
                    // Convert bullet characters (•) to standard markdown list markers (-)
                    const combinedText = group.items
                      .map(item => item.text.replace(/^•\s*/, '- '))
                      .join('\n')
                    const firstIndex = group.items[0].index
                    return (
                      <div key={`list-${groupIndex}`} data-paragraph-index={firstIndex}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            ul: ({ children }) => (
                              <ul className="mb-5 text-foreground/90">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-5 text-foreground/90 list-decimal pl-6">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-base leading-[1.7] mb-2">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-foreground/80">{children}</em>
                            ),
                          }}
                        >
                          {combinedText}
                        </ReactMarkdown>
                      </div>
                    )
                  }

                  if (group.type === 'heading' || group.type === 'blockquote' || group.type === 'code') {
                    const item = group.items[0]
                    return (
                      <div key={`special-${groupIndex}`} data-paragraph-index={item.index}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h3 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h3>
                            ),
                            h2: ({ children }) => (
                              <h4 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h4>
                            ),
                            h3: ({ children }) => (
                              <h5 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h5>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-brand-500 pl-4 py-2 my-4 bg-muted/30 rounded-r-lg italic text-foreground/80">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className
                              return isInline ? (
                                <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-brand-600 dark:text-brand-400">
                                  {children}
                                </code>
                              ) : (
                                <code className="block p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >
                          {item.text}
                        </ReactMarkdown>
                      </div>
                    )
                  }

                  // Regular paragraph
                  const item = group.items[0]
                  const pIndex = item.index
                  const paraHighlights = paragraphHighlights.get(pIndex) || []
                  const paraNotes = paragraphNotes.get(pIndex) || []
                  const isSpeaking = speakingParagraph === pIndex

                // For regular paragraphs, use HighlightedText with inline markdown support
                return (
                  <div
                    key={pIndex}
                    data-paragraph-index={pIndex}
                    className={cn(
                      'relative transition-all duration-300',
                      isSpeaking && '-mx-3 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-100 via-brand-50 to-brand-100 dark:from-brand-900/40 dark:via-brand-900/20 dark:to-brand-900/40 ring-2 ring-brand-400/50 shadow-lg shadow-brand-500/10'
                    )}
                  >
                    {/* Speaking indicator */}
                    {isSpeaking && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    )}
                    <p
                      className={cn(
                        'text-base leading-[1.8] mb-0 text-foreground/90',
                        !isSpeaking && 'mb-4'
                      )}
                    >
                      <HighlightedText
                        text={item.text}
                        highlights={paraHighlights}
                        notes={paraNotes}
                        onHighlightClick={handleHighlightClick}
                        onNoteClick={onNoteClick}
                      />
                    </p>
                  </div>
                )
              })
            })()
            )}
          </div>

          {/* Collapsible Solution Section for Exercises */}
          {solutionSection && (
            <AnimatePresence>
              {solutionExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-6"
                >
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-r-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Lösung
                      </span>
                    </div>
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none studienbrief-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {solutionSection.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Images */}
          {sectionImages.length > 0 && (
            <div className="mt-8 space-y-6">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-8 h-px bg-border" />
                Abbildungen
                <span className="flex-1 h-px bg-border" />
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {sectionImages.map((image, index) => (
                  <motion.figure
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="group relative"
                  >
                    <GlassCard
                      variant="interactive"
                      className="overflow-hidden cursor-pointer"
                      onClick={() => setLightboxImage(image)}
                    >
                      <div className="relative aspect-video bg-muted/50">
                        <Image
                          src={image.storage_path}
                          alt={image.alt_text || `Abbildung ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {image.caption && (
                        <figcaption className="p-3 text-sm text-muted-foreground">
                          {image.caption}
                        </figcaption>
                      )}
                    </GlassCard>
                  </motion.figure>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Selection Highlight Popup (for creating new highlights) */}
        {(onCreateHighlight || onAddNote || onAskAI || onCreateFlashcard) && (
          <HighlightPopup
            position={selectionPopupPosition}
            visible={hasSelection || false}
            onColorSelect={async (color) => {
              if (onCreateHighlight) {
                await onCreateHighlight(color)
              }
            }}
            onClose={() => {
              window.getSelection()?.removeAllRanges()
            }}
            mode="create"
            onAddNote={onAddNote}
            onAskAI={onAskAI}
            onCreateFlashcard={onCreateFlashcard}
          />
        )}

        {/* Existing Highlight Popup (for editing/deleting) */}
        <HighlightPopup
          position={highlightPopupPosition}
          visible={!!activeHighlight}
          onColorSelect={handleColorSelect}
          onClose={closePopup}
          mode="edit"
          currentColor={activeHighlight?.color || undefined}
          onDelete={handleDeleteHighlight}
        />

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setLightboxImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative max-w-5xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-12 right-0 text-white hover:bg-white/10"
                  onClick={() => setLightboxImage(null)}
                >
                  <X className="w-5 h-5 mr-2" />
                  Schließen
                </Button>
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <Image
                    src={lightboxImage.storage_path}
                    alt={lightboxImage.alt_text || 'Abbildung'}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
                {(lightboxImage.caption || lightboxImage.alt_text) && (
                  <div className="mt-4 text-center">
                    <p className="text-white/90">
                      {lightboxImage.caption || lightboxImage.alt_text}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
)
