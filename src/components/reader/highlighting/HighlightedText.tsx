'use client'

import { useMemo, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { getHighlightClasses } from '@/lib/highlighting/constants'
import { InlineNoteIndicator } from './InlineNoteIndicator'
import type { Annotation } from '@/lib/supabase/types'
import type { Note } from '@/hooks/useNotes'

/**
 * Format range representing bold or italic text
 */
interface FormatRange {
  start: number // Start position in the CLEANED text (without markers)
  end: number   // End position in the CLEANED text
  type: 'bold' | 'italic'
}

/**
 * Parse markdown and extract format ranges, returning cleaned text and formatting info
 * This processes the text ONCE at the top level, before any segmentation
 */
function extractMarkdownFormats(text: string): { cleanText: string; formats: FormatRange[] } {
  const formats: FormatRange[] = []
  let cleanText = ''
  let originalIndex = 0
  let cleanIndex = 0

  // Match **bold** and *italic* patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let match
  let lastIndex = 0

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match to cleanText
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      cleanText += beforeText
      cleanIndex += beforeText.length
    }

    // Check if it's bold (**text**) or italic (*text*)
    if (match[2]) {
      // Bold: **text** - the inner text is match[2]
      const innerText = match[2]
      const start = cleanIndex
      cleanText += innerText
      cleanIndex += innerText.length
      formats.push({ start, end: cleanIndex, type: 'bold' })
    } else if (match[3]) {
      // Italic: *text* - the inner text is match[3]
      const innerText = match[3]
      const start = cleanIndex
      cleanText += innerText
      cleanIndex += innerText.length
      formats.push({ start, end: cleanIndex, type: 'italic' })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    cleanText += text.slice(lastIndex)
  }

  return { cleanText, formats }
}

/**
 * Get format types that apply to a specific position in the text
 */
function getFormatsAtPosition(formats: FormatRange[], start: number, end: number): FormatRange[] {
  return formats.filter(f => f.start < end && f.end > start)
}

/**
 * Render text with formatting applied, handling partial overlaps with format ranges
 */
function renderFormattedText(
  text: string,
  textStart: number,
  formats: FormatRange[],
  key: string | number
): ReactNode {
  const textEnd = textStart + text.length
  const applicableFormats = getFormatsAtPosition(formats, textStart, textEnd)

  if (applicableFormats.length === 0) {
    return text
  }

  // Build segments based on format boundaries within this text
  const boundaries = new Set<number>()
  boundaries.add(0)
  boundaries.add(text.length)

  for (const format of applicableFormats) {
    // Convert format positions to local text positions
    const localStart = Math.max(0, format.start - textStart)
    const localEnd = Math.min(text.length, format.end - textStart)
    if (localStart >= 0 && localStart <= text.length) boundaries.add(localStart)
    if (localEnd >= 0 && localEnd <= text.length) boundaries.add(localEnd)
  }

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b)
  const result: ReactNode[] = []

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i]
    const end = sortedBoundaries[i + 1]
    if (start >= end) continue

    const segmentText = text.slice(start, end)
    const globalStart = textStart + start
    const globalEnd = textStart + end

    // Find formats that cover this segment
    const segmentFormats = applicableFormats.filter(
      f => f.start <= globalStart && f.end >= globalEnd
    )

    let element: ReactNode = segmentText

    // Apply formats (bold takes precedence over italic if both present)
    const hasBold = segmentFormats.some(f => f.type === 'bold')
    const hasItalic = segmentFormats.some(f => f.type === 'italic')

    if (hasBold && hasItalic) {
      element = <strong key={`${key}-${i}`} className="font-semibold"><em>{segmentText}</em></strong>
    } else if (hasBold) {
      element = <strong key={`${key}-${i}`} className="font-semibold">{segmentText}</strong>
    } else if (hasItalic) {
      element = <em key={`${key}-${i}`}>{segmentText}</em>
    }

    result.push(element)
  }

  return result.length === 1 ? result[0] : <>{result}</>
}

interface TextSegment {
  text: string
  cleanText: string  // Text without markdown markers
  type: 'plain' | 'highlight' | 'note' | 'highlight-with-note'
  highlight?: Annotation
  note?: Note
  startOffset: number  // Position in clean text
  endOffset: number    // Position in clean text
}

interface HighlightedTextProps {
  text: string
  highlights: Annotation[]
  notes?: Note[]
  onHighlightClick?: (highlight: Annotation, event: React.MouseEvent) => void
  onNoteClick?: (note: Note) => void
  className?: string
}

/**
 * Build a mapping from original text positions to clean text positions
 */
function buildPositionMap(originalText: string): { cleanText: string; originalToClean: number[]; formats: FormatRange[] } {
  const formats: FormatRange[] = []
  const originalToClean: number[] = new Array(originalText.length + 1)
  let cleanText = ''
  let cleanIndex = 0

  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let match
  let lastIndex = 0

  while ((match = regex.exec(originalText)) !== null) {
    // Map positions for text before the match
    for (let i = lastIndex; i < match.index; i++) {
      originalToClean[i] = cleanIndex
      cleanText += originalText[i]
      cleanIndex++
    }

    if (match[2]) {
      // Bold: **text** - skip the ** markers
      const innerText = match[2]
      const start = cleanIndex
      // Map first ** to current clean position
      originalToClean[match.index] = cleanIndex
      originalToClean[match.index + 1] = cleanIndex
      // Map inner text
      for (let i = 0; i < innerText.length; i++) {
        originalToClean[match.index + 2 + i] = cleanIndex
        cleanText += innerText[i]
        cleanIndex++
      }
      // Map closing **
      originalToClean[match.index + 2 + innerText.length] = cleanIndex
      originalToClean[match.index + 2 + innerText.length + 1] = cleanIndex
      formats.push({ start, end: cleanIndex, type: 'bold' })
    } else if (match[3]) {
      // Italic: *text* - skip the * markers
      const innerText = match[3]
      const start = cleanIndex
      // Map first * to current clean position
      originalToClean[match.index] = cleanIndex
      // Map inner text
      for (let i = 0; i < innerText.length; i++) {
        originalToClean[match.index + 1 + i] = cleanIndex
        cleanText += innerText[i]
        cleanIndex++
      }
      // Map closing *
      originalToClean[match.index + 1 + innerText.length] = cleanIndex
      formats.push({ start, end: cleanIndex, type: 'italic' })
    }

    lastIndex = match.index + match[0].length
  }

  // Map remaining text
  for (let i = lastIndex; i < originalText.length; i++) {
    originalToClean[i] = cleanIndex
    cleanText += originalText[i]
    cleanIndex++
  }
  originalToClean[originalText.length] = cleanIndex

  return { cleanText, originalToClean, formats }
}

/**
 * Component that renders text with highlight spans and note indicators applied
 * Handles overlapping highlights and notes, preserving markdown formatting
 */
export function HighlightedText({
  text,
  highlights,
  notes = [],
  onHighlightClick,
  onNoteClick,
  className,
}: HighlightedTextProps) {
  /**
   * Parse markdown and build position mapping
   */
  const { cleanText, originalToClean, formats } = useMemo(
    () => buildPositionMap(text),
    [text]
  )

  /**
   * Segment the text based on highlight and note positions
   */
  const segments = useMemo((): TextSegment[] => {
    // Collect all boundary points (in clean text coordinates)
    const boundaries = new Set<number>()
    boundaries.add(0)
    boundaries.add(cleanText.length)

    // Add format boundaries
    for (const f of formats) {
      boundaries.add(f.start)
      boundaries.add(f.end)
    }

    // Convert highlight positions from original to clean coordinates
    const validHighlights = highlights.filter(
      (h) =>
        h.position_start !== null &&
        h.position_end !== null &&
        h.position_start < text.length
    ).map(h => ({
      ...h,
      cleanStart: originalToClean[Math.min(h.position_start || 0, text.length)],
      cleanEnd: originalToClean[Math.min(h.position_end || 0, text.length)],
    }))

    // Convert note positions from original to clean coordinates
    const validNotes = notes.filter(
      (n) =>
        n.position_start !== null &&
        n.position_end !== null &&
        typeof n.position_start === 'number' &&
        typeof n.position_end === 'number' &&
        n.position_start < text.length
    ).map(n => ({
      ...n,
      cleanStart: originalToClean[Math.min(n.position_start || 0, text.length)],
      cleanEnd: originalToClean[Math.min(n.position_end || 0, text.length)],
    }))

    // Add highlight boundaries (in clean coordinates)
    for (const h of validHighlights) {
      boundaries.add(Math.max(0, h.cleanStart))
      boundaries.add(Math.min(cleanText.length, h.cleanEnd))
    }

    // Add note boundaries (in clean coordinates)
    for (const n of validNotes) {
      boundaries.add(Math.max(0, n.cleanStart))
      boundaries.add(Math.min(cleanText.length, n.cleanEnd))
    }

    // Sort boundaries
    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b)

    // Build segments
    const result: TextSegment[] = []

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const start = sortedBoundaries[i]
      const end = sortedBoundaries[i + 1]

      if (start >= end) continue

      // Find highlight at this position (most recent one wins for overlaps)
      const highlightAtPos = validHighlights
        .filter((h) => h.cleanStart <= start && h.cleanEnd >= end)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

      // Find note at this position (first one wins for overlaps)
      const noteAtPos = validNotes.find(
        (n) => n.cleanStart <= start && n.cleanEnd >= end
      )

      let segmentType: TextSegment['type'] = 'plain'
      if (highlightAtPos && noteAtPos) {
        segmentType = 'highlight-with-note'
      } else if (highlightAtPos) {
        segmentType = 'highlight'
      } else if (noteAtPos) {
        segmentType = 'note'
      }

      result.push({
        text: cleanText.slice(start, end),
        cleanText: cleanText.slice(start, end),
        type: segmentType,
        highlight: highlightAtPos,
        note: noteAtPos,
        startOffset: start,
        endOffset: end,
      })
    }

    return result
  }, [cleanText, text.length, originalToClean, formats, highlights, notes])

  // Find segments where a note ends (to show the icon) - using clean text positions
  const noteEndSegments = useMemo(() => {
    const endMap = new Map<number, Note>()
    for (const note of notes) {
      if (
        note.position_end !== null &&
        note.position_end !== undefined &&
        note.position_end <= text.length
      ) {
        const cleanEnd = originalToClean[Math.min(note.position_end, text.length)]
        endMap.set(cleanEnd, note)
      }
    }
    return endMap
  }, [notes, text.length, originalToClean])

  const handleHighlightClick = useCallback(
    (highlight: Annotation, event: React.MouseEvent) => {
      event.stopPropagation()
      onHighlightClick?.(highlight, event)
    },
    [onHighlightClick]
  )

  const handleNoteClick = useCallback(
    (note: Note, event: React.MouseEvent) => {
      event.stopPropagation()
      onNoteClick?.(note)
    },
    [onNoteClick]
  )

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        // Check if a note ends at this segment's end position
        const noteEndingHere = noteEndSegments.get(segment.endOffset)
        const showNoteIcon = noteEndingHere && onNoteClick

        // Render formatted text for this segment
        const formattedContent = renderFormattedText(
          segment.cleanText,
          segment.startOffset,
          formats,
          index
        )

        // Note styling classes
        const noteClasses = cn(
          'border-b-2 border-dashed border-amber-400 dark:border-amber-500',
          'bg-amber-50/50 dark:bg-amber-900/20',
          'rounded-sm',
          'cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30',
          'transition-colors duration-200'
        )

        if (segment.type === 'plain') {
          return (
            <span key={index}>
              {formattedContent}
              {showNoteIcon && (
                <InlineNoteIndicator
                  note={noteEndingHere}
                  onClick={onNoteClick}
                />
              )}
            </span>
          )
        }

        if (segment.type === 'note') {
          return (
            <span key={index}>
              <span
                className={noteClasses}
                onClick={(e) => segment.note && handleNoteClick(segment.note, e)}
                title={segment.note?.content?.slice(0, 100) || 'Notiz'}
              >
                {formattedContent}
              </span>
              {showNoteIcon && (
                <InlineNoteIndicator
                  note={noteEndingHere}
                  onClick={onNoteClick}
                />
              )}
            </span>
          )
        }

        if (segment.type === 'highlight') {
          const colorClasses = getHighlightClasses(segment.highlight?.color || '')
          return (
            <span key={index}>
              <mark
                className={cn(
                  colorClasses,
                  'rounded px-0.5 -mx-0.5',
                  'cursor-pointer transition-all duration-200',
                  'hover:brightness-90 dark:hover:brightness-110',
                  segment.highlight?.content && 'border-b-2 border-dashed border-current/30'
                )}
                onClick={(e) =>
                  segment.highlight && handleHighlightClick(segment.highlight, e)
                }
                data-highlight-id={segment.highlight?.id}
                title={segment.highlight?.content || undefined}
              >
                {formattedContent}
              </mark>
              {showNoteIcon && (
                <InlineNoteIndicator
                  note={noteEndingHere}
                  onClick={onNoteClick}
                />
              )}
            </span>
          )
        }

        if (segment.type === 'highlight-with-note') {
          const colorClasses = getHighlightClasses(segment.highlight?.color || '')
          return (
            <span key={index}>
              <mark
                className={cn(
                  colorClasses,
                  'rounded px-0.5 -mx-0.5',
                  'cursor-pointer transition-all duration-200',
                  'hover:brightness-90 dark:hover:brightness-110',
                  // Add note indicator styling on top of highlight
                  'border-b-2 border-dashed border-amber-500'
                )}
                onClick={(e) =>
                  segment.highlight && handleHighlightClick(segment.highlight, e)
                }
                data-highlight-id={segment.highlight?.id}
                title={`${segment.highlight?.content || ''}\n---\nNotiz: ${segment.note?.content?.slice(0, 50) || ''}`}
              >
                {formattedContent}
              </mark>
              {showNoteIcon && (
                <InlineNoteIndicator
                  note={noteEndingHere}
                  onClick={onNoteClick}
                />
              )}
            </span>
          )
        }

        return null
      })}
    </span>
  )
}

/**
 * Utility to merge overlapping highlights
 * Returns highlights with merged ranges
 */
export function mergeOverlappingHighlights(
  highlights: Annotation[]
): Annotation[] {
  if (highlights.length <= 1) return highlights

  const sorted = [...highlights].sort(
    (a, b) => (a.position_start || 0) - (b.position_start || 0)
  )

  const merged: Annotation[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    // Check for overlap
    if (
      current.position_start !== null &&
      last.position_end !== null &&
      current.position_start <= last.position_end
    ) {
      // Extend the last highlight if needed
      if (
        current.position_end !== null &&
        current.position_end > (last.position_end || 0)
      ) {
        merged[merged.length - 1] = {
          ...last,
          position_end: current.position_end,
        }
      }
    } else {
      merged.push(current)
    }
  }

  return merged
}
