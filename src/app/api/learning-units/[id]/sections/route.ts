import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Section } from '@/lib/supabase/types'

interface AddSectionRequest {
  section_id: string
  sequence_order?: number
}

interface UpdateSectionOrderRequest {
  section_ids: string[] // Array of section IDs in desired order
}

/**
 * GET /api/learning-units/[id]/sections
 * List all sections in a learning unit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get sections
    const { data: unitSections, error } = await supabase
      .from('learning_unit_sections')
      .select('id, section_id, sequence_order, sections(*)')
      .eq('learning_unit_id', id)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching learning unit sections:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Sektionen' },
        { status: 500 }
      )
    }

    const sections = (unitSections || []).map(us => ({
      id: us.id,
      section_id: us.section_id,
      sequence_order: us.sequence_order,
      section: us.sections as unknown as Section,
    }))

    return NextResponse.json({ sections })

  } catch (error) {
    console.error('Learning unit sections GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/learning-units/[id]/sections
 * Add a section to a learning unit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: AddSectionRequest = await request.json()

    if (!body.section_id) {
      return NextResponse.json(
        { error: 'section_id ist erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Check if section exists
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id')
      .eq('id', body.section_id)
      .single()

    if (sectionError || !section) {
      return NextResponse.json(
        { error: 'Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    // Get next sequence order
    const { data: maxOrder } = await supabase
      .from('learning_unit_sections')
      .select('sequence_order')
      .eq('learning_unit_id', id)
      .order('sequence_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = body.sequence_order ?? ((maxOrder?.sequence_order ?? -1) + 1)

    // Add section to learning unit
    const { data: unitSection, error: insertError } = await supabase
      .from('learning_unit_sections')
      .insert({
        learning_unit_id: id,
        section_id: body.section_id,
        sequence_order: nextOrder,
      })
      .select('id, section_id, sequence_order, sections(*)')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Sektion ist bereits in dieser Lerneinheit' },
          { status: 409 }
        )
      }
      console.error('Error adding section to learning unit:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Hinzufügen der Sektion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      section: {
        id: unitSection.id,
        section_id: unitSection.section_id,
        sequence_order: unitSection.sequence_order,
        section: unitSection.sections as unknown as Section,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Learning unit sections POST error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/learning-units/[id]/sections
 * Update section order in learning unit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateSectionOrderRequest = await request.json()

    if (!body.section_ids || !Array.isArray(body.section_ids)) {
      return NextResponse.json(
        { error: 'section_ids Array ist erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Update order for each section
    const updates = body.section_ids.map((sectionId, index) =>
      supabase
        .from('learning_unit_sections')
        .update({ sequence_order: index })
        .eq('learning_unit_id', id)
        .eq('section_id', sectionId)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Learning unit sections PATCH error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/learning-units/[id]/sections
 * Remove a section from a learning unit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('section_id')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'section_id ist erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Remove section from learning unit
    const { error: deleteError } = await supabase
      .from('learning_unit_sections')
      .delete()
      .eq('learning_unit_id', id)
      .eq('section_id', sectionId)

    if (deleteError) {
      console.error('Error removing section from learning unit:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Entfernen der Sektion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Learning unit sections DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
