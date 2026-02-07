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
 * Generate and trigger PDF export using browser print
 * Uses a print-optimized HTML page that opens in a new window
 */
export function generatePdfExport(
  data: ExportData,
  options: ExportOptions
): void {
  const { documentTitle, sections, highlights, notes } = data
  const { includeHighlights, includeNotes, includeForReviewOnly } = options

  // Filter data based on options
  let filteredHighlights = highlights
  if (includeForReviewOnly) {
    filteredHighlights = highlights.filter((h) => h.for_review)
  }

  let filteredNotes = notes
  if (includeForReviewOnly) {
    filteredNotes = []
  }

  // Generate HTML content
  const html = generatePrintHtml(
    documentTitle,
    sections,
    filteredHighlights,
    filteredNotes,
    { includeHighlights, includeNotes }
  )

  // Open print window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Bitte erlauben Sie Pop-ups für den PDF-Export.')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * Generate print-optimized HTML
 */
function generatePrintHtml(
  title: string,
  sections: Section[],
  highlights: Annotation[],
  notes: Note[],
  options: { includeHighlights: boolean; includeNotes: boolean }
): string {
  const { includeHighlights, includeNotes } = options
  const exportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let content = ''

  // Group annotations by section
  for (const section of sections) {
    const sectionHighlights = highlights.filter((h) => h.section_id === section.id)
    const sectionNotes = notes.filter((n) => n.section_id === section.id)

    // Skip section if no annotations
    if (
      (!includeHighlights || sectionHighlights.length === 0) &&
      (!includeNotes || sectionNotes.length === 0)
    ) {
      continue
    }

    content += `
      <div class="section">
        <h2>${escapeHtml(section.title)}</h2>
        ${section.page_start ? `<p class="page-info">Seite ${section.page_start}${section.page_end && section.page_end !== section.page_start ? ` - ${section.page_end}` : ''}</p>` : ''}
    `

    // Highlights
    if (includeHighlights && sectionHighlights.length > 0) {
      content += '<div class="highlights">'
      content += '<h3>Markierungen</h3>'

      for (const highlight of sectionHighlights) {
        const colorName = getColorName(highlight.color || '#FFEB3B')
        const forReviewBadge = highlight.for_review
          ? '<span class="badge">Zur Vertiefung</span>'
          : ''

        content += `
          <div class="highlight" style="border-left-color: ${highlight.color || '#FFEB3B'}">
            <div class="highlight-header">
              <span class="color-label">${colorName}</span>
              ${forReviewBadge}
            </div>
            <blockquote>"${escapeHtml(highlight.text_selection || '')}"</blockquote>
            ${highlight.content ? `<p class="comment">Kommentar: ${escapeHtml(highlight.content)}</p>` : ''}
          </div>
        `
      }
      content += '</div>'
    }

    // Notes
    if (includeNotes && sectionNotes.length > 0) {
      content += '<div class="notes">'
      content += '<h3>Notizen</h3>'

      for (const note of sectionNotes) {
        const date = new Date(note.created_at).toLocaleDateString('de-DE')

        content += `
          <div class="note">
            <p class="note-date">${date}</p>
            ${note.text_selection ? `<blockquote class="reference">Bezug: "${escapeHtml(note.text_selection)}"</blockquote>` : ''}
            <div class="note-content">${escapeHtml(note.content || '')}</div>
          </div>
        `
      }
      content += '</div>'
    }

    content += '</div>'
  }

  // Stats
  const highlightCount = highlights.length
  const forReviewCount = highlights.filter((h) => h.for_review).length
  const noteCount = notes.length

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)} - Export</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }

        .header h1 {
          font-size: 24pt;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .header .date {
          color: #666;
          font-size: 10pt;
        }

        .stats {
          display: flex;
          gap: 20px;
          margin-top: 15px;
          font-size: 10pt;
        }

        .stats span {
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .section h2 {
          font-size: 16pt;
          font-weight: 600;
          margin-bottom: 5px;
          color: #1a1a1a;
        }

        .page-info {
          font-size: 10pt;
          color: #888;
          margin-bottom: 15px;
        }

        .section h3 {
          font-size: 12pt;
          font-weight: 600;
          color: #444;
          margin: 20px 0 10px;
        }

        .highlight {
          margin-bottom: 15px;
          padding: 12px;
          padding-left: 16px;
          background: #fafafa;
          border-left: 4px solid;
          border-radius: 0 6px 6px 0;
        }

        .highlight-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .color-label {
          font-size: 10pt;
          font-weight: 500;
          color: #666;
        }

        .badge {
          font-size: 9pt;
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
        }

        blockquote {
          font-style: italic;
          color: #333;
        }

        .comment {
          margin-top: 8px;
          font-size: 10pt;
          color: #666;
        }

        .note {
          margin-bottom: 20px;
          padding: 15px;
          background: #fffbeb;
          border-radius: 6px;
          border: 1px solid #fde68a;
        }

        .note-date {
          font-size: 10pt;
          font-weight: 500;
          color: #92400e;
          margin-bottom: 8px;
        }

        .note .reference {
          font-size: 10pt;
          color: #666;
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(255,255,255,0.5);
          border-radius: 4px;
        }

        .note-content {
          white-space: pre-wrap;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          text-align: center;
          font-size: 9pt;
          color: #888;
        }

        @media print {
          body {
            padding: 20px;
          }

          .section {
            page-break-inside: avoid;
          }

          .highlight, .note {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <p class="date">Exportiert am ${exportDate}</p>
        <div class="stats">
          ${includeHighlights ? `<span>${highlightCount} Markierungen${forReviewCount > 0 ? ` (${forReviewCount} zur Vertiefung)` : ''}</span>` : ''}
          ${includeNotes ? `<span>${noteCount} Notizen</span>` : ''}
        </div>
      </div>

      ${content || '<p style="color: #888; text-align: center; padding: 40px;">Keine Annotationen zum Exportieren.</p>'}

      <div class="footer">
        Erstellt mit Digitales Skript
      </div>
    </body>
    </html>
  `
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
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
