import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Module, ModuleRole, ModuleMember, Document } from '@/lib/supabase/types'

interface UpdateModuleRequest {
  title?: string
  description?: string
  cover_image_url?: string
  is_published?: boolean
  sequence_order?: number
}

interface ModuleWithDetails extends Module {
  role: ModuleRole
  documents: {
    id: string
    document_id: string
    sequence_order: number
    document: Document
  }[]
  members: ModuleMember[]
}

/**
 * Helper function to get user's role for a module
 */
async function getUserRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  userId: string
): Promise<ModuleRole | null> {
  // Check if owner
  const { data: module } = await supabase
    .from('modules')
    .select('owner_id')
    .eq('id', moduleId)
    .single()

  if (module?.owner_id === userId) {
    return 'owner'
  }

  // Check membership
  const { data: membership } = await supabase
    .from('module_members')
    .select('role')
    .eq('module_id', moduleId)
    .eq('user_id', userId)
    .single()

  return membership?.role as ModuleRole | null
}

/**
 * GET /api/modules/[id]
 * Get a single module with all details
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

    // Get the module
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Modul nicht gefunden' },
        { status: 404 }
      )
    }

    // Get user's role
    const role = await getUserRole(supabase, id, user.id)

    if (!role) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Get documents
    const { data: moduleDocuments } = await supabase
      .from('module_documents')
      .select('id, document_id, sequence_order, documents(*)')
      .eq('module_id', id)
      .order('sequence_order', { ascending: true })

    // Get members (only for owners)
    let members: ModuleMember[] = []
    if (role === 'owner') {
      const { data: memberData } = await supabase
        .from('module_members')
        .select('*')
        .eq('module_id', id)
        .order('invited_at', { ascending: false })

      members = memberData || []
    }

    const moduleWithDetails: ModuleWithDetails = {
      ...module,
      role,
      documents: (moduleDocuments || []).map(md => ({
        id: md.id,
        document_id: md.document_id,
        sequence_order: md.sequence_order,
        document: md.documents as unknown as Document,
      })),
      members,
    }

    return NextResponse.json({ module: moduleWithDetails })

  } catch (error) {
    console.error('Module GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/modules/[id]
 * Update a module
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateModuleRequest = await request.json()

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get user's role
    const role = await getUserRole(supabase, id, user.id)

    if (!role || role === 'viewer') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten' },
        { status: 403 }
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

    if (body.cover_image_url !== undefined) {
      updateData.cover_image_url = body.cover_image_url || null
    }

    if (body.is_published !== undefined) {
      // Only owner can publish/unpublish
      if (role !== 'owner') {
        return NextResponse.json(
          { error: 'Nur der Eigentümer kann Module veröffentlichen' },
          { status: 403 }
        )
      }
      updateData.is_published = body.is_published
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
    const { data: updatedModule, error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Module update error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Änderungen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module: {
        ...updatedModule,
        role,
      },
    })

  } catch (error) {
    console.error('Module PATCH error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[id]
 * Delete a module (owner only)
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

    // Check if user is owner
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Modul nicht gefunden' },
        { status: 404 }
      )
    }

    if (module.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Nur der Eigentümer kann das Modul löschen' },
        { status: 403 }
      )
    }

    // Delete the module (cascades to module_members, module_documents)
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Module delete error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen des Moduls' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Module DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
