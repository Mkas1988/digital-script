'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  Plus,
  FolderPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSection } from '@/components/dashboard'
import { UploadCard } from './UploadCard'
import { DocumentList, DocumentListEmpty } from './DocumentList'
import { CreateScriptWizard } from './CreateScriptWizard'
import { ScriptManagementPanel } from './ScriptManagementPanel'
import { CreateModuleDialog } from './CreateModuleDialog'
import { EditModuleDialog } from './EditModuleDialog'
import { createClient } from '@/lib/supabase/client'
import type { Document, Module } from '@/lib/supabase/types'

interface DocumentsPageClientProps {
  documents: Document[]
  modules: Module[]
  moduleDocuments: { module_id: string; document_id: string }[]
}

export function DocumentsPageClient({
  documents,
  modules: initialModules,
  moduleDocuments: initialModuleDocuments,
}: DocumentsPageClientProps) {
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)

  // Client-side state for modules (server-side RLS may not work correctly)
  const [modules, setModules] = useState<Module[]>(initialModules)
  const [moduleDocuments, setModuleDocuments] = useState(initialModuleDocuments)

  // Load modules client-side to ensure proper auth
  const loadModules = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return
    }

    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('title', { ascending: true })

    if (!modulesError) {
      setModules(modulesData || [])
    }

    const { data: moduleDocsData } = await supabase
      .from('module_documents')
      .select('module_id, document_id')

    if (moduleDocsData) {
      setModuleDocuments(moduleDocsData)
    }
  }, [])

  // Load modules on mount and when dialogs close
  useEffect(() => {
    loadModules()
  }, [loadModules])

  const documentCount = documents.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Premium Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Meine Skripte
                  </h1>
                  <p className="text-muted-foreground">
                    Deine persönliche Lernbibliothek
                  </p>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {documentCount > 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{documentCount}</span>
                      <span className="text-muted-foreground ml-1">
                        {documentCount === 1 ? 'Skript' : 'Skripte'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span className="text-sm text-brand-400 font-medium">
                      KI-gestützt
                    </span>
                  </div>
                </>
              )}

              {/* New Script Button - Always visible */}
              <Button
                variant="premium"
                size="lg"
                onClick={() => setShowCreateWizard(true)}
                className="gap-2 shadow-lg shadow-brand-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Neues Skript</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {/* Dashboard - only show when documents exist */}
          {documentCount > 0 && <DashboardSection />}

          {/* Upload Card - Compact version */}
          <section>
            <UploadCard />
          </section>

          {/* Script Management Panel */}
          <section>
            <ScriptManagementPanel
              documents={documents}
              modules={modules}
              moduleDocuments={moduleDocuments}
              onCreateScript={() => setShowCreateWizard(true)}
              onCreateModule={() => setShowCreateModule(true)}
              onEditModule={(module) => setEditingModule(module)}
            />
          </section>
        </div>
      </div>

      {/* Create Script Wizard */}
      <CreateScriptWizard
        isOpen={showCreateWizard}
        onClose={() => {
          setShowCreateWizard(false)
          // Reload modules in case document was assigned to a module
          loadModules()
        }}
        modules={modules}
      />

      {/* Create Module Dialog */}
      <CreateModuleDialog
        isOpen={showCreateModule}
        onClose={() => {
          setShowCreateModule(false)
          // Reload modules after creating a new one
          loadModules()
        }}
      />

      {/* Edit Module Dialog */}
      <EditModuleDialog
        isOpen={!!editingModule}
        onClose={() => {
          setEditingModule(null)
          // Reload modules after editing
          loadModules()
        }}
        module={editingModule}
      />
    </div>
  )
}
