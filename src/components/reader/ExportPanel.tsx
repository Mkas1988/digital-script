'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  FileText,
  FileType,
  BookmarkCheck,
  Highlighter,
  StickyNote,
  Loader2,
  Printer,
  Image,
  SeparatorHorizontal,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { scaleIn } from '@/lib/animations'
import { generateMarkdownExport, downloadMarkdown } from '@/lib/export/markdown-export'
import { generatePdfExport } from '@/lib/export/pdf-export'
import type { Section, Annotation, SectionMetadata } from '@/lib/supabase/types'
import type { Note } from '@/hooks/useNotes'

interface ExportPanelProps {
  visible: boolean
  onClose: () => void
  documentTitle: string
  sections: Section[]
  highlights: Annotation[]
  notes: Note[]
}

type ExportFormat = 'markdown' | 'pdf' | 'print'
type ExportFilter = 'all' | 'highlights' | 'notes' | 'review'

interface PrintOptions {
  showHighlights: boolean
  showNotes: boolean
  showImages: boolean
  pageBreaksBetweenSections: boolean
}

/**
 * Export panel for exporting annotations as Markdown or PDF
 */
export function ExportPanel({
  visible,
  onClose,
  documentTitle,
  sections,
  highlights,
  notes,
}: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown')
  const [filter, setFilter] = useState<ExportFilter>('all')
  const [isExporting, setIsExporting] = useState(false)
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    showHighlights: true,
    showNotes: true,
    showImages: true,
    pageBreaksBetweenSections: true,
  })
  const printFrameRef = useRef<HTMLIFrameElement>(null)

  // Get counts for display
  const highlightCount = highlights.length
  const forReviewCount = highlights.filter((h) => h.for_review).length
  const noteCount = notes.length

  // Generate print HTML
  const generatePrintHtml = useCallback(() => {
    const sectionHighlights = new Map<string, Annotation[]>()
    const sectionNotes = new Map<string, Note[]>()

    if (printOptions.showHighlights) {
      highlights.forEach(h => {
        const list = sectionHighlights.get(h.section_id) || []
        list.push(h)
        sectionHighlights.set(h.section_id, list)
      })
    }

    if (printOptions.showNotes) {
      notes.forEach(n => {
        const list = sectionNotes.get(n.section_id) || []
        list.push(n)
        sectionNotes.set(n.section_id, list)
      })
    }

    const sectionsHtml = sections.map((section, index) => {
      const metadata = (section.metadata as SectionMetadata) || {}
      const sectionHighs = sectionHighlights.get(section.id) || []
      const sectionNts = sectionNotes.get(section.id) || []

      // Apply highlights to content
      let content = section.content
      if (printOptions.showHighlights && sectionHighs.length > 0) {
        sectionHighs
          .filter(h => h.text_selection)
          .forEach(h => {
            const escapedText = h.text_selection!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            content = content.replace(
              new RegExp(escapedText, 'g'),
              `<mark style="background-color: ${h.color || '#fef08a'}; padding: 2px 0;">${h.text_selection}</mark>`
            )
          })
      }

      // Replace markdown-style formatting
      content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')

      const notesHtml = sectionNts.length > 0 ? `
        <div style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <div style="font-weight: 600; font-size: 12px; color: #92400e; margin-bottom: 8px;">📝 Notizen</div>
          ${sectionNts.map(n => `
            <div style="margin-bottom: 8px; font-size: 13px;">
              ${n.text_selection ? `<div style="font-style: italic; color: #666; margin-bottom: 4px;">"${n.text_selection}"</div>` : ''}
              <div>${n.content}</div>
            </div>
          `).join('')}
        </div>
      ` : ''

      return `
        <div class="section" ${printOptions.pageBreaksBetweenSections && index > 0 ? 'style="page-break-before: always;"' : ''}>
          ${metadata.chapter_number ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Kapitel ${metadata.chapter_number}</div>` : ''}
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #1f2937;">${section.title}</h2>
          <div style="font-size: 14px; line-height: 1.7; color: #374151;">${content}</div>
          ${notesHtml}
        </div>
      `
    }).join('<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        <style>
          @page { margin: 2cm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .header p {
            font-size: 14px;
            color: #6b7280;
          }
          mark { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${documentTitle}</h1>
          <p>Exportiert am ${new Date().toLocaleDateString('de-DE')}</p>
        </div>
        ${sectionsHtml}
      </body>
      </html>
    `
  }, [sections, highlights, notes, printOptions, documentTitle])

  // Handle print
  const handlePrint = useCallback(() => {
    const html = generatePrintHtml()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }, [generatePrintHtml])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const options = {
        includeHighlights: filter === 'all' || filter === 'highlights' || filter === 'review',
        includeNotes: filter === 'all' || filter === 'notes',
        includeForReviewOnly: filter === 'review',
      }

      const data = {
        documentTitle,
        sections,
        highlights,
        notes,
      }

      if (format === 'markdown') {
        const content = generateMarkdownExport(data, options)
        const filename = `${documentTitle.slice(0, 50).replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')}_export`
        downloadMarkdown(content, filename)
      } else if (format === 'pdf') {
        generatePdfExport(data, options)
      } else if (format === 'print') {
        handlePrint()
      }

      // Close panel after export
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [format, filter, documentTitle, sections, highlights, notes, onClose, handlePrint])

  // Close and reset
  const handleClose = useCallback(() => {
    setFormat('markdown')
    setFilter('all')
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed z-50',
              'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md',
              'bg-white dark:bg-gray-900',
              'rounded-2xl shadow-2xl',
              'border border-gray-200/50 dark:border-gray-700/50',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h2 className="font-semibold">Exportieren</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5">
              {/* Statistics */}
              <GlassCard variant="default" className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Highlighter className="w-3.5 h-3.5" />
                      {highlightCount} Markierungen
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <StickyNote className="w-3.5 h-3.5" />
                      {noteCount} Notizen
                    </span>
                  </div>
                  {forReviewCount > 0 && (
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      {forReviewCount} zur Vertiefung
                    </span>
                  )}
                </div>
              </GlassCard>

              {/* Format Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormat('markdown')}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border transition-all',
                      'text-sm font-medium',
                      format === 'markdown'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <p>Markdown</p>
                      <p className="text-xs font-normal text-muted-foreground">.md</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormat('pdf')}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border transition-all',
                      'text-sm font-medium',
                      format === 'pdf'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <FileType className="w-5 h-5" />
                    <div className="text-left">
                      <p>PDF</p>
                      <p className="text-xs font-normal text-muted-foreground">.pdf</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormat('print')}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border transition-all',
                      'text-sm font-medium',
                      format === 'print'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <Printer className="w-5 h-5" />
                    <div className="text-left">
                      <p>Drucken</p>
                      <p className="text-xs font-normal text-muted-foreground">Vorschau</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Print Options (only shown when print format is selected) */}
              {format === 'print' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Druckoptionen
                  </label>
                  <PrintOption
                    checked={printOptions.showHighlights}
                    onChange={(checked) => setPrintOptions(prev => ({ ...prev, showHighlights: checked }))}
                    label="Markierungen anzeigen"
                    icon={<Highlighter className="w-4 h-4" />}
                  />
                  <PrintOption
                    checked={printOptions.showNotes}
                    onChange={(checked) => setPrintOptions(prev => ({ ...prev, showNotes: checked }))}
                    label="Notizen anzeigen"
                    icon={<StickyNote className="w-4 h-4" />}
                  />
                  <PrintOption
                    checked={printOptions.pageBreaksBetweenSections}
                    onChange={(checked) => setPrintOptions(prev => ({ ...prev, pageBreaksBetweenSections: checked }))}
                    label="Seitenumbrüche zwischen Abschnitten"
                    icon={<SeparatorHorizontal className="w-4 h-4" />}
                  />
                </div>
              )}

              {/* Filter Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Inhalt
                </label>
                <div className="space-y-2">
                  <FilterOption
                    value="all"
                    current={filter}
                    onChange={setFilter}
                    label="Alles exportieren"
                    description="Alle Markierungen und Notizen"
                    icon={<Download className="w-4 h-4" />}
                  />
                  <FilterOption
                    value="highlights"
                    current={filter}
                    onChange={setFilter}
                    label="Nur Markierungen"
                    description={`${highlightCount} Markierungen`}
                    icon={<Highlighter className="w-4 h-4" />}
                  />
                  <FilterOption
                    value="notes"
                    current={filter}
                    onChange={setFilter}
                    label="Nur Notizen"
                    description={`${noteCount} Notizen`}
                    icon={<StickyNote className="w-4 h-4" />}
                  />
                  {forReviewCount > 0 && (
                    <FilterOption
                      value="review"
                      current={filter}
                      onChange={setFilter}
                      label="Zur Vertiefung"
                      description={`${forReviewCount} Markierungen zur Wiederholung`}
                      icon={<BookmarkCheck className="w-4 h-4" />}
                    />
                  )}
                </div>
              </div>

              {/* Export Button */}
              <Button
                variant="premium"
                className="w-full"
                onClick={handleExport}
                disabled={isExporting || (format !== 'print' && highlightCount === 0 && noteCount === 0)}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportiere...
                  </>
                ) : (
                  <>
                    {format === 'print' ? (
                      <Printer className="w-4 h-4 mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {format === 'markdown' && 'Als Markdown herunterladen'}
                    {format === 'pdf' && 'PDF generieren'}
                    {format === 'print' && 'Druckvorschau öffnen'}
                  </>
                )}
              </Button>

              {highlightCount === 0 && noteCount === 0 && format !== 'print' && (
                <p className="text-xs text-center text-muted-foreground">
                  Keine Annotationen zum Exportieren vorhanden.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface FilterOptionProps {
  value: ExportFilter
  current: ExportFilter
  onChange: (value: ExportFilter) => void
  label: string
  description: string
  icon: React.ReactNode
}

function FilterOption({
  value,
  current,
  onChange,
  label,
  description,
  icon,
}: FilterOptionProps) {
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
        current === value
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          current === value
            ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400'
            : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

interface PrintOptionProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  icon: React.ReactNode
}

function PrintOption({ checked, onChange, label, icon }: PrintOptionProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
        checked
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
          checked
            ? 'bg-brand-500 border-brand-500 text-white'
            : 'border-gray-300 dark:border-gray-600'
        )}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
    </button>
  )
}
