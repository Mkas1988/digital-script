import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ExerciseSolution, Section } from '@/lib/supabase/types'

interface CreateExerciseSolutionRequest {
  exercise_section_id: string
  solution_section_id: string
}

interface ExerciseSolutionWithSections extends ExerciseSolution {
  exercise_section: Section
  solution_section: Section
}

/**
 * GET /api/exercise-solutions
 * List exercise-solution links for a document
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const exerciseSectionId = searchParams.get('exercise_section_id')

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('exercise_solutions')
      .select(`
        *,
        exercise_section:sections!exercise_section_id(*),
        solution_section:sections!solution_section_id(*)
      `)

    // Filter by specific exercise
    if (exerciseSectionId) {
      query = query.eq('exercise_section_id', exerciseSectionId)
    }

    const { data: solutions, error } = await query

    if (error) {
      console.error('Error fetching exercise solutions:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Lösungsverknüpfungen' },
        { status: 500 }
      )
    }

    // If document_id provided, filter to only include solutions from that document
    let filteredSolutions = solutions || []
    if (documentId) {
      filteredSolutions = filteredSolutions.filter(sol => {
        const exerciseSection = sol.exercise_section as Section
        return exerciseSection?.document_id === documentId
      })
    }

    const solutionsWithSections: ExerciseSolutionWithSections[] = filteredSolutions.map(sol => ({
      id: sol.id,
      exercise_section_id: sol.exercise_section_id,
      solution_section_id: sol.solution_section_id,
      created_at: sol.created_at,
      exercise_section: sol.exercise_section as Section,
      solution_section: sol.solution_section as Section,
    }))

    return NextResponse.json({
      solutions: solutionsWithSections,
      count: solutionsWithSections.length,
    })

  } catch (error) {
    console.error('Exercise solutions GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exercise-solutions
 * Create a new exercise-solution link
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateExerciseSolutionRequest = await request.json()

    if (!body.exercise_section_id) {
      return NextResponse.json(
        { error: 'exercise_section_id ist erforderlich' },
        { status: 400 }
      )
    }

    if (!body.solution_section_id) {
      return NextResponse.json(
        { error: 'solution_section_id ist erforderlich' },
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

    // Verify both sections exist and are the correct types
    const { data: exerciseSection, error: exError } = await supabase
      .from('sections')
      .select('id, section_type, document_id')
      .eq('id', body.exercise_section_id)
      .single()

    if (exError || !exerciseSection) {
      return NextResponse.json(
        { error: 'Aufgaben-Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    if (exerciseSection.section_type !== 'exercise' && exerciseSection.section_type !== 'task') {
      return NextResponse.json(
        { error: 'Die angegebene Sektion ist keine Aufgabe' },
        { status: 400 }
      )
    }

    const { data: solutionSection, error: solError } = await supabase
      .from('sections')
      .select('id, section_type, document_id')
      .eq('id', body.solution_section_id)
      .single()

    if (solError || !solutionSection) {
      return NextResponse.json(
        { error: 'Lösungs-Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    if (solutionSection.section_type !== 'solution') {
      return NextResponse.json(
        { error: 'Die angegebene Sektion ist keine Lösung' },
        { status: 400 }
      )
    }

    // Both sections should be in the same document
    if (exerciseSection.document_id !== solutionSection.document_id) {
      return NextResponse.json(
        { error: 'Aufgabe und Lösung müssen im selben Dokument sein' },
        { status: 400 }
      )
    }

    // Create the link
    const { data: solution, error: createError } = await supabase
      .from('exercise_solutions')
      .insert({
        exercise_section_id: body.exercise_section_id,
        solution_section_id: body.solution_section_id,
      })
      .select(`
        *,
        exercise_section:sections!exercise_section_id(*),
        solution_section:sections!solution_section_id(*)
      `)
      .single()

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Diese Verknüpfung existiert bereits' },
          { status: 409 }
        )
      }
      console.error('Error creating exercise solution:', createError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Verknüpfung' },
        { status: 500 }
      )
    }

    // Also update the metadata in both sections
    await supabase
      .from('sections')
      .update({
        metadata: {
          ...((exerciseSection as Record<string, unknown>).metadata || {}),
          solution_id: body.solution_section_id,
        },
      })
      .eq('id', body.exercise_section_id)

    await supabase
      .from('sections')
      .update({
        metadata: {
          ...((solutionSection as Record<string, unknown>).metadata || {}),
          exercise_id: body.exercise_section_id,
        },
      })
      .eq('id', body.solution_section_id)

    return NextResponse.json({
      success: true,
      solution: {
        id: solution.id,
        exercise_section_id: solution.exercise_section_id,
        solution_section_id: solution.solution_section_id,
        created_at: solution.created_at,
        exercise_section: solution.exercise_section as Section,
        solution_section: solution.solution_section as Section,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Exercise solution creation error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exercise-solutions
 * Delete an exercise-solution link
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const exerciseSectionId = searchParams.get('exercise_section_id')

    if (!id && !exerciseSectionId) {
      return NextResponse.json(
        { error: 'id oder exercise_section_id ist erforderlich' },
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

    // Get the solution first to update metadata
    let query = supabase.from('exercise_solutions').select('*')
    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('exercise_section_id', exerciseSectionId!)
    }

    const { data: solution } = await query.single()

    if (solution) {
      // Remove metadata links
      await supabase
        .from('sections')
        .update({
          metadata: supabase.rpc('jsonb_delete_key', {
            target: 'metadata',
            key: 'solution_id',
          }),
        })
        .eq('id', solution.exercise_section_id)

      await supabase
        .from('sections')
        .update({
          metadata: supabase.rpc('jsonb_delete_key', {
            target: 'metadata',
            key: 'exercise_id',
          }),
        })
        .eq('id', solution.solution_section_id)
    }

    // Delete the link
    let deleteQuery = supabase.from('exercise_solutions').delete()
    if (id) {
      deleteQuery = deleteQuery.eq('id', id)
    } else {
      deleteQuery = deleteQuery.eq('exercise_section_id', exerciseSectionId!)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Error deleting exercise solution:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Verknüpfung' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Exercise solution DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
