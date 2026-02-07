'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GlassCard } from '@/components/ui/glass-card'
import { slideInRight } from '@/lib/animations'
import type { Section } from '@/lib/supabase/types'
import type { Note } from '@/hooks/useNotes'

interface NotesPanelProps {
  isOpen: boolean
  isSticky?: boolean
  onClose: () => void
  notes: Note[]
  sections: Section[]
  onNoteClick: (note: Note) => void
  onEditNote: (note: Note) => void
  onDeleteNote: (id: string) => Promise<void>
  onCreateNote: (sectionId: string) => void
  isTabletMode?: boolean
}

interface GroupedNotes {
  section: Section
  notes: Note[]
}

export function NotesPanel({
  isOpen,
  isSticky = false,
  onClose,
  notes,
  sections,
  onNoteClick,
  onEditNote,
  onDeleteNote,
  onCreateNote,
  isTabletMode = false,
}: NotesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  )
  const [sortBy, setSortBy] = useState<'date' | 'section'>('section')

  // Group and filter notes
  const groupedNotes = useMemo((): GroupedNotes[] => {
    // Filter notes
    let filtered = notes
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.content?.toLowerCase().includes(query) ||
          n.text_selection?.toLowerCase().includes(query)
      )
    }

    if (sortBy === 'date') {
      // Return flat sorted list
      const sortedNotes = [...filtered].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Group by date
      const groups: GroupedNotes[] = []
      for (const note of sortedNotes) {
        const section = sections.find((s) => s.id === note.section_id)
        if (section) {
          const existing = groups.find((g) => g.section.id === section.id)
          if (existing) {
            existing.notes.push(note)
          } else {
            groups.push({ section, notes: [note] })
          }
        }
      }
      return groups
    }

    // Group by section
    const groups: GroupedNotes[] = []
    for (const section of sections) {
      const sectionNotes = filtered.filter((n) => n.section_id === section.id)
      if (sectionNotes.length > 0) {
        groups.push({
          section,
          notes: sectionNotes.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          ),
        })
      }
    }

    return groups
  }, [notes, sections, searchQuery, sortBy])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalNotes = notes.length

  // Sticky mode: render inline without animations
  if (isSticky && isOpen) {
    return (
      <div className="h-full flex flex-col w-80">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-semibold">Notizen</h2>
                <p className="text-xs text-muted-foreground">
                  {totalNotes} Notiz{totalNotes !== 1 && 'en'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size={isTabletMode ? 'icon-touch' : 'icon'}
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Notizen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('pl-9', isTabletMode && 'h-11')}
            />
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sortieren:</span>
            <Button
              variant={sortBy === 'section' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setSortBy('section')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Abschnitt
            </Button>
            <Button
              variant={sortBy === 'date' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setSortBy('date')}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Datum
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {groupedNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery
                    ? 'Keine Notizen gefunden'
                    : 'Noch keine Notizen'}
                </p>
                <p className="text-xs mt-1">
                  {!searchQuery && 'Wähle Text aus und erstelle eine Notiz'}
                </p>
              </div>
            ) : (
              groupedNotes.map(({ section, notes: sectionNotes }) => (
                <div key={section.id}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 flex-1 text-left group"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate flex-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {section.title}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {sectionNotes.length}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onCreateNote(section.id)}
                      title="Neue Notiz"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Notes */}
                  <AnimatePresence>
                    {expandedSections.has(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 ml-6 overflow-hidden"
                      >
                        {sectionNotes.map((note) => (
                          <GlassCard
                            key={note.id}
                            variant="interactive"
                            className="p-3 cursor-pointer group relative"
                            onClick={() => onNoteClick(note)}
                          >
                            {/* Quote indicator */}
                            {note.text_selection && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-lg" />
                            )}

                            {/* Selected text preview */}
                            {note.text_selection && (
                              <p className="text-xs text-muted-foreground italic mb-2 pl-2 line-clamp-1">
                                "{note.text_selection}"
                              </p>
                            )}

                            {/* Note content */}
                            <p
                              className={cn(
                                'text-sm line-clamp-3',
                                note.text_selection && 'pl-2'
                              )}
                            >
                              {note.content}
                            </p>

                            {/* Timestamp */}
                            <p className="text-xs text-muted-foreground mt-2 pl-2">
                              {formatDate(note.created_at)}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-1 mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditNote(note)
                                }}
                                title="Bearbeiten"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteNote(note.id)
                                }}
                                title="Löschen"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </GlassCard>
                        ))}

                        {/* Add note button for section */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => onCreateNote(section.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Notiz hinzufügen
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick add button at bottom */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <Button
            variant="premium"
            size={isTabletMode ? 'touch' : 'default'}
            className="w-full"
            onClick={() => onCreateNote(sections[0]?.id || '')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Notiz erstellen
          </Button>
        </div>
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

          {/* Panel */}
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
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Notizen</h2>
                    <p className="text-xs text-muted-foreground">
                      {totalNotes} Notiz{totalNotes !== 1 && 'en'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size={isTabletMode ? 'icon-touch' : 'icon'}
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Notizen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn('pl-9', isTabletMode && 'h-11')}
                />
              </div>

              {/* Sort toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sortieren:</span>
                <Button
                  variant={sortBy === 'section' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSortBy('section')}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Abschnitt
                </Button>
                <Button
                  variant={sortBy === 'date' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSortBy('date')}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Datum
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {groupedNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery
                        ? 'Keine Notizen gefunden'
                        : 'Noch keine Notizen'}
                    </p>
                    <p className="text-xs mt-1">
                      {!searchQuery && 'Wähle Text aus und erstelle eine Notiz'}
                    </p>
                  </div>
                ) : (
                  groupedNotes.map(({ section, notes: sectionNotes }) => (
                    <div key={section.id}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-2 flex-1 text-left group"
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium truncate flex-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {section.title}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {sectionNotes.length}
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onCreateNote(section.id)}
                          title="Neue Notiz"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Notes */}
                      <AnimatePresence>
                        {expandedSections.has(section.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 ml-6 overflow-hidden"
                          >
                            {sectionNotes.map((note) => (
                              <GlassCard
                                key={note.id}
                                variant="interactive"
                                className="p-3 cursor-pointer group relative"
                                onClick={() => onNoteClick(note)}
                              >
                                {/* Quote indicator */}
                                {note.text_selection && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-lg" />
                                )}

                                {/* Selected text preview */}
                                {note.text_selection && (
                                  <p className="text-xs text-muted-foreground italic mb-2 pl-2 line-clamp-1">
                                    "{note.text_selection}"
                                  </p>
                                )}

                                {/* Note content */}
                                <p
                                  className={cn(
                                    'text-sm line-clamp-3',
                                    note.text_selection && 'pl-2'
                                  )}
                                >
                                  {note.content}
                                </p>

                                {/* Timestamp */}
                                <p className="text-xs text-muted-foreground mt-2 pl-2">
                                  {formatDate(note.created_at)}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-1 mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEditNote(note)
                                    }}
                                    title="Bearbeiten"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteNote(note.id)
                                    }}
                                    title="Löschen"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </GlassCard>
                            ))}

                            {/* Add note button for section */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-muted-foreground hover:text-foreground"
                              onClick={() => onCreateNote(section.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Notiz hinzufügen
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Quick add button at bottom */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                variant="premium"
                size={isTabletMode ? 'touch' : 'default'}
                className="w-full"
                onClick={() => onCreateNote(sections[0]?.id || '')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Neue Notiz erstellen
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
