import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ReorderRequest {
  document_id: string
  section_id: string
  new_order_index: number
}

/**
 * PATCH /api/sections/reorder
 * Reorder a section within a document
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: ReorderRequest = await request.json()

    // Validate required fields
    if (!body.document_id || !body.section_id || typeof body.new_order_index !== 'number') {
      return NextResponse.json(
        { error: 'document_id, section_id und new_order_index sind erforderlich' },
        { status: 400 }
      )
    }

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

    // Get the section to be moved
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id, order_index')
      .eq('id', body.section_id)
      .eq('document_id', body.document_id)
      .single()

    if (sectionError || !section) {
      return NextResponse.json(
        { error: 'Sektion nicht gefunden' },
        { status: 404 }
      )
    }

    const oldIndex = section.order_index
    const newIndex = body.new_order_index

    // No change needed
    if (oldIndex === newIndex) {
      return NextResponse.json({
        success: true,
        message: 'Keine Änderung erforderlich',
      })
    }

    // Get all sections in the document
    const { data: allSections, error: fetchError } = await supabase
      .from('sections')
      .select('id, order_index')
      .eq('document_id', body.document_id)
      .order('order_index', { ascending: true })

    if (fetchError || !allSections) {
      return NextResponse.json(
        { error: 'Fehler beim Abrufen der Sektionen' },
        { status: 500 }
      )
    }

    // Calculate new order indices
    if (newIndex < oldIndex) {
      // Moving up: shift sections between newIndex and oldIndex-1 down
      for (const s of allSections) {
        if (s.order_index >= newIndex && s.order_index < oldIndex) {
          await supabase
            .from('sections')
            .update({ order_index: s.order_index + 1 })
            .eq('id', s.id)
        }
      }
    } else {
      // Moving down: shift sections between oldIndex+1 and newIndex up
      for (const s of allSections) {
        if (s.order_index > oldIndex && s.order_index <= newIndex) {
          await supabase
            .from('sections')
            .update({ order_index: s.order_index - 1 })
            .eq('id', s.id)
        }
      }
    }

    // Update the moved section
    const { error: updateError } = await supabase
      .from('sections')
      .update({ order_index: newIndex })
      .eq('id', body.section_id)

    if (updateError) {
      console.error('Section reorder error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Neuordnen der Sektion' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sektion erfolgreich verschoben',
      oldIndex,
      newIndex,
    })

  } catch (error) {
    console.error('Section reorder error:', error)
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
