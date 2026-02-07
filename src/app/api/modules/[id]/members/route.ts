import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ModuleRole } from '@/lib/supabase/types'

interface AddMemberRequest {
  user_id?: string
  email?: string
  role: ModuleRole
}

interface UpdateMemberRequest {
  user_id: string
  role: ModuleRole
}

const VALID_ROLES: ModuleRole[] = ['owner', 'editor', 'viewer']

/**
 * Helper function to check if user is owner
 */
async function isModuleOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  userId: string
): Promise<boolean> {
  const { data: module } = await supabase
    .from('modules')
    .select('owner_id')
    .eq('id', moduleId)
    .single()

  return module?.owner_id === userId
}

/**
 * GET /api/modules/[id]/members
 * List all members of a module (owner only)
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

    // Check if user is owner
    const isOwner = await isModuleOwner(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Nur der Eigentümer kann Mitglieder sehen' },
        { status: 403 }
      )
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('module_members')
      .select('*')
      .eq('module_id', id)
      .order('invited_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Mitglieder' },
        { status: 500 }
      )
    }

    // Get user emails for each member
    const memberIds = members?.map(m => m.user_id) || []
    const { data: users } = await supabase.auth.admin.listUsers()

    const membersWithEmail = (members || []).map(member => {
      const userInfo = users?.users.find(u => u.id === member.user_id)
      return {
        ...member,
        email: userInfo?.email || 'Unbekannt',
      }
    })

    return NextResponse.json({ members: membersWithEmail })

  } catch (error) {
    console.error('Module members GET error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules/[id]/members
 * Add a member to a module (owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: AddMemberRequest = await request.json()

    // Validate role
    if (!body.role || !VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Ungültige Rolle' },
        { status: 400 }
      )
    }

    // Cannot add someone as owner
    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Kann keine weiteren Eigentümer hinzufügen' },
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

    // Check if user is owner
    const isOwner = await isModuleOwner(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Nur der Eigentümer kann Mitglieder hinzufügen' },
        { status: 403 }
      )
    }

    let targetUserId = body.user_id

    // If email is provided instead of user_id, find the user
    if (!targetUserId && body.email) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const targetUser = users?.users.find(
        u => u.email?.toLowerCase() === body.email?.toLowerCase()
      )

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Benutzer mit dieser E-Mail nicht gefunden' },
          { status: 404 }
        )
      }

      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id oder email ist erforderlich' },
        { status: 400 }
      )
    }

    // Cannot add yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Sie können sich nicht selbst hinzufügen' },
        { status: 400 }
      )
    }

    // Add member
    const { data: member, error: insertError } = await supabase
      .from('module_members')
      .insert({
        module_id: id,
        user_id: targetUserId,
        role: body.role,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Benutzer ist bereits Mitglied' },
          { status: 409 }
        )
      }
      console.error('Error adding member:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Hinzufügen des Mitglieds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member,
    }, { status: 201 })

  } catch (error) {
    console.error('Module members POST error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/modules/[id]/members
 * Update a member's role (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateMemberRequest = await request.json()

    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id ist erforderlich' },
        { status: 400 }
      )
    }

    // Validate role
    if (!body.role || !VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Ungültige Rolle' },
        { status: 400 }
      )
    }

    // Cannot change to owner
    if (body.role === 'owner') {
      return NextResponse.json(
        { error: 'Kann Rolle nicht zu Eigentümer ändern' },
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

    // Check if user is owner
    const isOwner = await isModuleOwner(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Nur der Eigentümer kann Rollen ändern' },
        { status: 403 }
      )
    }

    // Update member role
    const { data: member, error: updateError } = await supabase
      .from('module_members')
      .update({ role: body.role })
      .eq('module_id', id)
      .eq('user_id', body.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Mitglieds' },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      member,
    })

  } catch (error) {
    console.error('Module members PATCH error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[id]/members
 * Remove a member from a module (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id ist erforderlich' },
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

    // Check if user is owner
    const isOwner = await isModuleOwner(supabase, id, user.id)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Nur der Eigentümer kann Mitglieder entfernen' },
        { status: 403 }
      )
    }

    // Cannot remove yourself if you're the owner
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Sie können sich nicht selbst entfernen' },
        { status: 400 }
      )
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('module_members')
      .delete()
      .eq('module_id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Entfernen des Mitglieds' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Module members DELETE error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
