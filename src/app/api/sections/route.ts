import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SectionType, SectionMetadata, SectionFormatting } from '@/lib/supabase/types'

// Valid section types for validation
const VALID_SECTION_TYPES: SectionType[] = [
  'chapter',
  'subchapter',
  'learning_objectives',
  'task',
  'practice_impulse',
  'reflection',
  'tip',
  'summary',
  'definition',
  'example',
  'important',
  'exercise',
  'solution',
  'reference',
]

interface CreateSectionRequest {
  document_id: string
  section_type: SectionType
  title: string
  content?: string
  order_index: number
  metadata?: Partial<SectionMetadata>
  formatting?: Partial<SectionFormatting>
}

/**
 * POST /api/sections
 * Create a new section in a document
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSectionRequest = await request.json()

    // Validate required fields
    if (!body.document_id) {
      return NextResponse.json(
        { error: 'document_id ist erforderlich' },
        { status: 400 }
      )
    }

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      )
    }

    if (!body.section_type || !VALID_SECTION_TYPES.includes(body.section_type)) {
      return NextResponse.json(
        { error: `Ungültiger Sektionstyp: ${body.section_type}` },
        { status: 400 }
      )
    }

    if (typeof body.order_index !== 'number') {
      return NextResponse.json(
        { error: 'order_index ist erforderlich' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Check if user owns the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', body.document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      )
    }

    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Shift existing sections to make room for the new one
    const { error: shiftError } = await supabase
      .from('sections')
      .update({ order_index: supabase.rpc('increment_order', { inc: 1 }) })
      .eq('document_id', body.document_id)
      .gte('order_index', body.order_index)

    // If rpc doesn't exist, do it manually
    if (shiftError) {
      // Get sections that need to be shifted
      const { data: sectionsToShift } = await supabase
        .from('sections')
        .select('id, order_index')
        .eq('document_id', body.document_id)
        .gte('order_index', body.order_index)
        .order('order_index', { ascending: false })

      // Update each section's order_index
      if (sectionsToShift && sectionsToShift.length > 0) {
        for (const section of sectionsToShift) {
          await supabase
            .from('sections')
            .update({ order_index: section.order_index + 1 })
            .eq('id', section.id)
        }
      }
    }

    // Create the new section
    const newSection = {
      document_id: body.document_id,
      title: body.title.trim(),
      content: body.content || '',
      section_type: body.section_type,
      order_index: body.order_index,
      metadata: body.metadata || {},
      formatting: body.formatting || {},
      images: [],
    }

    const { data: createdSection, error: createError } = await supabase
      .from('sections')
      .insert(newSection)
      .select()
      .single()

    if (createError) {
      console.error('Section creation error:', createError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Sektion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      section: createdSection,
    }, { status: 201 })

  } catch (error) {
    console.error('Section POST error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Ein unerwarteter Fehler ist aufgetreten',
      },
      { status: 500 }
    )
  }
}
