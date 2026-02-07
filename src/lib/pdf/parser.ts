import { extractText, getDocumentProxy } from 'unpdf'

export interface ParsedSection {
  title: string
  content: string
  orderIndex: number
  pageStart: number | null
  pageEnd: number | null
}

export interface ParsedDocument {
  sections: ParsedSection[]
  totalPages: number
  metadata: {
    title?: string
    author?: string
    subject?: string
  }
}

/**
 * Extract text from PDF buffer and split into sections
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  // Use unpdf for modern ESM-compatible PDF parsing
  const uint8Array = new Uint8Array(buffer)
  const pdf = await getDocumentProxy(uint8Array)
  const { text, totalPages } = await extractText(pdf, { mergePages: true })

  const sections = extractSections(text)

  return {
    sections,
    totalPages,
    metadata: {
      // unpdf doesn't provide metadata directly, use filename later
      title: undefined,
      author: undefined,
      subject: undefined,
    },
  }
}

/**
 * Split text into logical sections based on headings and structure
 */
function extractSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = []

  // Clean up the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Try to identify section headers
  // Common patterns: numbered sections (1., 1.1, etc.), CAPS headers, bold patterns
  const lines = cleanedText.split('\n')

  // Patterns for detecting section headers
  const headerPatterns = [
    /^(\d+\.[\d.]*)\s+(.+)$/,              // 1. Section, 1.1 Subsection
    /^(Kapitel|Chapter)\s+(\d+)[:\s]+(.+)$/i,  // Kapitel 1: Title
    /^([IVXLCDM]+\.?)\s+(.+)$/,            // Roman numerals
    /^([A-Z][A-Z\s]{2,})$/,                // ALL CAPS titles
  ]

  let currentSection: { title: string; content: string[]; startLine: number } | null = null
  let sectionIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    let isHeader = false
    let headerTitle = ''

    // Check if line matches any header pattern
    for (const pattern of headerPatterns) {
      const match = line.match(pattern)
      if (match) {
        // For numbered sections, combine number and title
        if (match.length >= 3) {
          headerTitle = `${match[1]} ${match[2]}${match[3] ? ' ' + match[3] : ''}`.trim()
        } else if (match.length === 2) {
          headerTitle = `${match[1]} ${match[2]}`.trim()
        } else {
          headerTitle = match[1]
        }
        isHeader = true
        break
      }
    }

    // Also detect headers by short lines followed by empty line and then text
    if (!isHeader && line.length < 100 && line.length > 3) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
      const prevLine = i > 0 ? lines[i - 1].trim() : ''
      if (!prevLine && nextLine) {
        // Potential header - short line after empty line
        // Only treat as header if it looks like a title (not too long, no sentence ending)
        if (!line.endsWith('.') && !line.endsWith(',') && !line.endsWith(';')) {
          isHeader = true
          headerTitle = line
        }
      }
    }

    if (isHeader && headerTitle) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          orderIndex: sectionIndex++,
          pageStart: null,
          pageEnd: null,
        })
      }

      // Start new section
      currentSection = {
        title: headerTitle,
        content: [],
        startLine: i,
      }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else {
      // No section yet, create initial section
      currentSection = {
        title: 'Einleitung',
        content: [line],
        startLine: i,
      }
    }
  }

  // Don't forget the last section
  if (currentSection && currentSection.content.length > 0) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      orderIndex: sectionIndex,
      pageStart: null,
      pageEnd: null,
    })
  }

  // If no sections were detected, create one big section
  if (sections.length === 0) {
    sections.push({
      title: 'Inhalt',
      content: cleanedText,
      orderIndex: 0,
      pageStart: null,
      pageEnd: null,
    })
  }

  // Merge very small sections (less than 100 chars) with the next one
  const mergedSections: ParsedSection[] = []
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    if (section.content.length < 100 && i < sections.length - 1) {
      // Merge with next section
      sections[i + 1].content = section.content + '\n\n' + sections[i + 1].content
      sections[i + 1].title = section.title + ' - ' + sections[i + 1].title
    } else {
      mergedSections.push({
        ...section,
        orderIndex: mergedSections.length,
      })
    }
  }

  return mergedSections.length > 0 ? mergedSections : sections
}
