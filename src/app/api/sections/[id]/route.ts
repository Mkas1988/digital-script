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

interface UpdateSectionRequest {
  title?: string
  content?: string
  section_type?: SectionType
  metadata?: Partial<SectionMetadata>
  formatting?: Partial<SectionFormatting>
  order_index?: number
}

/**
 * PATCH /api/sections/[id]
 * Update a section's content, title, type, or metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateSectionRequest = await request.json()

    // Validate section_type if provided
    if (body.section_type && !VALID_SECTION_TYPES.includes(body.section_type)) {
      return NextResponse.json(
        { error: `Ungültiger Sektionstyp: ${body.section_type}` },
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

    // Get the section to check ownership via document
    const { data: section, error: fetchError } = await supabase
      .from('sections')
      .select('*, documents!inner(user_id)')
      .eq('id', id)
      .single()

    if (fetchError || !section) {
      return NextResponse.json(
        { error: 'Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if user owns the document
    const documentData = section.documents as { user_id: string }
    if (documentData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }

    if (body.content !== undefined) {
      updateData.content = body.content
    }

    if (body.section_type !== undefined) {
      updateData.section_type = body.section_type
    }

    if (body.order_index !== undefined) {
      updateData.order_index = body.order_index
    }

    // Merge metadata if provided
    if (body.metadata !== undefined) {
      const existingMetadata = (section.metadata as SectionMetadata) || {}
      updateData.metadata = {
        ...existingMetadata,
        ...body.metadata,
      }
    }

    // Merge formatting if provided
    if (body.formatting !== undefined) {
      const existingFormatting = (section.formatting as SectionFormatting) || {}
      updateData.formatting = {
        ...existingFormatting,
        ...body.formatting,
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Keine Änderungen angegeben' },
        { status: 400 }
      )
    }

    // Perform the update
    const { data: updatedSection, error: updateError } = await supabase
      .from('sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Section update error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Änderungen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      section: updatedSection,
    })

  } catch (error) {
    console.error('Section API error:', error)
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

/**
 * GET /api/sections/[id]
 * Get a single section by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: section, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !section) {
      return NextResponse.json(
        { error: 'Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ section })

  } catch (error) {
    console.error('Section GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sections/[id]
 * Delete a section and adjust order_index of following sections
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get the section to check ownership and get order_index
    const { data: section, error: fetchError } = await supabase
      .from('sections')
      .select('*, documents!inner(user_id)')
      .eq('id', id)
      .single()

    if (fetchError || !section) {
      return NextResponse.json(
        { error: 'Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if user owns the document
    const documentData = section.documents as { user_id: string }
    if (documentData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen' },
        { status: 403 }
      )
    }

    const documentId = section.document_id
    const deletedOrderIndex = section.order_index

    // Delete the section
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Section delete error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Sektion' },
        { status: 500 }
      )
    }

    // Shift following sections down
    const { data: sectionsToShift } = await supabase
      .from('sections')
      .select('id, order_index')
      .eq('document_id', documentId)
      .gt('order_index', deletedOrderIndex)
      .order('order_index', { ascending: true })

    if (sectionsToShift && sectionsToShift.length > 0) {
      for (const s of sectionsToShift) {
        await supabase
          .from('sections')
          .update({ order_index: s.order_index - 1 })
          .eq('id', s.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sektion erfolgreich gelöscht',
    })

  } catch (error) {
    console.error('Section DELETE error:', error)
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
