'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TableOfContents } from './TableOfContents'
import { SectionView } from './SectionView'
import { DocumentCover } from './DocumentCover'
import { FullscreenTableOfContents } from './FullscreenTableOfContents'
import { TextToSpeech } from './TextToSpeech'
import {
  HighlightProvider,
  useHighlightContext,
  HighlightSidebar,
} from './highlighting'
import { NotesPanel } from './notes/NotesPanel'
import { NoteEditor } from './notes/NoteEditor'
import { AIAssistant } from './AIAssistant'
import { DocumentSearch } from './DocumentSearch'
import { FlashcardGenerator } from './FlashcardGenerator'
import { FlashcardDeck } from '@/components/flashcards'
import { ExportPanel } from './ExportPanel'
import { ContinueReadingPrompt } from './ContinueReadingPrompt'
import { BookmarkSidebar, BookmarkButton } from './bookmarks'
import { PomodoroTimer } from './PomodoroTimer'
import { SectionEditor } from './editing'
import { MiniMap } from './MiniMap'
import {
  AuthorModeToggle,
  AddSectionButton,
  AddSectionMenu,
  SectionActionBar,
  DeleteConfirmDialog,
} from './author'
import { useTextSelection } from '@/hooks/useTextSelection'
import { useEditSection } from '@/hooks/useEditSection'
import { useAuthorMode } from '@/hooks/useAuthorMode'
import { useSectionManagement } from '@/hooks/useSectionManagement'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useAnnotations } from '@/hooks/useAnnotations'
import { useNotes, type Note } from '@/hooks/useNotes'
import { useFlashcards } from '@/hooks/useFlashcards'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { TabletModeProvider, useTabletMode } from '@/contexts/TabletModeContext'
import { DeviceModeSelector } from './DeviceModeSelector'
import { cn } from '@/lib/utils'
import {
  Highlighter,
  PanelRightOpen,
  PanelRightClose,
  StickyNote,
  Search,
  Download,
  Layers,
  Radio,
  ExternalLink,
  Bookmark,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import type { Document, Section } from '@/lib/supabase/types'

interface DocumentReaderProps {
  document: Document
  sections: Section[]
}

function DocumentReaderContent({ document, sections }: DocumentReaderProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [speakingParagraph, setSpeakingParagraph] = useState<number | null>(null)
  const [showHighlightSidebar, setShowHighlightSidebar] = useState(false)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [noteEditorVisible, setNoteEditorVisible] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteEditorSectionId, setNoteEditorSectionId] = useState<string | null>(
    null
  )
  // Store the selection data when opening note editor (so it persists while typing)
  const [noteEditorSelection, setNoteEditorSelection] = useState<{
    text: string
    startOffset: number
    endOffset: number
  } | null>(null)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiSelectedText, setAiSelectedText] = useState('')
  // Store AI selection data for positioning the note correctly
  const [aiSelectionData, setAiSelectionData] = useState<{
    sectionId: string
    startOffset: number
    endOffset: number
  } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showFlashcardGenerator, setShowFlashcardGenerator] = useState(false)
  const [flashcardSelectedText, setFlashcardSelectedText] = useState('')
  const [flashcardSectionId, setFlashcardSectionId] = useState<string | null>(null)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [showFlashcardDeck, setShowFlashcardDeck] = useState(false)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Get tablet mode context
  const {
    isTabletMode,
    setTabletMode,
    sidebarOpen: tabletSidebarOpen,
    setSidebarOpen: setTabletSidebarOpen,
    toggleSidebar: toggleTabletSidebar,
  } = useTabletMode()

  // Get section IDs for annotations hook
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  // Local sections state for editing (allows optimistic updates)
  const [localSections, setLocalSections] = useState(sections)

  // Filter out solution sections and create exercise-to-solution mapping
  // Uses localSections to reflect edits
  const { displaySections, solutionMap } = useMemo(() => {
    const solutionMap = new Map<string, Section>()
    const solutions: Section[] = []
    const nonSolutions: Section[] = []

    // First pass: identify all solutions
    localSections.forEach((section) => {
      if (section.section_type === 'solution') {
        solutions.push(section)
      } else {
        nonSolutions.push(section)
      }
    })

    // Second pass: map exercises to their solutions
    solutions.forEach((solution) => {
      const metadata = solution.metadata as { exercise_id?: string } | null
      if (metadata?.exercise_id) {
        solutionMap.set(metadata.exercise_id, solution)
      }
    })

    return { displaySections: nonSolutions, solutionMap }
  }, [localSections])

  // Annotations hook
  const {
    highlights,
    isLoading: highlightsLoading,
    createHighlight,
    deleteHighlight,
    getHighlightsForSection,
    toggleForReview,
  } = useAnnotations(sectionIds)

  // Notes hook
  const {
    notes,
    isLoading: notesLoading,
    createNote,
    updateNote,
    deleteNote,
    getNotesForSection,
  } = useNotes(sectionIds)

  // Bookmarks hook
  const {
    bookmarks,
    isLoading: bookmarksLoading,
    toggleBookmark,
    hasBookmark,
    deleteBookmark: removeBookmark,
  } = useBookmarks(sectionIds)

  // Flashcards hook
  const {
    flashcards,
    isLoading: flashcardsLoading,
    createFlashcard,
    updateReview: updateFlashcardReview,
  } = useFlashcards(document.id)

  // Reading progress hook
  const {
    progress: readProgress,
    completed: completedSections,
    markCompleted,
    overallProgress,
    completedCount,
    lastPosition,
    savePosition,
    clearPosition,
  } = useReadingProgress({
    documentId: document.id,
    sectionIds,
  })

  // Continue reading prompt state
  const [showContinuePrompt, setShowContinuePrompt] = useState(false)
  const hasShownPromptRef = useRef(false)

  // Bookmark sidebar state
  const [showBookmarkSidebar, setShowBookmarkSidebar] = useState(false)

  // Edit section hook
  const {
    isEditing,
    editingSection,
    startEditing,
    cancelEditing,
    saveSection,
    isSaving,
    error: editError,
  } = useEditSection({
    onSave: (updatedSection) => {
      // Update local sections with the saved section
      setLocalSections(prev =>
        prev.map(s => s.id === updatedSection.id ? updatedSection : s)
      )
    },
  })

  // Author Mode hook (TODO: pass actual user role from document ownership)
  const {
    isAuthorMode,
    toggleAuthorMode,
    canEdit,
  } = useAuthorMode('owner') // For now, assume owner - could be fetched from document

  // Section management hook
  const sectionManagement = useSectionManagement(
    document.id,
    localSections,
    () => {
      // Refetch sections - for now just reload the page
      // In a real app, you'd refetch from the API
      window.location.reload()
    }
  )

  // Convert completedSections Record to Set for MiniMap
  const completedSectionsSet = useMemo(() => {
    return new Set(
      Object.entries(completedSections)
        .filter(([, completed]) => completed)
        .map(([id]) => id)
    )
  }, [completedSections])

  // Wrapper to mark chapter + all children as completed
  const handleMarkChapterCompleted = useCallback(
    async (sectionId: string, completed: boolean) => {
      const section = sections.find((s) => s.id === sectionId)
      if (!section) {
        await markCompleted(sectionId, completed)
        return
      }

      const metadata = (section.metadata as { chapter_number?: string; level?: number }) || {}
      const chapterNumber = metadata.chapter_number
      const level = metadata.level ?? 0

      // Mark the section itself
      await markCompleted(sectionId, completed)

      // If this is a main chapter (level 0), also mark all children with same chapter_number
      if (level === 0 && chapterNumber) {
        const children = sections.filter((s) => {
          const childMeta = (s.metadata as { chapter_number?: string; level?: number }) || {}
          return childMeta.chapter_number === chapterNumber && (childMeta.level ?? 0) > 0
        })

        for (const child of children) {
          await markCompleted(child.id, completed)
        }
      }
    },
    [sections, markCompleted]
  )

  // Calculate highlight and note counts per section
  const highlightCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sectionId of sectionIds) {
      counts[sectionId] = getHighlightsForSection(sectionId).length
    }
    return counts
  }, [sectionIds, getHighlightsForSection, highlights])

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sectionId of sectionIds) {
      counts[sectionId] = getNotesForSection(sectionId).length
    }
    return counts
  }, [sectionIds, getNotesForSection, notes])

  // Text selection hook
  const { selection, hasSelection, clearSelection } = useTextSelection({
    containerRef: contentRef as React.RefObject<HTMLElement>,
    enabled: true,
  })

  // Store captured selection to prevent race conditions when clicking popup buttons
  // This ensures the selection data is available even after the browser selection is cleared
  const [capturedSelection, setCapturedSelection] = useState<{
    text: string
    sectionId: string
    startOffset: number
    endOffset: number
    rect: DOMRect | null
  } | null>(null)

  // Track if the selection was just cleared by a popup action
  const selectionClearedByActionRef = useRef(false)
  // Track previous hasSelection to detect transitions
  const prevHasSelectionRef = useRef(hasSelection)

  // Capture selection when it changes
  useEffect(() => {
    // Only update when there's an actual new selection
    if (hasSelection && selection.sectionId && selection.text) {
      setCapturedSelection({
        text: selection.text,
        sectionId: selection.sectionId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        rect: selection.rect,
      })
      selectionClearedByActionRef.current = false
    } else if (prevHasSelectionRef.current && !hasSelection && !selectionClearedByActionRef.current) {
      // Selection was cleared by clicking outside (not by popup action)
      // Use a small delay to allow popup button clicks to complete first
      const timeoutId = setTimeout(() => {
        if (!selectionClearedByActionRef.current) {
          setCapturedSelection(null)
        }
      }, 200)
      prevHasSelectionRef.current = hasSelection
      return () => clearTimeout(timeoutId)
    }
    prevHasSelectionRef.current = hasSelection
  }, [hasSelection, selection])

  // Auto-scroll to speaking paragraph when TTS is active
  useEffect(() => {
    if (speakingParagraph === null || !activeSection) return

    // Find the paragraph element by its data attribute
    // Note: Use window.document since 'document' is a prop name in this component
    const paragraphElement = window.document.querySelector(
      `[data-paragraph-index="${speakingParagraph}"]`
    ) as HTMLElement

    if (paragraphElement) {
      // Scroll the paragraph into view with smooth animation
      paragraphElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [speakingParagraph, activeSection])

  // Handle scroll to update active section
  useEffect(() => {
    if (!contentRef.current) return

    // Find the scroll container (ScrollArea viewport) by looking for scrollable parent
    const findScrollParent = (element: HTMLElement): HTMLElement | null => {
      let parent = element.parentElement
      while (parent) {
        const { overflow, overflowY } = getComputedStyle(parent)
        if (overflow === 'auto' || overflow === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') {
          return parent
        }
        parent = parent.parentElement
      }
      return null
    }

    const scrollContainer = findScrollParent(contentRef.current)
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop
      const offset = 100

      for (const section of sections) {
        const element = sectionRefs.current.get(section.id)
        if (element) {
          const top = element.offsetTop - offset
          const bottom = top + element.offsetHeight
          if (scrollTop >= top && scrollTop < bottom) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [sections])

  // Handle CMD+F / Ctrl+F keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Show continue reading prompt on mount if there's a saved position
  useEffect(() => {
    if (lastPosition && !hasShownPromptRef.current) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowContinuePrompt(true)
        hasShownPromptRef.current = true
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [lastPosition])

  // Save reading position when active section changes
  useEffect(() => {
    if (!activeSection) return

    const section = sections.find((s) => s.id === activeSection)
    if (!section) return

    const metadata = (section.metadata as { chapter_number?: string }) || {}

    savePosition({
      sectionId: activeSection,
      sectionTitle: section.title,
      scrollPosition: 0, // Could track actual scroll position if needed
      chapterNumber: metadata.chapter_number,
    })
  }, [activeSection, sections, savePosition])

  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current.get(sectionId)
    if (element) {
      // Use scrollIntoView for reliable scrolling regardless of scroll container
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)

      // Close tablet sidebar when navigating on mobile/tablet
      if (isTabletMode && tabletSidebarOpen) {
        setTabletSidebarOpen(false)
      }
    }
  }, [isTabletMode, tabletSidebarOpen, setTabletSidebarOpen])

  // Handle continue reading actions
  const handleContinueReading = useCallback(() => {
    if (lastPosition) {
      scrollToSection(lastPosition.sectionId)
    }
    setShowContinuePrompt(false)
  }, [lastPosition, scrollToSection])

  const handleStartFresh = useCallback(() => {
    clearPosition()
    setShowContinuePrompt(false)
  }, [clearPosition])

  const registerSectionRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) {
        sectionRefs.current.set(id, element)
      } else {
        sectionRefs.current.delete(id)
      }
    },
    []
  )

  const getCurrentText = useCallback(() => {
    if (!activeSection) return ''
    const section = sections.find((s) => s.id === activeSection)
    return section?.content || ''
  }, [activeSection, sections])

  // Handle creating a highlight for the current selection
  // Uses capturedSelection to avoid race conditions when clicking popup buttons
  const handleCreateHighlight = useCallback(
    async (color: string) => {
      const sel = capturedSelection
      if (!sel?.sectionId || !sel?.text) return

      await createHighlight({
        sectionId: sel.sectionId,
        textSelection: sel.text,
        positionStart: sel.startOffset,
        positionEnd: sel.endOffset,
        color,
      })

      selectionClearedByActionRef.current = true
      setCapturedSelection(null)
      clearSelection()
    },
    [capturedSelection, createHighlight, clearSelection]
  )

  // Handle clicking a highlight in the sidebar
  const handleHighlightClick = useCallback(
    (highlight: { section_id: string }) => {
      scrollToSection(highlight.section_id)
      setShowHighlightSidebar(false)
    },
    [scrollToSection]
  )

  // === Notes callbacks ===

  // Handle clicking a note in the sidebar
  const handleNoteClick = useCallback(
    (note: Note) => {
      scrollToSection(note.section_id)
      setShowNotesPanel(false)
    },
    [scrollToSection]
  )

  // Handle opening note editor to create a new note
  const handleCreateNote = useCallback((sectionId: string) => {
    setEditingNote(null)
    setNoteEditorSectionId(sectionId)
    setNoteEditorVisible(true)
  }, [])

  // Handle opening note editor to edit an existing note
  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note)
    setNoteEditorSectionId(note.section_id)
    setNoteEditorSelection(null) // No new selection when editing existing note
    setNoteEditorVisible(true)
  }, [])

  // Handle saving a note (create or update)
  const handleSaveNote = useCallback(
    async (content: string) => {
      if (editingNote) {
        // Update existing note
        await updateNote(editingNote.id, { content })
      } else if (noteEditorSectionId) {
        // Create new note - use stored selection data (not live selection which may be cleared)
        await createNote({
          sectionId: noteEditorSectionId,
          content,
          textSelection: noteEditorSelection?.text || undefined,
          positionStart: noteEditorSelection?.startOffset || undefined,
          positionEnd: noteEditorSelection?.endOffset || undefined,
        })
      }
      setNoteEditorVisible(false)
      setEditingNote(null)
      setNoteEditorSectionId(null)
      setNoteEditorSelection(null)
      clearSelection()
    },
    [
      editingNote,
      noteEditorSectionId,
      noteEditorSelection,
      updateNote,
      createNote,
      clearSelection,
    ]
  )

  // Handle deleting a note
  const handleDeleteNote = useCallback(
    async (id: string) => {
      await deleteNote(id)
    },
    [deleteNote]
  )

  // Handle closing note editor
  const handleCloseNoteEditor = useCallback(() => {
    setNoteEditorVisible(false)
    setEditingNote(null)
    setNoteEditorSectionId(null)
  }, [])

  // === AI Assistant callbacks ===

  // Handle opening AI assistant from selection
  // Uses capturedSelection to avoid race conditions when clicking popup buttons
  const handleOpenAI = useCallback(() => {
    const sel = capturedSelection
    if (sel?.text && sel?.sectionId) {
      setAiSelectedText(sel.text)
      // Store the selection data for positioning AI notes
      setAiSelectionData({
        sectionId: sel.sectionId,
        startOffset: sel.startOffset,
        endOffset: sel.endOffset,
      })
      setShowAIAssistant(true)
      selectionClearedByActionRef.current = true
      setCapturedSelection(null)
    }
  }, [capturedSelection])

  // Handle closing AI assistant
  const handleCloseAI = useCallback(() => {
    setShowAIAssistant(false)
    setAiSelectedText('')
    setAiSelectionData(null)
  }, [])

  // Handle saving AI response as note
  const handleSaveAIAsNote = useCallback(
    async (content: string, textSelection: string) => {
      // Use stored AI selection data for accurate positioning
      const sectionId = aiSelectionData?.sectionId || activeSection
      if (!sectionId) return

      await createNote({
        sectionId,
        content: `**KI-Erklärung:**\n\n${content}`,
        textSelection,
        positionStart: aiSelectionData?.startOffset || undefined,
        positionEnd: aiSelectionData?.endOffset || undefined,
      })
    },
    [aiSelectionData, activeSection, createNote]
  )

  // === Flashcard callbacks ===

  // Handle opening flashcard generator from selection
  // Uses capturedSelection to avoid race conditions when clicking popup buttons
  const handleOpenFlashcardGenerator = useCallback(() => {
    const sel = capturedSelection
    if (sel?.text && sel?.sectionId) {
      setFlashcardSelectedText(sel.text)
      setFlashcardSectionId(sel.sectionId)
      setShowFlashcardGenerator(true)
      selectionClearedByActionRef.current = true
      setCapturedSelection(null)
    }
  }, [capturedSelection])

  // Handle closing flashcard generator
  const handleCloseFlashcardGenerator = useCallback(() => {
    setShowFlashcardGenerator(false)
    setFlashcardSelectedText('')
    setFlashcardSectionId(null)
    clearSelection()
  }, [clearSelection])

  // Handle saving flashcard
  const handleSaveFlashcard = useCallback(
    async (question: string, answer: string) => {
      if (!flashcardSectionId) return

      await createFlashcard({
        documentId: document.id,
        sectionId: flashcardSectionId,
        question,
        answer,
        sourceText: flashcardSelectedText,
      })

      handleCloseFlashcardGenerator()
    },
    [document.id, flashcardSectionId, flashcardSelectedText, createFlashcard, handleCloseFlashcardGenerator]
  )

  // Handle creating note from selection (used in popup)
  // Uses capturedSelection to avoid race conditions when clicking popup buttons
  const handleAddNoteFromSelection = useCallback(() => {
    const sel = capturedSelection
    if (sel?.sectionId) {
      setEditingNote(null)
      setNoteEditorSectionId(sel.sectionId)
      // Store the selection data so it persists while user types in note editor
      setNoteEditorSelection({
        text: sel.text,
        startOffset: sel.startOffset,
        endOffset: sel.endOffset,
      })
      setNoteEditorVisible(true)
      selectionClearedByActionRef.current = true
      setCapturedSelection(null)
    }
  }, [capturedSelection])

  // Check if captured selection is in a specific section
  // Uses capturedSelection to avoid race conditions when clicking popup buttons
  const isSelectionInSection = useCallback(
    (sectionId: string) => {
      return capturedSelection?.sectionId === sectionId
    },
    [capturedSelection?.sectionId]
  )

  // Clear captured selection when clicking outside or closing popup
  const clearCapturedSelection = useCallback(() => {
    selectionClearedByActionRef.current = true
    setCapturedSelection(null)
    clearSelection()
  }, [clearSelection])

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Sidebar with Table of Contents - always visible on left */}
      <aside
        className={cn(
          'border-r bg-muted/30 transition-all duration-300 flex flex-col',
          isSidebarOpen
            ? isTabletMode ? 'w-64' : 'w-72'
            : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-4 border-b flex-shrink-0">
          <Link href="/documents">
            <Button
              variant="ghost"
              size={isTabletMode ? 'touch-sm' : 'sm'}
              className="mb-2"
            >
              ← Zurück
            </Button>
          </Link>
          <h2 className="font-semibold text-lg line-clamp-2">{document.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sections.length} Abschnitte
          </p>
        </div>
        <ScrollArea className="flex-1">
          <TableOfContents
            sections={sections}
            activeSection={activeSection}
            onSelectSection={scrollToSection}
            readProgress={readProgress}
            completedSections={completedSections}
            onMarkCompleted={handleMarkChapterCompleted}
            highlightCounts={highlightCounts}
            noteCounts={noteCounts}
            isTabletMode={isTabletMode}
          />
        </ScrollArea>
      </aside>

      {/* Main content area with sticky sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Content with sticky right sidebar */}
        <div className="flex-1 flex overflow-hidden">
          <ScrollArea className="flex-1 relative">
            {/* Toolbar - sticky inside ScrollArea */}
            <div className={cn(
            "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm transition-all duration-300",
            isToolbarCollapsed ? "py-1" : "p-2"
          )}>
            <AnimatePresence mode="wait">
              {isToolbarCollapsed ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsToolbarCollapsed(false)}
                    className="h-6 px-4 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Toolbar einblenden
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size={isTabletMode ? 'touch-sm' : 'sm'}
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                      {isSidebarOpen ? '◀' : '▶'} Inhalt
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Search button */}
                    <Button
                      variant="ghost"
                      size={isTabletMode ? 'touch-sm' : 'sm'}
                      onClick={() => setShowSearch(true)}
                      title="Suchen (⌘F)"
                      className="gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">Suchen</span>
                    </Button>

                    <TextToSpeech
                      text={getCurrentText()}
                      selectedText={capturedSelection?.text}
                      onParagraphChange={setSpeakingParagraph}
                    />

                    {/* Flashcard learning button */}
                    <Button
                      variant={showFlashcardDeck ? 'secondary' : 'ghost'}
                      size={isTabletMode ? 'touch-sm' : 'sm'}
                      onClick={() => setShowFlashcardDeck(true)}
                      title="Lernkarten lernen"
                      className="gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline">Lernen</span>
                      {flashcards.length > 0 && (
                        <span className="bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {flashcards.length}
                        </span>
                      )}
                    </Button>

                    {/* Export button */}
                    <Button
                      variant="ghost"
                      size={isTabletMode ? 'touch-sm' : 'sm'}
                      onClick={() => setShowExportPanel(true)}
                      title="Exportieren"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>

                    {/* Author Mode Toggle */}
                    <AuthorModeToggle
                      isAuthorMode={isAuthorMode}
                      onToggle={toggleAuthorMode}
                      canEdit={canEdit}
                    />

                    {/* NotebookLM Link */}
                    <a
                      href="https://notebooklm.google.com/notebook/9811e9bb-11a8-4b3e-b9e2-48997589dca7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button
                        variant="notebooklm"
                        size={isTabletMode ? 'icon-touch-sm' : 'icon-sm'}
                        title="Als Podcast in NotebookLM anhören"
                      >
                        <Radio className="w-4 h-4" />
                      </Button>
                    </a>

                    {/* Device Mode Selector */}
                    <DeviceModeSelector />

                    {/* Collapse toolbar button */}
                    <Button
                      variant="ghost"
                      size={isTabletMode ? 'icon-touch-sm' : 'icon-sm'}
                      onClick={() => setIsToolbarCollapsed(true)}
                      title="Toolbar einklappen"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            <div ref={contentRef}>
              {/* Document Cover - Fullscreen */}
              <div className="overflow-hidden">
                <DocumentCover
                  title={document.title}
                  subtitle="Studienbrief 1"
                  institution="FOM Hochschule"
                  author={{
                    name: "Dr. Renata Cherubim, LL.M.",
                    title: "Wissenschaftliche Mitarbeiterin und Lehrende an der FOM Hochschule seit 2020",
                    bio: "Schwerpunkte in Lehre und Forschung: Grundlagen des Rechts, Verfassungsrecht, Europarecht, Juristenausbildung und Nachhaltigkeit und Recht",
                    quote: "Rechtsmethoden ermöglichen es Ihnen, eine juristisch vertretbare Lösung für ein Problem zu finden und diese so objektiv und überzeugend wie möglich darzulegen.",
                    imageUrl: "/images/author-cherubim.jpg"
                  }}
                />
              </div>

              {/* Table of Contents */}
              <div className="overflow-hidden -mt-8">
                <FullscreenTableOfContents
                  sections={sections}
                  onSelectSection={scrollToSection}
                />
              </div>

              {/* Content sections */}
              <div className={cn(
                "max-w-3xl mx-auto px-8 py-12 mt-8",
                (showHighlightSidebar || showNotesPanel) && "lg:mr-0 lg:max-w-none lg:pr-4"
              )}>
              {/* Add button at top (only in author mode) */}
              {isAuthorMode && canEdit && (
                <div className="relative">
                  <AddSectionButton
                    onClick={() => sectionManagement.setShowAddMenuAfter('__top__')}
                    isFirst
                  />
                  <AddSectionMenu
                    isOpen={sectionManagement.showAddMenuAfter === '__top__'}
                    onClose={() => sectionManagement.setShowAddMenuAfter(null)}
                    onSelect={async (type, title) => {
                      await sectionManagement.createSection({
                        section_type: type,
                        title,
                        afterSectionId: null,
                      })
                    }}
                    isCreating={sectionManagement.isCreating}
                  />
                </div>
              )}

              {displaySections.length > 0 ? (
                displaySections.map((section, index) => (
                  <div key={section.id} className="group relative">
                    {/* Section Action Bar (author mode only) */}
                    {isAuthorMode && canEdit && (
                      <SectionActionBar
                        section={section}
                        onEdit={() => startEditing(section)}
                        onDelete={() => sectionManagement.setConfirmDeleteId(section.id)}
                        onMoveUp={() => sectionManagement.reorderSection(section.id, 'up')}
                        onMoveDown={() => sectionManagement.reorderSection(section.id, 'down')}
                        onTypeChange={(type) => sectionManagement.updateSectionType(section.id, type)}
                        isFirst={index === 0}
                        isLast={index === displaySections.length - 1}
                        isReordering={sectionManagement.isReordering}
                      />
                    )}

                    <SectionView
                      section={section}
                      ref={(el) => registerSectionRef(section.id, el)}
                      isActive={activeSection === section.id}
                      speakingParagraph={
                        activeSection === section.id ? speakingParagraph : null
                      }
                      sectionIndex={index}
                      highlights={getHighlightsForSection(section.id)}
                      notes={getNotesForSection(section.id)}
                      onCreateHighlight={
                        isSelectionInSection(section.id)
                          ? handleCreateHighlight
                          : undefined
                      }
                      onDeleteHighlight={deleteHighlight}
                      onAddNote={
                        isSelectionInSection(section.id)
                          ? handleAddNoteFromSelection
                          : undefined
                      }
                      onAskAI={
                        isSelectionInSection(section.id) ? handleOpenAI : undefined
                      }
                      onCreateFlashcard={
                        isSelectionInSection(section.id)
                          ? handleOpenFlashcardGenerator
                          : undefined
                      }
                      onNoteClick={handleEditNote}
                      selectionRect={
                        isSelectionInSection(section.id) ? capturedSelection?.rect ?? null : null
                      }
                      hasSelection={isSelectionInSection(section.id)}
                      solutionSection={solutionMap.get(section.id) || null}
                      isBookmarked={hasBookmark(section.id)}
                      onToggleBookmark={() => toggleBookmark(section.id)}
                      isEditMode={isAuthorMode}
                      onEdit={isAuthorMode ? () => startEditing(section) : undefined}
                    />

                    {/* Add button after section (author mode only) */}
                    {isAuthorMode && canEdit && (
                      <div className="relative">
                        <AddSectionButton
                          onClick={() => sectionManagement.setShowAddMenuAfter(section.id)}
                        />
                        <AddSectionMenu
                          isOpen={sectionManagement.showAddMenuAfter === section.id}
                          onClose={() => sectionManagement.setShowAddMenuAfter(null)}
                          onSelect={async (type, title) => {
                            await sectionManagement.createSection({
                              section_type: type,
                              title,
                              afterSectionId: section.id,
                            })
                          }}
                          isCreating={sectionManagement.isCreating}
                        />
                      </div>
                    )}

                    {index < displaySections.length - 1 && !isAuthorMode && (
                      <Separator className="my-8" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Dieses Dokument hat keinen extrahierten Text.</p>
                  <p className="text-sm mt-1">
                    Möglicherweise ist die PDF bildbasiert oder geschützt.
                  </p>
                </div>
              )}
              </div>
            </div>
          </ScrollArea>

          {/* Sticky right sidebar for Highlights/Notes */}
          <AnimatePresence mode="wait">
            {showHighlightSidebar && (
              <motion.aside
                key="highlight-sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:block border-l bg-muted/30 overflow-hidden"
              >
                <HighlightSidebar
                  isOpen={true}
                  isSticky={true}
                  onClose={() => setShowHighlightSidebar(false)}
                  highlights={highlights}
                  sections={sections}
                  onHighlightClick={handleHighlightClick}
                  onDeleteHighlight={deleteHighlight}
                  onToggleForReview={toggleForReview}
                />
              </motion.aside>
            )}
            {showNotesPanel && (
              <motion.aside
                key="notes-sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:block border-l bg-muted/30 overflow-hidden"
              >
                <NotesPanel
                  isOpen={true}
                  isSticky={true}
                  onClose={() => setShowNotesPanel(false)}
                  notes={notes}
                  sections={sections}
                  onNoteClick={handleNoteClick}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onCreateNote={handleCreateNote}
                  isTabletMode={isTabletMode}
                />
              </motion.aside>
            )}
            {showBookmarkSidebar && (
              <motion.aside
                key="bookmark-sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:block border-l bg-muted/30 overflow-hidden"
              >
                <BookmarkSidebar
                  isOpen={true}
                  isSticky={true}
                  onClose={() => setShowBookmarkSidebar(false)}
                  bookmarks={bookmarks}
                  sections={sections}
                  onBookmarkClick={(bookmark) => {
                    scrollToSection(bookmark.section_id)
                    setShowBookmarkSidebar(false)
                  }}
                  onDeleteBookmark={removeBookmark}
                  isTabletMode={isTabletMode}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile/Tablet: Overlay panels (shown on smaller screens) */}
      <div className="lg:hidden">
        <HighlightSidebar
          isOpen={showHighlightSidebar}
          onClose={() => setShowHighlightSidebar(false)}
          highlights={highlights}
          sections={sections}
          onHighlightClick={handleHighlightClick}
          onDeleteHighlight={deleteHighlight}
          onToggleForReview={toggleForReview}
        />
        <NotesPanel
          isOpen={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
          notes={notes}
          sections={sections}
          onNoteClick={handleNoteClick}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onCreateNote={handleCreateNote}
          isTabletMode={isTabletMode}
        />
        <BookmarkSidebar
          isOpen={showBookmarkSidebar}
          onClose={() => setShowBookmarkSidebar(false)}
          bookmarks={bookmarks}
          sections={sections}
          onBookmarkClick={(bookmark) => {
            scrollToSection(bookmark.section_id)
            setShowBookmarkSidebar(false)
          }}
          onDeleteBookmark={removeBookmark}
          isTabletMode={isTabletMode}
        />
      </div>

      {/* Note Editor */}
      <NoteEditor
        visible={noteEditorVisible}
        initialContent={editingNote?.content || ''}
        selectedText={selection.text || undefined}
        isTabletMode={isTabletMode}
        onSave={handleSaveNote}
        onClose={handleCloseNoteEditor}
        onDelete={
          editingNote
            ? async () => {
                await deleteNote(editingNote.id)
                handleCloseNoteEditor()
              }
            : undefined
        }
        position={
          selection.rect
            ? { x: selection.rect.left, y: selection.rect.bottom }
            : undefined
        }
      />

      {/* AI Assistant */}
      <AIAssistant
        visible={showAIAssistant}
        selectedText={aiSelectedText}
        onClose={handleCloseAI}
        isTabletMode={isTabletMode}
        onSaveAsNote={handleSaveAIAsNote}
        position={
          selection.rect
            ? { x: selection.rect.left, y: selection.rect.bottom }
            : undefined
        }
      />

      {/* Document Search */}
      <DocumentSearch
        sections={sections}
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={scrollToSection}
      />

      {/* Flashcard Generator */}
      <FlashcardGenerator
        visible={showFlashcardGenerator}
        selectedText={flashcardSelectedText}
        onSave={handleSaveFlashcard}
        onClose={handleCloseFlashcardGenerator}
      />

      {/* Export Panel */}
      <ExportPanel
        visible={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        documentTitle={document.title}
        sections={sections}
        highlights={highlights}
        notes={notes}
      />

      {/* Continue Reading Prompt */}
      <ContinueReadingPrompt
        position={lastPosition}
        visible={showContinuePrompt}
        onContinue={handleContinueReading}
        onStartFresh={handleStartFresh}
        onDismiss={() => setShowContinuePrompt(false)}
        isTabletMode={isTabletMode}
      />

      {/* Flashcard Learning Panel */}
      <AnimatePresence>
        {showFlashcardDeck && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFlashcardDeck(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 z-50 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl md:max-h-[90vh] overflow-auto bg-background rounded-2xl shadow-2xl"
            >
              <div className="p-6">
                <FlashcardDeck
                  flashcards={flashcards}
                  onUpdateReview={updateFlashcardReview}
                  onClose={() => setShowFlashcardDeck(false)}
                  isLoading={flashcardsLoading}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pomodoro Timer */}
      <PomodoroTimer />

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          isOpen={isEditing}
          onClose={cancelEditing}
          onSave={saveSection}
          isSaving={isSaving}
          error={editError}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        section={localSections.find(s => s.id === sectionManagement.confirmDeleteId) || null}
        isOpen={!!sectionManagement.confirmDeleteId}
        onClose={() => sectionManagement.setConfirmDeleteId(null)}
        onConfirm={() => {
          if (sectionManagement.confirmDeleteId) {
            sectionManagement.deleteSection(sectionManagement.confirmDeleteId)
          }
        }}
        isDeleting={sectionManagement.isDeleting}
      />

      {/* MiniMap - Fixed position on right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30">
        <MiniMap
          sections={localSections}
          activeSectionId={activeSection}
          readSections={completedSectionsSet}
          onSectionClick={scrollToSection}
          isAuthorMode={isAuthorMode}
        />
      </div>

    </div>
  )
}

export function DocumentReader({ document, sections }: DocumentReaderProps) {
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  return (
    <TabletModeProvider>
      <HighlightProvider sectionIds={sectionIds}>
        <DocumentReaderContent document={document} sections={sections} />
      </HighlightProvider>
    </TabletModeProvider>
  )
}
