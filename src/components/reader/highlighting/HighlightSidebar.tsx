'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Highlighter,
  X,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Search,
  BookmarkCheck,
  BookmarkPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlassCard } from '@/components/ui/glass-card'
import { slideInRight } from '@/lib/animations'
import {
  HIGHLIGHT_COLORS,
  getHighlightColorByValue,
} from '@/lib/highlighting/constants'
import type { Section, Annotation } from '@/lib/supabase/types'

interface HighlightSidebarProps {
  isOpen: boolean
  isSticky?: boolean
  onClose: () => void
  highlights: Annotation[]
  sections: Section[]
  onHighlightClick: (highlight: Annotation) => void
  onDeleteHighlight: (id: string) => void | Promise<boolean | void>
  onEditNote?: (highlight: Annotation) => void
  onToggleForReview?: (id: string) => void | Promise<boolean>
}

interface GroupedHighlights {
  section: Section
  highlights: Annotation[]
}

export function HighlightSidebar({
  isOpen,
  isSticky = false,
  onClose,
  highlights,
  sections,
  onHighlightClick,
  onDeleteHighlight,
  onEditNote,
  onToggleForReview,
}: HighlightSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  )
  const [filterColor, setFilterColor] = useState<string | null>(null)
  const [showOnlyForReview, setShowOnlyForReview] = useState(false)

  // Count highlights marked for review
  const forReviewCount = highlights.filter((h) => h.for_review === true).length

  // Group highlights by section
  const groupedHighlights = useMemo((): GroupedHighlights[] => {
    const sectionMap = new Map(sections.map((s) => [s.id, s]))

    // Filter highlights
    let filtered = highlights
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (h) =>
          h.text_selection?.toLowerCase().includes(query) ||
          h.content?.toLowerCase().includes(query)
      )
    }
    if (filterColor) {
      filtered = filtered.filter((h) => h.color === filterColor)
    }
    if (showOnlyForReview) {
      filtered = filtered.filter((h) => h.for_review === true)
    }

    // Group by section
    const groups: GroupedHighlights[] = []
    for (const section of sections) {
      const sectionHighlights = filtered.filter(
        (h) => h.section_id === section.id
      )
      if (sectionHighlights.length > 0) {
        groups.push({
          section,
          highlights: sectionHighlights.sort(
            (a, b) => (a.position_start || 0) - (b.position_start || 0)
          ),
        })
      }
    }

    return groups
  }, [highlights, sections, searchQuery, filterColor, showOnlyForReview])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const totalHighlights = highlights.length

  // Sticky mode: render inline without animations
  if (isSticky && isOpen) {
    return (
      <div className="h-full flex flex-col w-80">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Highlighter className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="font-semibold">Markierungen</h2>
                <p className="text-xs text-muted-foreground">
                  {totalHighlights} Markierung{totalHighlights !== 1 && 'en'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Markierungen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Color filter */}
          <div className="flex items-center gap-1 mt-3">
            <span className="text-xs text-muted-foreground mr-2">Filter:</span>
            <button
              onClick={() => setFilterColor(null)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all',
                'bg-gradient-to-br from-yellow-300 via-green-300 to-blue-300',
                filterColor === null && !showOnlyForReview
                  ? 'border-brand-500 scale-110'
                  : 'border-transparent hover:border-gray-300'
              )}
              title="Alle Farben"
            />
            {Object.values(HIGHLIGHT_COLORS).map((color) => (
              <button
                key={color.value}
                onClick={() =>
                  setFilterColor(
                    filterColor === color.value ? null : color.value
                  )
                }
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all',
                  filterColor === color.value
                    ? 'border-brand-500 scale-110'
                    : 'border-transparent hover:border-gray-300'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>

          {/* For Review filter */}
          <Button
            variant={showOnlyForReview ? 'secondary' : 'outline'}
            size="sm"
            className={cn(
              'mt-3 w-full justify-start gap-2',
              showOnlyForReview && 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
            )}
            onClick={() => setShowOnlyForReview(!showOnlyForReview)}
          >
            <BookmarkCheck className="w-4 h-4" />
            Zur Vertiefung
            {forReviewCount > 0 && (
              <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                {forReviewCount}
              </span>
            )}
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {groupedHighlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery || filterColor
                    ? 'Keine Markierungen gefunden'
                    : 'Noch keine Markierungen'}
                </p>
                <p className="text-xs mt-1">
                  {!searchQuery &&
                    !filterColor &&
                    'Wähle Text aus, um ihn zu markieren'}
                </p>
              </div>
            ) : (
              groupedHighlights.map(({ section, highlights: sectionHighlights }) => (
                <div key={section.id}>
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-2 w-full text-left mb-2 group"
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium truncate flex-1 group-hover:text-brand-500 transition-colors">
                      {section.title}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {sectionHighlights.length}
                    </span>
                  </button>

                  {/* Highlights */}
                  <AnimatePresence>
                    {expandedSections.has(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 ml-6 overflow-hidden"
                      >
                        {sectionHighlights.map((highlight) => {
                          const color = getHighlightColorByValue(
                            highlight.color || ''
                          )
                          return (
                            <GlassCard
                              key={highlight.id}
                              variant="interactive"
                              className={cn(
                                'p-3 cursor-pointer group',
                                highlight.for_review && 'ring-1 ring-blue-300 dark:ring-blue-700'
                              )}
                              onClick={() => onHighlightClick(highlight)}
                            >
                              {/* Color indicator */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                                style={{
                                  backgroundColor: highlight.color || '#ffeb3b',
                                }}
                              />

                              {/* For review indicator */}
                              {highlight.for_review && (
                                <div className="absolute top-2 right-2">
                                  <BookmarkCheck className="w-4 h-4 text-blue-500" />
                                </div>
                              )}

                              {/* Text */}
                              <p className="text-sm line-clamp-2 pl-2 pr-6">
                                "{highlight.text_selection}"
                              </p>

                              {/* Note indicator */}
                              {highlight.content && (
                                <p className="text-xs text-muted-foreground mt-1 pl-2 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {highlight.content}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onToggleForReview && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      'h-6 w-6',
                                      highlight.for_review
                                        ? 'text-blue-600'
                                        : 'text-muted-foreground'
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onToggleForReview(highlight.id)
                                    }}
                                    title={highlight.for_review ? 'Aus Vertiefung entfernen' : 'Zur Vertiefung'}
                                  >
                                    {highlight.for_review ? (
                                      <BookmarkCheck className="w-3 h-3" />
                                    ) : (
                                      <BookmarkPlus className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                                {onEditNote && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEditNote(highlight)
                                    }}
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteHighlight(highlight.id)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </GlassCard>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Overlay mode: render with animations and backdrop
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-80 max-w-[90vw]',
              'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
              'border-l border-gray-200/50 dark:border-gray-700/50',
              'shadow-2xl',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <Highlighter className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Markierungen</h2>
                    <p className="text-xs text-muted-foreground">
                      {totalHighlights} Markierung{totalHighlights !== 1 && 'en'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Markierungen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Color filter */}
              <div className="flex items-center gap-1 mt-3">
                <span className="text-xs text-muted-foreground mr-2">Filter:</span>
                <button
                  onClick={() => setFilterColor(null)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    'bg-gradient-to-br from-yellow-300 via-green-300 to-blue-300',
                    filterColor === null && !showOnlyForReview
                      ? 'border-brand-500 scale-110'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  title="Alle Farben"
                />
                {Object.values(HIGHLIGHT_COLORS).map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setFilterColor(
                        filterColor === color.value ? null : color.value
                      )
                    }
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all',
                      filterColor === color.value
                        ? 'border-brand-500 scale-110'
                        : 'border-transparent hover:border-gray-300'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>

              {/* For Review filter */}
              <Button
                variant={showOnlyForReview ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  'mt-3 w-full justify-start gap-2',
                  showOnlyForReview && 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
                )}
                onClick={() => setShowOnlyForReview(!showOnlyForReview)}
              >
                <BookmarkCheck className="w-4 h-4" />
                Zur Vertiefung
                {forReviewCount > 0 && (
                  <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                    {forReviewCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {groupedHighlights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery || filterColor
                        ? 'Keine Markierungen gefunden'
                        : 'Noch keine Markierungen'}
                    </p>
                    <p className="text-xs mt-1">
                      {!searchQuery &&
                        !filterColor &&
                        'Wähle Text aus, um ihn zu markieren'}
                    </p>
                  </div>
                ) : (
                  groupedHighlights.map(({ section, highlights: sectionHighlights }) => (
                    <div key={section.id}>
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center gap-2 w-full text-left mb-2 group"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium truncate flex-1 group-hover:text-brand-500 transition-colors">
                          {section.title}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {sectionHighlights.length}
                        </span>
                      </button>

                      {/* Highlights */}
                      <AnimatePresence>
                        {expandedSections.has(section.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 ml-6 overflow-hidden"
                          >
                            {sectionHighlights.map((highlight) => {
                              const color = getHighlightColorByValue(
                                highlight.color || ''
                              )
                              return (
                                <GlassCard
                                  key={highlight.id}
                                  variant="interactive"
                                  className={cn(
                                    'p-3 cursor-pointer group',
                                    highlight.for_review && 'ring-1 ring-blue-300 dark:ring-blue-700'
                                  )}
                                  onClick={() => onHighlightClick(highlight)}
                                >
                                  {/* Color indicator */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                                    style={{
                                      backgroundColor: highlight.color || '#ffeb3b',
                                    }}
                                  />

                                  {/* For review indicator */}
                                  {highlight.for_review && (
                                    <div className="absolute top-2 right-2">
                                      <BookmarkCheck className="w-4 h-4 text-blue-500" />
                                    </div>
                                  )}

                                  {/* Text */}
                                  <p className="text-sm line-clamp-2 pl-2 pr-6">
                                    "{highlight.text_selection}"
                                  </p>

                                  {/* Note indicator */}
                                  {highlight.content && (
                                    <p className="text-xs text-muted-foreground mt-1 pl-2 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {highlight.content}
                                    </p>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onToggleForReview && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          'h-6 w-6',
                                          highlight.for_review
                                            ? 'text-blue-600'
                                            : 'text-muted-foreground'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onToggleForReview(highlight.id)
                                        }}
                                        title={highlight.for_review ? 'Aus Vertiefung entfernen' : 'Zur Vertiefung'}
                                      >
                                        {highlight.for_review ? (
                                          <BookmarkCheck className="w-3 h-3" />
                                        ) : (
                                          <BookmarkPlus className="w-3 h-3" />
                                        )}
                                      </Button>
                                    )}
                                    {onEditNote && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onEditNote(highlight)
                                        }}
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteHighlight(highlight.id)
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </GlassCard>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
