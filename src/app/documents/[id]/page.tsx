import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentReader } from '@/components/reader/DocumentReader'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (docError || !document) {
    notFound()
  }

  // Fetch sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('document_id', id)
    .order('order_index', { ascending: true })

  // Update last accessed
  await supabase
    .from('documents')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  return (
    <DocumentReader
      document={document}
      sections={sections || []}
    />
  )
}
