'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Settings,
  Plus,
  FileText,
  GripVertical,
  Trash2,
  Loader2,
  BookOpen,
  Users,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModule } from '@/hooks/useModules'
import type { Document, ModuleRole } from '@/lib/supabase/types'

const roleLabels: Record<ModuleRole, string> = {
  owner: 'Eigentümer',
  editor: 'Bearbeiter',
  viewer: 'Leser',
}

export default function ModuleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = params.id as string

  const {
    module,
    isLoading,
    error,
    updateModule,
    removeDocument,
    refetch,
  } = useModule(moduleId)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const startEditing = () => {
    if (module) {
      setEditTitle(module.title)
      setEditDescription(module.description || '')
      setIsEditing(true)
    }
  }

  const saveChanges = async () => {
    if (!module) return
    setIsSaving(true)
    await updateModule({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    })
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleRemoveDocument = async (documentId: string) => {
    if (!confirm('Dokument wirklich aus dem Modul entfernen?')) return
    await removeDocument(documentId)
  }

  const togglePublished = async () => {
    if (!module) return
    await updateModule({ is_published: !module.is_published })
  }

  const canEdit = module?.role === 'owner' || module?.role === 'editor'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Modul nicht gefunden'}</p>
          <Button onClick={() => router.push('/modules')}>
            Zurück zu Module
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/modules')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Alle Module
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={cn(
                      'w-full px-4 py-2 text-2xl font-bold rounded-lg',
                      'bg-background border border-input',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500'
                    )}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Beschreibung..."
                    rows={2}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg resize-none',
                      'bg-background border border-input',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500'
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSaving ? 'Speichern...' : 'Speichern'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {module.title}
                  </h1>
                  {module.description && (
                    <p className="text-muted-foreground">{module.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePublished}
                >
                  {module.is_published ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Als Entwurf
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Veröffentlichen
                    </>
                  )}
                </Button>
                {module.role === 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/modules/${moduleId}/settings`)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Team
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {roleLabels[module.role]}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {module.documents.length} Dokumente
            </span>
            <span className="flex items-center gap-1">
              {module.is_published ? (
                <>
                  <Globe className="w-4 h-4 text-green-500" />
                  Veröffentlicht
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Entwurf
                </>
              )}
            </span>
          </div>
        </header>

        {/* Documents Section */}
        <section className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-foreground">
                Dokumente
              </h2>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  // TODO: Open document selector modal
                  alert('Dokument-Auswahl kommt bald!')
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            )}
          </div>

          {module.documents.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-lg bg-muted/30">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Noch keine Dokumente hinzugefügt
              </p>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => alert('Dokument-Auswahl kommt bald!')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Dokument hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {module.documents.map((md) => (
                <div
                  key={md.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:border-purple-500/50 transition-colors"
                >
                  {canEdit && (
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  )}
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {md.document.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {md.document.original_filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/documents/${md.document_id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDocument(md.document_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
