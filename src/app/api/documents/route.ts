'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Valid section types for the initial section
const VALID_SECTION_TYPES = [
  'chapter', 'subchapter', 'learning_objectives', 'task', 'practice_impulse',
  'reflection', 'tip', 'summary', 'definition', 'example', 'important',
  'exercise', 'solution', 'reference'
] as const

type SectionType = typeof VALID_SECTION_TYPES[number]

interface CreateDocumentRequest {
  title: string
  description?: string
  module_id?: string
  initial_section_type?: SectionType
  initial_section_title?: string
}

// POST /api/documents - Create a new blank document
export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentRequest = await request.json()

    // Validate required fields
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Nicht authentifiziert' },
          { status: 401 }
        )
      }
      userId = user.id
    } else {
      // Try to get user from cookie-based session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Nicht authentifiziert' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    // Create the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        original_filename: null,
        storage_path: '', // No file for blank documents
        total_pages: 0,
        has_images: false,
        ai_summary: null,
      })
      .select()
      .single()

    if (docError) {
      console.error('Error creating document:', docError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Dokuments' },
        { status: 500 }
      )
    }

    // Create initial section if requested
    const sectionType = body.initial_section_type || 'chapter'
    const sectionTitle = body.initial_section_title || 'Kapitel 1'

    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        document_id: document.id,
        section_type: sectionType,
        title: sectionTitle,
        content: '',
        order_index: 0,
        metadata: {
          level: sectionType === 'chapter' ? 0 : 1,
          chapter_number: sectionType === 'chapter' ? '1' : undefined,
        },
      })
      .select()
      .single()

    if (sectionError) {
      console.error('Error creating initial section:', sectionError)
      // Document was created but section failed - still return success
      // User can add sections manually
    }

    // If module_id was provided, link the document to the module
    if (body.module_id) {
      // Get max sequence_order for this module
      const { data: existingDocs } = await supabase
        .from('module_documents')
        .select('sequence_order')
        .eq('module_id', body.module_id)
        .order('sequence_order', { ascending: false })
        .limit(1)

      const nextOrder = existingDocs && existingDocs.length > 0
        ? (existingDocs[0].sequence_order || 0) + 1
        : 0

      const { error: linkError } = await supabase
        .from('module_documents')
        .insert({
          module_id: body.module_id,
          document_id: document.id,
          sequence_order: nextOrder,
        })

      if (linkError) {
        console.error('Error linking document to module:', linkError)
        // Non-critical error, document was created
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        initial_section: section || null,
      },
    })

  } catch (error) {
    console.error('Error in POST /api/documents:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
