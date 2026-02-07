'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SectionTypeSelector } from './SectionTypeSelector'
import { MarkdownToolbar, useMarkdownShortcuts } from './MarkdownToolbar'
import type { Section, SectionType, SectionMetadata } from '@/lib/supabase/types'

interface SectionEditorProps {
  section: Section
  isOpen: boolean
  onClose: () => void
  onSave: (updates: {
    title?: string
    content?: string
    section_type?: SectionType
    metadata?: Partial<SectionMetadata>
  }) => Promise<boolean>
  isSaving?: boolean
  error?: string | null
}

/**
 * Modal editor for sections with Markdown support and live preview
 */
export function SectionEditor({
  section,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  error = null,
}: SectionEditorProps) {
  // Local state for editing
  const [title, setTitle] = useState(section.title)
  const [content, setContent] = useState(section.content)
  const [sectionType, setSectionType] = useState<SectionType>(section.section_type)
  const [chapterNumber, setChapterNumber] = useState(
    (section.metadata as SectionMetadata)?.chapter_number || ''
  )
  const [isDirty, setIsDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { handleKeyDown } = useMarkdownShortcuts(textareaRef, setContent)

  // Reset state when section changes
  useEffect(() => {
    setTitle(section.title)
    setContent(section.content)
    setSectionType(section.section_type)
    setChapterNumber((section.metadata as SectionMetadata)?.chapter_number || '')
    setIsDirty(false)
  }, [section])

  // Mark as dirty when any field changes
  const handleTitleChange = useCallback((value: string) => {
    setTitle(value)
    setIsDirty(true)
  }, [])

  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    setIsDirty(true)
  }, [])

  const handleTypeChange = useCallback((value: SectionType) => {
    setSectionType(value)
    setIsDirty(true)
  }, [])

  const handleChapterNumberChange = useCallback((value: string) => {
    setChapterNumber(value)
    setIsDirty(true)
  }, [])

  // Handle save
  const handleSave = async () => {
    const updates: {
      title?: string
      content?: string
      section_type?: SectionType
      metadata?: Partial<SectionMetadata>
    } = {}

    // Only include changed fields
    if (title !== section.title) {
      updates.title = title
    }
    if (content !== section.content) {
      updates.content = content
    }
    if (sectionType !== section.section_type) {
      updates.section_type = sectionType
    }

    const oldChapterNumber = (section.metadata as SectionMetadata)?.chapter_number
    if (chapterNumber !== oldChapterNumber) {
      updates.metadata = { chapter_number: chapterNumber || undefined }
    }

    // Don't save if nothing changed
    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    const success = await onSave(updates)
    if (success) {
      setIsDirty(false)
      onClose()
    }
  }

  // Handle keyboard shortcuts
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S = Save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      handleSave()
      return
    }

    // Escape = Close (if not dirty)
    if (e.key === 'Escape') {
      if (!isDirty) {
        onClose()
      }
      return
    }

    // Pass to markdown shortcuts handler
    handleKeyDown(e)
  }

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('Du hast ungespeicherte Änderungen. Wirklich schließen?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Editor Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed inset-4 z-50',
              'md:inset-8 lg:inset-12 xl:inset-16',
              'bg-background border rounded-xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Section Type Selector */}
                <SectionTypeSelector
                  value={sectionType}
                  onChange={handleTypeChange}
                  disabled={isSaving}
                  className="w-40 shrink-0"
                />

                {/* Chapter Number */}
                <input
                  type="text"
                  value={chapterNumber}
                  onChange={(e) => handleChapterNumberChange(e.target.value)}
                  placeholder="Nr."
                  disabled={isSaving}
                  className={cn(
                    'w-16 px-2 py-2 text-sm',
                    'bg-background border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-primary',
                    'disabled:opacity-50'
                  )}
                />

                {/* Dirty Indicator */}
                {isDirty && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                    Ungespeichert
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Preview */}
                <Button
                  type="button"
                  variant={showPreview ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="hidden md:flex"
                >
                  Vorschau
                </Button>

                {/* Save Button */}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Speichern
                    </>
                  )}
                </Button>

                {/* Close Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Title Input */}
            <div className="px-4 py-3 border-b">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titel..."
                disabled={isSaving}
                className={cn(
                  'w-full px-3 py-2 text-lg font-semibold',
                  'bg-background border rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'disabled:opacity-50'
                )}
              />
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex min-h-0">
              {/* Editor Side */}
              <div className={cn(
                'flex-1 flex flex-col min-w-0',
                showPreview ? 'md:w-1/2' : 'w-full'
              )}>
                {/* Markdown Toolbar */}
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  onContentChange={handleContentChange}
                  disabled={isSaving}
                />

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  disabled={isSaving}
                  placeholder="Markdown-Inhalt eingeben..."
                  className={cn(
                    'flex-1 w-full p-4 resize-none',
                    'font-mono text-sm leading-relaxed',
                    'bg-background',
                    'focus:outline-none',
                    'disabled:opacity-50'
                  )}
                />
              </div>

              {/* Preview Side */}
              {showPreview && (
                <div className="hidden md:flex flex-col w-1/2 border-l min-w-0">
                  <div className="px-4 py-2 bg-muted/30 border-b">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Vorschau
                    </span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      {title && (
                        <h2 className="text-xl font-bold mb-4">{title}</h2>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
              <div>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+S</kbd> Speichern
                <span className="mx-2">|</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+B</kbd> Fett
                <span className="mx-2">|</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+I</kbd> Kursiv
              </div>
              <div>
                {content.length} Zeichen
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
