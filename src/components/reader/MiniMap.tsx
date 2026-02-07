'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Section, SectionType, SectionMetadata } from '@/lib/supabase/types'

interface MiniMapProps {
  sections: Section[]
  activeSectionId: string | null
  readSections: Set<string>
  onSectionClick: (sectionId: string) => void
  isAuthorMode?: boolean
  className?: string
}

// Color mapping for section types
const sectionTypeColors: Record<SectionType, { bg: string; active: string; label: string }> = {
  chapter: {
    bg: 'bg-slate-400 dark:bg-slate-500',
    active: 'bg-slate-600 dark:bg-slate-300',
    label: 'Kapitel'
  },
  subchapter: {
    bg: 'bg-slate-300 dark:bg-slate-600',
    active: 'bg-slate-500 dark:bg-slate-400',
    label: 'Unterkapitel'
  },
  learning_objectives: {
    bg: 'bg-purple-300 dark:bg-purple-700',
    active: 'bg-purple-500 dark:bg-purple-400',
    label: 'Lernziele'
  },
  task: {
    bg: 'bg-blue-300 dark:bg-blue-700',
    active: 'bg-blue-500 dark:bg-blue-400',
    label: 'Aufgabe'
  },
  practice_impulse: {
    bg: 'bg-cyan-300 dark:bg-cyan-700',
    active: 'bg-cyan-500 dark:bg-cyan-400',
    label: 'Praxisimpuls'
  },
  reflection: {
    bg: 'bg-indigo-300 dark:bg-indigo-700',
    active: 'bg-indigo-500 dark:bg-indigo-400',
    label: 'Reflexion'
  },
  tip: {
    bg: 'bg-amber-300 dark:bg-amber-700',
    active: 'bg-amber-500 dark:bg-amber-400',
    label: 'Tipp'
  },
  summary: {
    bg: 'bg-green-300 dark:bg-green-700',
    active: 'bg-green-500 dark:bg-green-400',
    label: 'Zusammenfassung'
  },
  definition: {
    bg: 'bg-teal-300 dark:bg-teal-700',
    active: 'bg-teal-500 dark:bg-teal-400',
    label: 'Definition'
  },
  example: {
    bg: 'bg-orange-300 dark:bg-orange-700',
    active: 'bg-orange-500 dark:bg-orange-400',
    label: 'Beispiel'
  },
  important: {
    bg: 'bg-red-300 dark:bg-red-700',
    active: 'bg-red-500 dark:bg-red-400',
    label: 'Wichtig'
  },
  exercise: {
    bg: 'bg-emerald-300 dark:bg-emerald-700',
    active: 'bg-emerald-500 dark:bg-emerald-400',
    label: 'Übung'
  },
  solution: {
    bg: 'bg-lime-300 dark:bg-lime-700',
    active: 'bg-lime-500 dark:bg-lime-400',
    label: 'Lösung'
  },
  reference: {
    bg: 'bg-gray-300 dark:bg-gray-600',
    active: 'bg-gray-500 dark:bg-gray-400',
    label: 'Verweis'
  },
}

interface HoveredBlock {
  id: string
  title: string
  type: string
  label: string
  chapterNumber?: string
  isRead: boolean
  rect: DOMRect
}

const STORAGE_KEY = 'minimap-expanded'

/**
 * Mini-Map component showing document structure with colored section blocks
 * - Author Mode: Always expanded on right side
 * - Student Mode: Minimizable to floating icon at bottom right
 * - Responsive: Hidden on mobile (<md), visible from md breakpoint
 */
export function MiniMap({
  sections,
  activeSectionId,
  readSections,
  onSectionClick,
  isAuthorMode = false,
  className,
}: MiniMapProps) {
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlock | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // Load saved preference (only for student mode)
  useEffect(() => {
    if (!isAuthorMode) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        setIsExpanded(saved === 'true')
      } else {
        // Default to minimized for students
        setIsExpanded(false)
      }
    } else {
      // Always expanded in author mode
      setIsExpanded(true)
    }
  }, [isAuthorMode])

  // Save preference
  useEffect(() => {
    if (!isAuthorMode) {
      localStorage.setItem(STORAGE_KEY, String(isExpanded))
    }
  }, [isExpanded, isAuthorMode])

  // Calculate block heights based on content length (min 4px, max 24px)
  const sectionBlocks = useMemo(() => {
    const maxContentLength = Math.max(...sections.map(s => s.content.length), 1)

    return sections.map(section => {
      const metadata = (section.metadata as SectionMetadata) || {}
      const contentRatio = section.content.length / maxContentLength
      const baseHeight = 4 + Math.round(contentRatio * 20) // 4-24px range
      const level = metadata.level ?? 0

      return {
        id: section.id,
        title: section.title,
        type: section.section_type,
        height: baseHeight,
        level,
        chapterNumber: metadata.chapter_number,
        isRead: readSections.has(section.id),
      }
    })
  }, [sections, readSections])

  // Get current section index for minimized view
  const currentSectionIndex = useMemo(() => {
    if (!activeSectionId) return 1
    const index = sections.findIndex(s => s.id === activeSectionId)
    return index >= 0 ? index + 1 : 1
  }, [sections, activeSectionId])

  // Calculate read progress
  const progressPercent = useMemo(() => {
    if (sections.length === 0) return 0
    return Math.round((readSections.size / sections.length) * 100)
  }, [sections.length, readSections.size])

  const handleClick = useCallback((sectionId: string) => {
    onSectionClick(sectionId)
  }, [onSectionClick])

  const handleMouseEnter = useCallback((
    e: React.MouseEvent<HTMLButtonElement>,
    block: typeof sectionBlocks[0]
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const colors = sectionTypeColors[block.type] || sectionTypeColors.chapter
    setHoveredBlock({
      id: block.id,
      title: block.title,
      type: block.type,
      label: colors.label,
      chapterNumber: block.chapterNumber,
      isRead: block.isRead,
      rect,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredBlock(null)
  }, [])

  if (sections.length === 0) {
    return null
  }

  // Minimized floating button (Student mode only, when not expanded)
  if (!isExpanded && !isAuthorMode) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsExpanded(true)}
        className={cn(
          'hidden md:flex fixed bottom-6 right-6 z-40',
          'items-center gap-2 px-4 py-3',
          'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
          'rounded-full shadow-lg',
          'hover:shadow-xl hover:scale-105 transition-all',
          'text-foreground'
        )}
      >
        <Map className="w-5 h-5 text-purple-600" />
        <span className="text-sm font-medium">{currentSectionIndex}/{sections.length}</span>
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'hidden md:flex flex-col gap-0.5 p-2',
          'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm',
          'rounded-lg border border-slate-200 dark:border-slate-700',
          'shadow-lg',
          'max-h-[70vh] overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Übersicht
          </div>
          {!isAuthorMode && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-0.5 rounded hover:bg-muted transition-colors"
              title="Minimieren"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-1 mb-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{progressPercent}% gelesen</span>
            <span>{currentSectionIndex}/{sections.length}</span>
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Section blocks */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-0.5">
          <div className="flex flex-col gap-px">
            {sectionBlocks.map((block) => {
              const isActive = block.id === activeSectionId
              const colors = sectionTypeColors[block.type] || sectionTypeColors.chapter

              return (
                <motion.button
                  key={block.id}
                  onClick={() => handleClick(block.id)}
                  onMouseEnter={(e) => handleMouseEnter(e, block)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'w-full rounded-sm transition-all cursor-pointer relative',
                    'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1',
                    isActive ? colors.active : colors.bg,
                    block.isRead && !isActive && 'opacity-60',
                    // Indent based on level
                    block.level === 1 && 'ml-1 w-[calc(100%-4px)]',
                    block.level >= 2 && 'ml-2 w-[calc(100%-8px)]',
                  )}
                  style={{
                    height: `${block.height}px`,
                    minWidth: block.level >= 2 ? '16px' : '20px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={`Gehe zu: ${block.title}`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -left-1 top-0 bottom-0 w-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Read checkmark (small dot) */}
                  {block.isRead && !isActive && (
                    <div className="absolute right-0.5 top-0.5 w-1 h-1 rounded-full bg-green-500" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Legend (collapsed by default, expand on hover) */}
        <div className="group mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-[9px] text-muted-foreground cursor-pointer flex items-center gap-1">
            <span>Legende</span>
            <ChevronRight className="w-3 h-3 transition-transform group-hover:rotate-90" />
          </div>
          <div className="hidden group-hover:grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
            {(['chapter', 'task', 'definition', 'important', 'tip', 'exercise'] as SectionType[]).map(type => {
              const colors = sectionTypeColors[type]
              return (
                <div key={type} className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-sm', colors.bg)} />
                  <span className="text-[9px] text-muted-foreground truncate">
                    {colors.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Custom Tooltip */}
      <AnimatePresence>
        {hoveredBlock && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed z-50 bg-popover text-popover-foreground border shadow-lg rounded-lg p-2 max-w-[200px]"
            style={{
              top: hoveredBlock.rect.top,
              right: window.innerWidth - hoveredBlock.rect.left + 8,
            }}
          >
            <div className="text-xs">
              <span className="font-medium text-muted-foreground">
                {hoveredBlock.label}
              </span>
              {hoveredBlock.chapterNumber && (
                <span className="text-muted-foreground"> · {hoveredBlock.chapterNumber}</span>
              )}
              <p className="font-medium mt-0.5 line-clamp-2">
                {hoveredBlock.title}
              </p>
              {hoveredBlock.isRead && (
                <span className="text-green-600 dark:text-green-400 text-[10px]">
                  ✓ Gelesen
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
