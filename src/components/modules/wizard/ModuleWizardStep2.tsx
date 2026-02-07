'use client'

import { useState, useEffect } from 'react'
import { FileText, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/lib/supabase/types'
import type { ModuleFormData } from '@/app/modules/create/page'

interface ModuleWizardStep2Props {
  data: ModuleFormData
  onChange: (data: Partial<ModuleFormData>) => void
}

export function ModuleWizardStep2({ data, onChange }: ModuleWizardStep2Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      const supabase = createClient()
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      setDocuments(docs || [])
      setIsLoading(false)
    }

    fetchDocuments()
  }, [])

  const toggleDocument = (docId: string) => {
    const current = data.documentIds
    if (current.includes(docId)) {
      onChange({ documentIds: current.filter((id) => id !== docId) })
    } else {
      onChange({ documentIds: [...current, docId] })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Dokumente hinzufügen
        </h2>
        <p className="text-sm text-muted-foreground">
          Wähle die Skripte aus, die zu diesem Modul gehören sollen.
          Du kannst später weitere hinzufügen.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No Documents */}
      {!isLoading && documents.length === 0 && (
        <div className="text-center py-12 px-4 rounded-lg bg-muted/30 border border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Du hast noch keine Dokumente hochgeladen.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Du kannst das Modul jetzt erstellen und später Dokumente hinzufügen.
          </p>
        </div>
      )}

      {/* Document List */}
      {!isLoading && documents.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground">
            {data.documentIds.length} von {documents.length} ausgewählt
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {documents.map((doc) => {
              const isSelected = data.documentIds.includes(doc.id)
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDocument(doc.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left',
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-border hover:border-purple-500/50 bg-background'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-muted-foreground'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/50'
                        : 'bg-muted'
                    )}
                  >
                    <FileText
                      className={cn(
                        'w-5 h-5',
                        isSelected
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium truncate',
                        isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-foreground'
                      )}
                    >
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.updated_at).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
