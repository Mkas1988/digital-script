import type { Section, Annotation } from '@/lib/supabase/types'
import type { Note } from '@/hooks/useNotes'

interface ExportOptions {
  includeHighlights: boolean
  includeNotes: boolean
  includeForReviewOnly: boolean
}

interface ExportData {
  documentTitle: string
  sections: Section[]
  highlights: Annotation[]
  notes: Note[]
}

/**
 * Generate markdown export of document annotations
 */
export function generateMarkdownExport(
  data: ExportData,
  options: ExportOptions
): string {
  const { documentTitle, sections, highlights, notes } = data
  const { includeHighlights, includeNotes, includeForReviewOnly } = options

  const lines: string[] = []

  // Header
  lines.push(`# ${documentTitle}`)
  lines.push('')
  lines.push(`*Exportiert am ${new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}*`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Filter highlights if needed
  let filteredHighlights = highlights
  if (includeForReviewOnly) {
    filteredHighlights = highlights.filter((h) => h.for_review)
  }

  // Filter notes if needed
  let filteredNotes = notes
  if (includeForReviewOnly) {
    // Notes don't have for_review, so we include all if not filtering by review
    filteredNotes = []
  }

  // Statistics
  const stats: string[] = []
  if (includeHighlights) {
    stats.push(`${filteredHighlights.length} Markierungen`)
    const forReviewCount = filteredHighlights.filter((h) => h.for_review).length
    if (forReviewCount > 0 && !includeForReviewOnly) {
      stats.push(`${forReviewCount} zur Vertiefung`)
    }
  }
  if (includeNotes && !includeForReviewOnly) {
    stats.push(`${filteredNotes.length} Notizen`)
  }

  if (stats.length > 0) {
    lines.push(`**Zusammenfassung:** ${stats.join(' | ')}`)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Group annotations by section
  for (const section of sections) {
    const sectionHighlights = filteredHighlights.filter(
      (h) => h.section_id === section.id
    )
    const sectionNotes = filteredNotes.filter((n) => n.section_id === section.id)

    // Skip section if no annotations
    if (
      (!includeHighlights || sectionHighlights.length === 0) &&
      (!includeNotes || sectionNotes.length === 0)
    ) {
      continue
    }

    // Section header
    lines.push(`## ${section.title}`)
    if (section.page_start) {
      lines.push(`*Seite ${section.page_start}${section.page_end && section.page_end !== section.page_start ? ` - ${section.page_end}` : ''}*`)
    }
    lines.push('')

    // Highlights
    if (includeHighlights && sectionHighlights.length > 0) {
      lines.push('### Markierungen')
      lines.push('')

      for (const highlight of sectionHighlights) {
        const forReviewBadge = highlight.for_review ? ' [Zur Vertiefung]' : ''
        const colorName = getColorName(highlight.color || '#FFEB3B')

        lines.push(`> **${colorName}${forReviewBadge}**`)
        lines.push(`> `)
        lines.push(`> "${highlight.text_selection}"`)

        if (highlight.content) {
          lines.push(`>`)
          lines.push(`> *Kommentar:* ${highlight.content}`)
        }
        lines.push('')
      }
    }

    // Notes
    if (includeNotes && sectionNotes.length > 0) {
      lines.push('### Notizen')
      lines.push('')

      for (const note of sectionNotes) {
        const date = new Date(note.created_at).toLocaleDateString('de-DE')
        lines.push(`**${date}**`)

        if (note.text_selection) {
          lines.push('')
          lines.push(`> Bezug: "${note.text_selection}"`)
        }

        lines.push('')
        lines.push(note.content || '')
        lines.push('')
        lines.push('---')
        lines.push('')
      }
    }
  }

  // Footer
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Erstellt mit Digitales Skript*')

  return lines.join('\n')
}

/**
 * Get human-readable color name
 */
function getColorName(color: string): string {
  const colorMap: Record<string, string> = {
    '#FFEB3B': 'Gelb',
    '#4CAF50': 'Grün',
    '#2196F3': 'Blau',
    '#F44336': 'Rot',
    '#9C27B0': 'Violett',
    '#FF9800': 'Orange',
  }
  return colorMap[color] || 'Markierung'
}

/**
 * Trigger download of markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
