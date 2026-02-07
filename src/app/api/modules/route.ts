import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Module, ModuleRole } from '@/lib/supabase/types'

interface CreateModuleRequest {
  title: string
  description?: string
  cover_image_url?: string
  is_published?: boolean
}

interface ModuleWithRole extends Module {
  role: ModuleRole
}

/**
 * GET /api/modules
 * List all modules the user has access to
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')

    // Get modules where user is owner
    const { data: ownedModules, error: ownedError } = await supabase
      .from('modules')
      .select('*')
      .eq('owner_id', user.id)
      .order('sequence_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching owned modules:', ownedError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Module' },
        { status: 500 }
      )
    }

    // Get modules where user is member
    const { data: memberModules, error: memberError } = await supabase
      .from('module_members')
      .select('module_id, role, modules(*)')
      .eq('user_id', user.id)

    if (memberError) {
      console.error('Error fetching member modules:', memberError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Module' },
        { status: 500 }
      )
    }

    // Combine and add role information
    const modulesWithRole: ModuleWithRole[] = []

    // Add owned modules with 'owner' role
    for (const module of ownedModules || []) {
      if (published === 'true' && !module.is_published) continue
      if (published === 'false' && module.is_published) continue
      modulesWithRole.push({
        ...module,
        role: 'owner' as ModuleRole,
      })
    }

    // Add member modules with their role
    for (const membership of memberModules || []) {
      const module = membership.modules as unknown as Module
      if (!module) continue
      if (published === 'true' && !module.is_published) continue
      if (published === 'false' && module.is_published) continue

      // Skip if already added as owner
      if (modulesWithRole.some(m => m.id === module.id)) continue

      modulesWithRole.push({
        ...module,
        role: membership.role as ModuleRole,
      })
    }

    // Sort by sequence_order, then created_at
    modulesWithRole.sort((a, b) => {
      if (a.sequence_order !== b.sequence_order) {
        return a.sequence_order - b.sequence_order
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({
      modules: modulesWithRole,
      count: modulesWithRole.length,
    })

  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/modules
 * Create a new module
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateModuleRequest = await request.json()

    // Validate required fields
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

    // Get next sequence order
    const { data: maxOrder } = await supabase
      .from('modules')
      .select('sequence_order')
      .eq('owner_id', user.id)
      .order('sequence_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.sequence_order ?? -1) + 1

    // Create the module
    const { data: module, error: createError } = await supabase
      .from('modules')
      .insert({
        owner_id: user.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        cover_image_url: body.cover_image_url || null,
        is_published: body.is_published ?? false,
        sequence_order: nextOrder,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating module:', createError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Moduls' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module: {
        ...module,
        role: 'owner' as ModuleRole,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Module creation error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
