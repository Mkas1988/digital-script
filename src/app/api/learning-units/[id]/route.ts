import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LearningUnit, Section } from '@/lib/supabase/types'

interface UpdateLearningUnitRequest {
  title?: string
  description?: string
  learning_objectives?: string[]
  estimated_minutes?: number
  sequence_order?: number
}

interface LearningUnitSectionRow {
  id: string
  section_id: string
  sequence_order: number
  sections: Section
}

interface LearningUnitWithSections extends LearningUnit {
  sections: {
    id: string
    section_id: string
    sequence_order: number
    section: Section
  }[]
}

/**
 * GET /api/learning-units/[id]
 * Get a single learning unit with its sections
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

    // Get learning unit with sections
    const { data: learningUnit, error } = await supabase
      .from('learning_units')
      .select(`
        *,
        learning_unit_sections(
          id,
          section_id,
          sequence_order,
          sections(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !learningUnit) {
      return NextResponse.json(
        { error: 'Lerneinheit nicht gefunden' },
        { status: 404 }
      )
    }

    // Transform the response
    const rawSections = (learningUnit.learning_unit_sections || []) as LearningUnitSectionRow[]
    const unitWithSections: LearningUnitWithSections = {
      ...learningUnit,
      learning_objectives: learningUnit.learning_objectives || [],
      sections: rawSections
        .map((lus) => ({
          id: lus.id,
          section_id: lus.section_id,
          sequence_order: lus.sequence_order,
          section: lus.sections,
        }))
        .sort((a, b) => a.sequence_order - b.sequence_order),
    }

    return NextResponse.json({ learning_unit: unitWithSections })

  } catch (error) {
    console.error('Learning unit GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/learning-units/[id]
 * Update a learning unit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateLearningUnitRequest = await request.json()

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) {
      if (body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Titel darf nicht leer sein' },
          { status: 400 }
        )
      }
      updateData.title = body.title.trim()
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.learning_objectives !== undefined) {
      updateData.learning_objectives = body.learning_objectives
    }

    if (body.estimated_minutes !== undefined) {
      updateData.estimated_minutes = body.estimated_minutes
    }

    if (body.sequence_order !== undefined) {
      updateData.sequence_order = body.sequence_order
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Keine Änderungen angegeben' },
        { status: 400 }
      )
    }

    // Perform the update
    const { data: updatedUnit, error: updateError } = await supabase
      .from('learning_units')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Learning unit update error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Änderungen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      learning_unit: updatedUnit,
    })

  } catch (error) {
    console.error('Learning unit PATCH error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/learning-units/[id]
 * Delete a learning unit
 */
export async function DELETE(
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

    // Delete the learning unit (cascades to learning_unit_sections)
    const { error: deleteError } = await supabase
      .from('learning_units')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Learning unit delete error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Lerneinheit' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Learning unit DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
