import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ModuleRole, Document } from '@/lib/supabase/types'

interface AddDocumentRequest {
  document_id: string
  sequence_order?: number
}

interface UpdateDocumentOrderRequest {
  document_ids: string[] // Array of document IDs in desired order
}

/**
 * Helper function to check if user can edit module
 */
async function canEditModule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  userId: string
): Promise<boolean> {
  // Check if owner
  const { data: module } = await supabase
    .from('modules')
    .select('owner_id')
    .eq('id', moduleId)
    .single()

  if (module?.owner_id === userId) {
    return true
  }

  // Check if editor
  const { data: membership } = await supabase
    .from('module_members')
    .select('role')
    .eq('module_id', moduleId)
    .eq('user_id', userId)
    .single()

  return membership?.role === 'editor' || membership?.role === 'owner'
}

/**
 * GET /api/modules/[id]/documents
 * List all documents in a module
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

    // Get documents with their details
    const { data: moduleDocuments, error } = await supabase
      .from('module_documents')
      .select('id, document_id, sequence_order, documents(*)')
      .eq('module_id', id)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching module documents:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Dokumente' },
        { status: 500 }
      )
    }

    const documents = (moduleDocuments || []).map(md => ({
      id: md.id,
      document_id: md.document_id,
      sequence_order: md.sequence_order,
      document: md.documents as unknown as Document,
    }))

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Module documents GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules/[id]/documents
 * Add a document to a module
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: AddDocumentRequest = await request.json()

    if (!body.document_id) {
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

    // Check if user can edit
    const canEdit = await canEditModule(supabase, id, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
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
      .from('module_documents')
      .select('sequence_order')
      .eq('module_id', id)
      .order('sequence_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = body.sequence_order ?? ((maxOrder?.sequence_order ?? -1) + 1)

    // Add document to module
    const { data: moduleDocument, error: insertError } = await supabase
      .from('module_documents')
      .insert({
        module_id: id,
        document_id: body.document_id,
        sequence_order: nextOrder,
      })
      .select('id, document_id, sequence_order, documents(*)')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Dokument ist bereits im Modul' },
          { status: 409 }
        )
      }
      console.error('Error adding document to module:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Hinzufügen des Dokuments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: moduleDocument.id,
        document_id: moduleDocument.document_id,
        sequence_order: moduleDocument.sequence_order,
        document: moduleDocument.documents as unknown as Document,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Module documents POST error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/modules/[id]/documents
 * Update document order in module
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateDocumentOrderRequest = await request.json()

    if (!body.document_ids || !Array.isArray(body.document_ids)) {
      return NextResponse.json(
        { error: 'document_ids Array ist erforderlich' },
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

    // Check if user can edit
    const canEdit = await canEditModule(supabase, id, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Update order for each document
    const updates = body.document_ids.map((documentId, index) =>
      supabase
        .from('module_documents')
        .update({ sequence_order: index })
        .eq('module_id', id)
        .eq('document_id', documentId)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Module documents PATCH error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[id]/documents
 * Remove a document from a module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if user can edit
    const canEdit = await canEditModule(supabase, id, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Remove document from module
    const { error: deleteError } = await supabase
      .from('module_documents')
      .delete()
      .eq('module_id', id)
      .eq('document_id', documentId)

    if (deleteError) {
      console.error('Error removing document from module:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Entfernen des Dokuments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Module documents DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
