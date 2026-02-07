import OpenAI from 'openai'
import { STUDIENBRIEF_SYSTEM_PROMPT, STUDIENBRIEF_USER_PROMPT } from './studienbrief-prompt'
import type { SectionType } from '@/lib/supabase/types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface StructuredSection {
  title: string
  content: string
  pageStart: number | null
  pageEnd: number | null
  summary?: string
  section_type?: SectionType
  task_number?: string
  keywords?: string[]
  level?: number           // 0 = top-level, 1 = subchapter, 2 = sub-subchapter
  chapter_number?: string  // Groups sections by chapter ("1", "2", "intro", "outro")
  solution_id?: string     // For exercises: reference to solution section
  exercise_id?: string     // For solutions: reference back to exercise
}

export interface ProcessedDocument {
  title: string
  summary: string
  sections: StructuredSection[]
  tableOfContents: {
    title: string
    page: number | null
    section_type?: SectionType
    level?: number
    chapter_number?: string
  }[]
  metadata?: {
    author?: string
    institution?: string
  }
}

/**
 * Use AI to intelligently structure PDF text into chapters/sections
 * Optimized for German Studienbriefe (distance learning materials)
 * Recognizes special elements: learning objectives, tasks, tips, summaries, etc.
 */
export async function structureDocumentWithAI(
  rawText: string,
  filename: string,
  totalPages: number,
  imagesByPage?: Map<number, { pageNumber: number; imageIndex: number }[]>
): Promise<ProcessedDocument> {
  try {
    // Truncate text if too long (GPT-4o-mini has 128k context)
    const maxChars = 100000
    const text = rawText.length > maxChars
      ? rawText.substring(0, maxChars) + '\n\n[Text gekürzt...]'
      : rawText

    // Include image page information if available
    let imageContext = ''
    if (imagesByPage && imagesByPage.size > 0) {
      const imagePages = Array.from(imagesByPage.keys()).sort((a, b) => a - b)
      imageContext = `\n\nBilder im Dokument auf folgenden Seiten: ${imagePages.join(', ')}`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: STUDIENBRIEF_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: STUDIENBRIEF_USER_PROMPT(filename, totalPages, text, imageContext)
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const parsed = JSON.parse(content)

    // Transform the response to match ProcessedDocument interface
    const result: ProcessedDocument = {
      title: parsed.metadata?.title || parsed.title || filename.replace('.pdf', ''),
      summary: parsed.summary || '',
      sections: (parsed.sections || []).map((section: {
        title: string
        content: string
        pageStart?: number
        pageEnd?: number
        summary?: string
        section_type?: SectionType
        task_number?: string
        keywords?: string[]
        level?: number
        chapter_number?: string
        solution_id?: string
        exercise_id?: string
      }) => ({
        title: section.title,
        content: section.content,
        pageStart: section.pageStart || null,
        pageEnd: section.pageEnd || null,
        summary: section.summary,
        section_type: section.section_type || 'chapter',
        task_number: section.task_number,
        keywords: section.keywords,
        level: section.level ?? 0,
        chapter_number: section.chapter_number || '0',
        solution_id: section.solution_id,
        exercise_id: section.exercise_id,
      })),
      tableOfContents: (parsed.tableOfContents || []).map((item: {
        title: string
        page?: number
        section_type?: SectionType
        level?: number
        chapter_number?: string
      }) => ({
        title: item.title,
        page: item.page || null,
        section_type: item.section_type,
        level: item.level ?? 0,
        chapter_number: item.chapter_number || '0',
      })),
      metadata: parsed.metadata ? {
        author: parsed.metadata.author,
        institution: parsed.metadata.institution,
      } : undefined,
    }

    return result
  } catch (error) {
    console.error('AI structuring failed:', error)
    // Fallback: Return simple structure
    return {
      title: filename.replace('.pdf', ''),
      summary: '',
      sections: [{
        title: 'Inhalt',
        content: rawText,
        pageStart: 1,
        pageEnd: totalPages,
        section_type: 'chapter',
      }],
      tableOfContents: [{ title: 'Inhalt', page: 1 }],
    }
  }
}

/**
 * Generate alt text for an image using GPT-4 Vision
 * Can accept either a URL or base64 encoded image data
 */
export async function generateImageAltText(
  imageSource: string,
  documentContext: string,
  options?: {
    isBase64?: boolean
    mimeType?: 'image/png' | 'image/jpeg'
  }
): Promise<string> {
  try {
    // Determine image URL format
    let imageUrl: string
    if (options?.isBase64) {
      const mimeType = options.mimeType || 'image/png'
      imageUrl = `data:${mimeType};base64,${imageSource}`
    } else {
      imageUrl = imageSource
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generiere einen kurzen, beschreibenden Alt-Text für dieses Bild aus einem akademischen Dokument.

Dokument-Kontext: ${documentContext.substring(0, 300)}...

Regeln:
- Max. 150 Zeichen
- Beschreibe was zu sehen ist
- Fokus auf Barrierefreiheit
- Auf Deutsch antworten`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low' // Cost-effective for alt text
              }
            }
          ]
        }
      ],
      max_tokens: 100,
    })

    return response.choices[0]?.message?.content || 'Abbildung im Dokument'
  } catch (error) {
    console.error('Alt text generation failed:', error)
    return 'Abbildung im Dokument'
  }
}

/**
 * Generate alt text from image URL (simplified helper)
 */
export async function generateAltTextFromUrl(
  imageUrl: string,
  pageNumber: number
): Promise<string> {
  return generateImageAltText(
    imageUrl,
    `Bild von Seite ${pageNumber} eines akademischen Dokuments.`
  )
}

/**
 * Generate a summary for a section
 */
export async function generateSectionSummary(
  sectionTitle: string,
  sectionContent: string
): Promise<string> {
  try {
    // Truncate content if too long
    const content = sectionContent.length > 5000
      ? sectionContent.substring(0, 5000) + '...'
      : sectionContent

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Erstelle eine kurze, prägnante Zusammenfassung des folgenden Abschnitts. Die Zusammenfassung sollte für Studenten hilfreich sein und die Kernaussagen erfassen.'
        },
        {
          role: 'user',
          content: `Abschnitt: "${sectionTitle}"

Inhalt:
${content}

Zusammenfassung (2-3 Sätze):`
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Summary generation failed:', error)
    return ''
  }
}

/**
 * Generate flashcards from section content
 */
export async function generateFlashcards(
  sectionTitle: string,
  sectionContent: string,
  count: number = 5
): Promise<{ question: string; answer: string }[]> {
  try {
    const content = sectionContent.length > 5000
      ? sectionContent.substring(0, 5000) + '...'
      : sectionContent

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für die Erstellung von Lernkarten.
Erstelle ${count} Lernkarten basierend auf dem folgenden Abschnitt.
Die Fragen sollten auf Verständnis abzielen, nicht nur auf Fakten.
Antworte nur mit validem JSON.`
        },
        {
          role: 'user',
          content: `Abschnitt: "${sectionTitle}"

Inhalt:
${content}

Erstelle ${count} Lernkarten im Format:
{
  "flashcards": [
    {"question": "Frage", "answer": "Antwort"}
  ]
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{"flashcards":[]}')
    return parsed.flashcards || []
  } catch (error) {
    console.error('Flashcard generation failed:', error)
    return []
  }
}

/**
 * Analyze document and suggest key learning points
 */
export async function analyzeDocumentForLearning(
  documentTitle: string,
  sections: { title: string; content: string }[]
): Promise<{
  keyTopics: string[]
  prerequisites: string[]
  learningObjectives: string[]
  estimatedReadingTime: number
}> {
  try {
    const sectionsOverview = sections
      .map(s => `- ${s.title}: ${s.content.substring(0, 200)}...`)
      .join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Analysiere das Dokument und extrahiere Lerninformationen. Antworte nur mit validem JSON.'
        },
        {
          role: 'user',
          content: `Dokument: "${documentTitle}"

Abschnitte:
${sectionsOverview}

Analysiere und erstelle:
{
  "keyTopics": ["Hauptthema 1", "Hauptthema 2"],
  "prerequisites": ["Vorwissen 1"],
  "learningObjectives": ["Lernziel 1"],
  "estimatedReadingTime": 30
}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}')
    return {
      keyTopics: parsed.keyTopics || [],
      prerequisites: parsed.prerequisites || [],
      learningObjectives: parsed.learningObjectives || [],
      estimatedReadingTime: parsed.estimatedReadingTime || 30,
    }
  } catch (error) {
    console.error('Document analysis failed:', error)
    return {
      keyTopics: [],
      prerequisites: [],
      learningObjectives: [],
      estimatedReadingTime: 30,
    }
  }
}
