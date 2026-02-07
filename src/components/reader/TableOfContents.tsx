'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Check,
  RotateCcw,
  StickyNote,
  Highlighter,
  Target,
  ClipboardCheck,
  Lightbulb,
  HelpCircle,
  Info,
  FileText,
  Quote,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CircularProgress } from '@/components/ui/circular-progress'
import { staggerContainer, staggerItem } from '@/lib/animations'
import type { Section, SectionType, SectionMetadata } from '@/lib/supabase/types'

// Icons for special section types
const sectionTypeIcons: Partial<Record<SectionType, LucideIcon>> = {
  learning_objectives: Target,
  task: ClipboardCheck,
  practice_impulse: Lightbulb,
  reflection: HelpCircle,
  tip: Info,
  summary: FileText,
  definition: BookOpen,
  example: Quote,
}

interface TableOfContentsProps {
  sections: Section[]
  activeSection: string | null
  onSelectSection: (sectionId: string) => void
  readProgress?: Record<string, number>
  completedSections?: Record<string, boolean>
  onMarkCompleted?: (sectionId: string, completed: boolean) => void
  highlightCounts?: Record<string, number>
  noteCounts?: Record<string, number>
  isTabletMode?: boolean
}

interface GroupedChapter {
  chapter_number: string
  mainSection: Section | null
  children: Section[]
}

export function TableOfContents({
  sections,
  activeSection,
  onSelectSection,
  readProgress = {},
  completedSections = {},
  onMarkCompleted,
  highlightCounts = {},
  noteCounts = {},
  isTabletMode = false,
}: TableOfContentsProps) {
  // Start with all chapters expanded by default
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => {
    // Extract all unique main chapter numbers
    const chapterNums = new Set<string>()
    sections.forEach((section) => {
      const metadata = (section.metadata as SectionMetadata) || {}
      let chapterNum = metadata.chapter_number || '0'

      // Normalize: "1.1" -> "1"
      const mainChapterMatch = chapterNum.match(/^(\d+)\./)
      if (mainChapterMatch && section.section_type !== 'chapter') {
        chapterNum = mainChapterMatch[1]
      }

      // Only include numeric chapter numbers (not intro, outro, appendix)
      if (/^\d+$/.test(chapterNum)) {
        chapterNums.add(chapterNum)
      }
    })
    return chapterNums
  })

  // Group sections by chapter_number, with hierarchy
  const groupedSections = useMemo(() => {
    const groups = new Map<string, GroupedChapter>()

    sections.forEach((section) => {
      const metadata = (section.metadata as SectionMetadata) || {}
      let chapterNum = metadata.chapter_number || '0'
      const level = metadata.level ?? 0
      const sectionType = section.section_type

      // Normalize chapter_number: "1.1" -> "1", "2.3" -> "2"
      // This ensures subchapters are grouped with their parent chapter
      const mainChapterMatch = chapterNum.match(/^(\d+)\./)
      if (mainChapterMatch && sectionType !== 'chapter') {
        // This is a subchapter like "1.1", group it under chapter "1"
        chapterNum = mainChapterMatch[1]
      }

      if (!groups.has(chapterNum)) {
        groups.set(chapterNum, {
          chapter_number: chapterNum,
          mainSection: null,
          children: [],
        })
      }

      const group = groups.get(chapterNum)!

      // Main chapter section (level 0, type 'chapter')
      // Only set as mainSection if it's actually a chapter, not a subchapter
      const isMainChapter = level === 0 && sectionType === 'chapter'

      if (isMainChapter && !group.mainSection) {
        group.mainSection = section
      } else {
        // Everything else becomes a child (subchapters, examples, exercises, etc.)
        group.children.push(section)
      }
    })

    // Sort groups by chapter_number with explicit ordering:
    // intro -> numeric chapters -> outro -> appendix (Literatur)
    // NOTE: Solutions are hidden from navigation since they're accessible
    // via the "Zur Lösung" button inline with exercises
    const chapterOrder: Record<string, number> = {
      'intro': 0,
      'outro': 100,
      'solutions': 999, // Hidden - will be filtered out
      'appendix': 101,
    }

    const sortedGroups = Array.from(groups.values())
      // Filter out solutions - they're shown inline with exercises
      .filter(group => group.chapter_number !== 'solutions')
      .sort((a, b) => {
        const orderA = chapterOrder[a.chapter_number] ?? (parseInt(a.chapter_number) || 50)
        const orderB = chapterOrder[b.chapter_number] ?? (parseInt(b.chapter_number) || 50)
        return orderA - orderB
      })

    // Sort children within each group by their subchapter number (e.g., 1.1, 1.2, 1.3)
    sortedGroups.forEach(group => {
      group.children.sort((a, b) => {
        // Extract subchapter number from title (e.g., "1.1 Title" -> 1.1)
        const aMatch = a.title.match(/^(\d+)\.(\d+)/)
        const bMatch = b.title.match(/^(\d+)\.(\d+)/)

        if (aMatch && bMatch) {
          const aNum = parseFloat(`${aMatch[1]}.${aMatch[2]}`)
          const bNum = parseFloat(`${bMatch[1]}.${bMatch[2]}`)
          return aNum - bNum
        }

        // Non-numbered sections go after numbered ones, in their original order
        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1

        // Keep original order for non-numbered sections
        return 0
      })
    })

    return sortedGroups
  }, [sections])

  // Expand chapter containing active section
  useMemo(() => {
    if (activeSection) {
      const activeSecData = sections.find(s => s.id === activeSection)
      if (activeSecData) {
        const metadata = (activeSecData.metadata as SectionMetadata) || {}
        let chapterNum = metadata.chapter_number || '0'

        // Apply same normalization as grouping: "1.1" -> "1", "2.3" -> "2"
        const mainChapterMatch = chapterNum.match(/^(\d+)\./)
        if (mainChapterMatch && activeSecData.section_type !== 'chapter') {
          chapterNum = mainChapterMatch[1]
        }

        setExpandedChapters(prev => new Set(prev).add(chapterNum))
      }
    }
  }, [activeSection, sections])

  // Exclude appendix and solutions sections from progress tracking
  const trackableSections = useMemo(() =>
    sections.filter(s => {
      const metadata = (s.metadata as SectionMetadata) || {}
      return metadata.chapter_number !== 'appendix' && metadata.chapter_number !== 'solutions'
    }), [sections])

  const totalProgress = trackableSections.length > 0
    ? Math.round(
        trackableSections.reduce((sum, s) => sum + (completedSections[s.id] ? 100 : (readProgress[s.id] || 0)), 0) / trackableSections.length
      )
    : 0

  const completedCount = trackableSections.filter(s => completedSections[s.id]).length

  const toggleChapter = useCallback((chapterNum: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterNum)) {
        next.delete(chapterNum)
      } else {
        next.add(chapterNum)
      }
      return next
    })
  }, [])

  const handleMarkCompleted = useCallback(
    (e: React.MouseEvent, sectionId: string, completed: boolean) => {
      e.stopPropagation()
      onMarkCompleted?.(sectionId, completed)
    },
    [onMarkCompleted]
  )

  // Section type colors for visual distinction
  const sectionTypeColors: Partial<Record<SectionType, { bg: string; text: string; border: string }>> = {
    important: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-l-red-500' },
    example: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-l-teal-500' },
    tip: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-l-cyan-500' },
    exercise: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500' },
    learning_objectives: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-l-green-500' },
    summary: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-l-violet-500' },
    definition: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-l-indigo-500' },
    reflection: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500' },
    practice_impulse: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500' },
  }

  const renderSection = (section: Section, isChild: boolean = false, index: number = 0) => {
    const isActive = activeSection === section.id
    const progress = readProgress[section.id] || 0
    const isCompleted = completedSections[section.id] || false
    const images = Array.isArray(section.images) ? section.images : []
    const hasImages = images.length > 0
    const highlightCount = highlightCounts[section.id] || 0
    const noteCount = noteCounts[section.id] || 0
    const metadata = (section.metadata as SectionMetadata) || {}
    const sectionType = section.section_type as SectionType
    const TypeIcon = sectionTypeIcons[sectionType]
    const typeColors = sectionTypeColors[sectionType]

    // Check if this is a subchapter (numbered like 1.3, 2.1 etc.)
    const subchapterMatch = section.title.match(/^(\d+\.\d+)/)
    const isSubchapter = sectionType === 'subchapter' || !!subchapterMatch
    const subchapterNumber = subchapterMatch ? subchapterMatch[1] : null

    return (
      <div
        key={section.id}
        className={cn(
          'group relative transition-all duration-200',
          isChild && 'ml-4',
          isChild && typeColors ? `border-l-2 ${typeColors.border}` : isChild && 'border-l-2 border-muted',
          isActive && 'bg-brand-500/10 rounded-lg'
        )}
      >
        <div
          onClick={() => onSelectSection(section.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectSection(section.id)
            }
          }}
          role="button"
          tabIndex={0}
          className={cn(
            'w-full text-left px-3 py-2 text-sm transition-all duration-200 cursor-pointer',
            'hover:bg-muted/50 active:scale-[0.98] rounded-lg',
            isChild && 'pl-4',
            isTabletMode && 'py-3'
          )}
        >
          <div className="flex items-start gap-2">
            {/* Type icon with color coding */}
            <div
              className={cn(
                'flex-shrink-0 rounded-md flex items-center justify-center text-xs font-medium transition-colors',
                // Wider for subchapter numbers
                isSubchapter && subchapterNumber ? 'w-8 h-6 px-1' : 'w-6 h-6',
                isCompleted
                  ? 'bg-green-500/20 text-green-500'
                  : isActive
                  ? 'bg-brand-500/20 text-brand-400'
                  : typeColors
                  ? `${typeColors.bg} ${typeColors.text}`
                  : isSubchapter
                  ? 'bg-muted/80 text-foreground/80'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : TypeIcon ? (
                <TypeIcon className="w-3.5 h-3.5" />
              ) : isSubchapter && subchapterNumber ? (
                <span className="text-[10px] font-bold">{subchapterNumber}</span>
              ) : isChild ? (
                <span className="text-[10px]">•</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Title and metadata */}
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'block transition-colors',
                  // Size: subchapters are slightly larger
                  isSubchapter ? 'text-[13px] font-medium' : 'text-xs',
                  // Colors based on state and type
                  isActive
                    ? 'text-brand-400 font-medium'
                    : isCompleted
                    ? 'text-foreground/70'
                    : typeColors
                    ? typeColors.text
                    : 'text-foreground/80 group-hover:text-foreground'
                )}
              >
                {section.title}
                {metadata.task_number && (
                  <span className={cn(
                    "ml-1",
                    typeColors ? typeColors.text : "text-muted-foreground"
                  )}>
                    ({metadata.task_number})
                  </span>
                )}
              </span>

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-0.5">
                {section.page_start && (
                  <span className="text-[10px] text-muted-foreground">
                    S. {section.page_start}
                  </span>
                )}
                {hasImages && (
                  <span className="flex items-center gap-0.5 text-[10px] text-brand-400">
                    <ImageIcon className="w-2.5 h-2.5" />
                    {images.length}
                  </span>
                )}
                {highlightCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                    <Highlighter className="w-2.5 h-2.5" />
                    {highlightCount}
                  </span>
                )}
                {noteCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                    <StickyNote className="w-2.5 h-2.5" />
                    {noteCount}
                  </span>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex-shrink-0">
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : progress > 0 && progress < 100 ? (
                <CircularProgress value={progress} size="xs" className="text-brand-400" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Active indicator bar */}
        {isActive && (
          <motion.div
            layoutId="activeSection"
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500 rounded-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </div>
    )
  }

  return (
    <nav className="p-4">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-400" />
          Inhaltsverzeichnis
        </h3>
        <CircularProgress
          value={totalProgress}
          size="sm"
          showValue
          className="text-brand-400"
        />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {completedCount} von {trackableSections.length} abgeschlossen
        </p>
      </div>

      {/* Hierarchical sections list */}
      <motion.div
        className="space-y-1"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {groupedSections.map((group, groupIndex) => {
          const isExpanded = expandedChapters.has(group.chapter_number)
          const hasChildren = group.children.length > 0
          const mainSection = group.mainSection

          // If no main section, show children directly (edge case)
          if (!mainSection) {
            return group.children.map((child, idx) => (
              <motion.div key={child.id} variants={staggerItem}>
                {renderSection(child, false, idx)}
              </motion.div>
            ))
          }

          const isActive = activeSection === mainSection.id
          const isCompleted = completedSections[mainSection.id] || false
          const childrenCompleted = group.children.filter(c => completedSections[c.id]).length
          const totalInGroup = group.children.length + 1

          // Appendix (Literaturverzeichnis) doesn't need numbering or completion tracking
          const isAppendix = group.chapter_number === 'appendix'

          return (
            <motion.div key={group.chapter_number} variants={staggerItem}>
              {/* Main chapter header */}
              <div
                className={cn(
                  'group relative rounded-xl transition-all duration-200',
                  isActive && 'bg-brand-500/10 ring-1 ring-brand-500/30',
                  isExpanded && !isActive && 'bg-muted/30'
                )}
              >
                <div className="flex items-center">
                  {/* Expand/collapse button */}
                  {hasChildren && (
                    <button
                      onClick={() => toggleChapter(group.chapter_number)}
                      className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  {/* Chapter title */}
                  <div
                    onClick={() => onSelectSection(mainSection.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectSection(mainSection.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'flex-1 text-left px-2 py-2.5 text-sm cursor-pointer',
                      'hover:bg-muted/50 active:scale-[0.98] transition-all',
                      !hasChildren && 'pl-4',
                      isTabletMode && 'py-3.5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status indicator - no number for appendix */}
                      {isAppendix ? (
                        <div
                          className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors',
                            isActive
                              ? 'bg-brand-500/20 text-brand-400'
                              : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                          )}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                      ) : (
                        (() => {
                          // Extract chapter number from title (e.g., "2. Jura richtig lernen" -> "2")
                          // or use numeric chapter_number from group
                          const titleMatch = mainSection.title.match(/^(\d+)\./)
                          const displayNumber = titleMatch ? titleMatch[1] : (
                            !isNaN(parseInt(group.chapter_number)) ? group.chapter_number : null
                          )

                          return displayNumber ? (
                            <div
                              className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors',
                                isActive
                                  ? 'bg-brand-500 text-white'
                                  : isCompleted
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/60'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span>{displayNumber}</span>
                              )}
                            </div>
                          ) : (
                            // No number - show icon instead
                            <div
                              className={cn(
                                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors',
                                isActive
                                  ? 'bg-brand-500/20 text-brand-400'
                                  : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <BookOpen className="w-4 h-4" />
                              )}
                            </div>
                          )
                        })()
                      )}

                      {/* Title and metadata */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <span
                          className={cn(
                            'block transition-colors text-sm font-semibold leading-snug',
                            isActive
                              ? 'text-brand-500'
                              : isCompleted
                              ? 'text-foreground/70'
                              : 'text-foreground group-hover:text-foreground'
                          )}
                        >
                          {mainSection.title}
                        </span>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-1">
                          {mainSection.page_start && (
                            <span className="text-xs text-muted-foreground">
                              S. {mainSection.page_start}
                            </span>
                          )}
                          {hasChildren && (
                            <span className="text-xs text-muted-foreground">
                              {childrenCompleted}/{group.children.length} Abschnitte
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context menu - not shown for appendix */}
                  {onMarkCompleted && !isAppendix && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isCompleted ? (
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleMarkCompleted(e as unknown as React.MouseEvent, mainSection.id, false)
                            }
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Als ungelesen markieren
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleMarkCompleted(e as unknown as React.MouseEvent, mainSection.id, true)
                            }
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Als gelesen markieren
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>

              {/* Children (subchapters, tasks, etc.) */}
              <AnimatePresence>
                {isExpanded && hasChildren && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {group.children.map((child, idx) => renderSection(child, true, idx))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Reading stats */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{trackableSections.length} Abschnitte</span>
          <span className="text-green-500 font-medium">
            {completedCount} abgeschlossen
          </span>
        </div>
      </div>
    </nav>
  )
}
