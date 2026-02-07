import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractText, getDocumentProxy } from 'unpdf'
import { extractImagesFromPDF } from '@/lib/pdf/image-extractor'
import { uploadExtractedImages, saveImageMetadata } from '@/lib/pdf/image-storage'
import { structureDocumentWithAI } from '@/lib/ai/pdf-processor'

// Lazy initialization of Supabase client for service role access
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { documentId, storagePath } = await request.json()

    if (!documentId || !storagePath) {
      return NextResponse.json(
        { message: 'documentId und storagePath sind erforderlich' },
        { status: 400 }
      )
    }

    // Get user ID and filename from storage path (format: userId/timestamp.pdf)
    const pathParts = storagePath.split('/')
    const userId = pathParts[0]

    // Get original filename from document
    const { data: docData } = await supabase
      .from('documents')
      .select('original_filename')
      .eq('id', documentId)
      .single()

    const filename = docData?.original_filename || 'document.pdf'

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      return NextResponse.json(
        { message: 'PDF konnte nicht heruntergeladen werden' },
        { status: 500 }
      )
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uint8Array = new Uint8Array(buffer)

    // Extract raw text from PDF
    const pdf = await getDocumentProxy(uint8Array)
    const { text: rawText, totalPages } = await extractText(pdf, { mergePages: true })

    // Extract images first so we can pass page info to AI
    const imageResult = await extractImagesFromPDF(buffer, {
      minWidth: 50,
      minHeight: 50,
      maxImages: 50,
      outputFormat: 'png',
    }).catch((err) => {
      console.error('Image extraction failed:', err)
      return { images: [], totalPages: 0, pagesWithImages: [] as number[] }
    })

    // Create a map of images by page number for AI context
    const imagesByPage = new Map<number, { pageNumber: number; imageIndex: number }[]>()
    for (const img of imageResult.images) {
      const pageImages = imagesByPage.get(img.pageNumber) || []
      pageImages.push({ pageNumber: img.pageNumber, imageIndex: img.imageIndex })
      imagesByPage.set(img.pageNumber, pageImages)
    }

    // Use AI to intelligently structure the document into chapters
    // This provides much better chapter detection than regex patterns
    const structuredDoc = await structureDocumentWithAI(rawText, filename, totalPages, imagesByPage)

    // Update document with AI-generated title, summary, and metadata
    const documentUpdate: Record<string, unknown> = {
      total_pages: totalPages,
      title: structuredDoc.title,
      ai_summary: structuredDoc.summary,
      author: structuredDoc.metadata?.author || null,
      institution: structuredDoc.metadata?.institution || null,
    }

    // Upload images if any were extracted
    let imagesUploaded = 0
    let storedImages: Awaited<ReturnType<typeof uploadExtractedImages>> = []
    if (imageResult.images.length > 0) {
      try {
        storedImages = await uploadExtractedImages(
          imageResult.images,
          { documentId, userId },
          supabase
        )

        if (storedImages.length > 0) {
          await saveImageMetadata(storedImages, documentId, supabase)
          imagesUploaded = storedImages.length
          documentUpdate.has_images = true
        }
      } catch (err) {
        console.error('Image storage failed:', err)
      }
    }

    // Update document
    await supabase
      .from('documents')
      .update(documentUpdate)
      .eq('id', documentId)

    // Helper to find images for a section based on page range
    const getImagesForSection = (pageStart: number | null, pageEnd: number | null) => {
      if (!pageStart) return []
      const start = pageStart
      const end = pageEnd || pageStart
      return storedImages
        .filter((img) => img.pageNumber >= start && img.pageNumber <= end)
        .map((img) => ({
          id: `${img.pageNumber}-${img.imageIndex}`,
          storage_path: img.publicUrl,
          alt_text: `Abbildung von Seite ${img.pageNumber}`,
          page_number: img.pageNumber,
          width: img.width,
          height: img.height,
        }))
    }

    // Insert AI-structured sections with summaries, types, hierarchy info, and associated images
    const sectionsToInsert = structuredDoc.sections.map((section, index) => ({
      document_id: documentId,
      title: section.title,
      content: section.content,
      order_index: index,
      page_start: section.pageStart,
      page_end: section.pageEnd,
      ai_summary: section.summary || null,
      section_type: section.section_type || 'chapter',
      metadata: {
        task_number: section.task_number || null,
        keywords: section.keywords || [],
        level: section.level ?? 0,
        chapter_number: section.chapter_number || '0',
        solution_id: section.solution_id || null,
        exercise_id: section.exercise_id || null,
      },
      // Store images as JSON array in the section
      images: getImagesForSection(section.pageStart, section.pageEnd),
    }))

    const { error: insertError } = await supabase
      .from('sections')
      .insert(sectionsToInsert)

    if (insertError) {
      console.error('Insert sections error:', insertError)
      return NextResponse.json(
        { message: 'Fehler beim Speichern der Abschnitte' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      title: structuredDoc.title,
      sectionsCount: structuredDoc.sections.length,
      totalPages,
      imagesExtracted: imagesUploaded,
      pagesWithImages: imageResult.pagesWithImages,
      tableOfContents: structuredDoc.tableOfContents,
    })

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Fehler beim Verarbeiten der PDF' },
      { status: 500 }
    )
  }
}
