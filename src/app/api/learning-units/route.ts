import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LearningUnit, Section } from '@/lib/supabase/types'

interface CreateLearningUnitRequest {
  document_id: string
  title: string
  description?: string
  learning_objectives?: string[]
  estimated_minutes?: number
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
 * GET /api/learning-units
 * List learning units for a document
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'document_id ist erforderlich' },
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

    // Get learning units with sections
    const { data: learningUnits, error } = await supabase
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
      .eq('document_id', documentId)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching learning units:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Lerneinheiten' },
        { status: 500 }
      )
    }

    // Transform the response
    const unitsWithSections: LearningUnitWithSections[] = (learningUnits || []).map(unit => {
      const rawSections = (unit.learning_unit_sections || []) as LearningUnitSectionRow[]
      return {
        ...unit,
        learning_objectives: unit.learning_objectives || [],
        sections: rawSections
          .map((lus) => ({
            id: lus.id,
            section_id: lus.section_id,
            sequence_order: lus.sequence_order,
            section: lus.sections,
          }))
          .sort((a, b) => a.sequence_order - b.sequence_order),
      }
    })

    return NextResponse.json({
      learning_units: unitsWithSections,
      count: unitsWithSections.length,
    })

  } catch (error) {
    console.error('Learning units GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/learning-units
 * Create a new learning unit
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateLearningUnitRequest = await request.json()

    if (!body.document_id) {
      return NextResponse.json(
        { error: 'document_id ist erforderlich' },
        { status: 400 }
      )
    }

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
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

    // Check if document exists and user has access
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

    // Get next sequence order
    const { data: maxOrder } = await supabase
      .from('learning_units')
      .select('sequence_order')
      .eq('document_id', body.document_id)
      .order('sequence_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.sequence_order ?? -1) + 1

    // Create learning unit
    const { data: learningUnit, error: createError } = await supabase
      .from('learning_units')
      .insert({
        document_id: body.document_id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        learning_objectives: body.learning_objectives || null,
        estimated_minutes: body.estimated_minutes || null,
        sequence_order: nextOrder,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating learning unit:', createError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Lerneinheit' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      learning_unit: {
        ...learningUnit,
        sections: [],
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Learning unit creation error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
