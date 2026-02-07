import { createClient } from '@/lib/supabase/server'
import { DocumentsPageClient } from '@/components/documents/DocumentsPageClient'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })

  // Note: Modules are loaded client-side in DocumentsPageClient for proper auth
  // Server-side fetch is just for initial render, client will refresh
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('title', { ascending: true })

  // Fetch module-document relationships
  const { data: moduleDocuments } = await supabase
    .from('module_documents')
    .select('module_id, document_id')

  return (
    <DocumentsPageClient
      documents={documents || []}
      modules={modules || []}
      moduleDocuments={moduleDocuments || []}
    />
  )
}
