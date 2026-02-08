'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  FolderOpen,
  FileText,
  MoreVertical,
  Trash2,
  ExternalLink,
  Edit3,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Search,
  Filter,
  Plus,
  Calendar,
  BookOpen,
  Sparkles,
  ArrowUpDown,
  FolderInput,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Document, Module } from '@/lib/supabase/types'

// Progress tracking types
interface DocumentProgress {
  documentId: string
  totalSections: number
  completedSections: number
  progressPercent: number
}

interface ScriptManagementPanelProps {
  documents: Document[]
  modules: Module[]
  moduleDocuments: { module_id: string; document_id: string }[]
  onCreateScript: () => void
  onCreateModule: () => void
  onEditModule: (module: Module) => void
}

type ViewMode = 'list' | 'modules'
type SortBy = 'updated' | 'title' | 'created'

export function ScriptManagementPanel({
  documents,
  modules,
  moduleDocuments,
  onCreateScript,
  onCreateModule,
  onEditModule,
}: ScriptManagementPanelProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('modules')
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const [searchQuery, setSearchQuery] = useState('')
  // Expand all modules by default (including __unassigned__ and all module IDs)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const defaultExpanded = new Set(['__unassigned__'])
    modules.forEach(m => defaultExpanded.add(m.id))
    return defaultExpanded
  })

  // Auto-expand new modules when they're added
  useEffect(() => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      modules.forEach(m => next.add(m.id))
      return next
    })
  }, [modules])
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [documentProgress, setDocumentProgress] = useState<Map<string, DocumentProgress>>(new Map())

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  // Helper to get progress from localStorage for a document
  const getLocalStorageProgress = useCallback((documentId: string): Record<string, boolean> => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(`reading-progress-${documentId}`)
      if (stored) {
        const data = JSON.parse(stored)
        return data.completed || {}
      }
    } catch {
      // ignore
    }
    return {}
  }, [])

  // Load sections and calculate progress for all documents
  useEffect(() => {
    if (!supabase || documents.length === 0) return

    const loadProgress = async () => {
      const { data: sections } = await supabase
        .from('sections')
        .select('id, document_id')

      if (!sections) return

      const progressMap = new Map<string, DocumentProgress>()

      documents.forEach(doc => {
        const docSections = sections.filter(s => s.document_id === doc.id)
        const localProgress = getLocalStorageProgress(doc.id)

        let completed = 0
        docSections.forEach(section => {
          if (localProgress[section.id]) {
            completed++
          }
        })

        const total = docSections.length
        progressMap.set(doc.id, {
          documentId: doc.id,
          totalSections: total,
          completedSections: completed,
          progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        })
      })

      setDocumentProgress(progressMap)
    }

    loadProgress()
  }, [supabase, documents, getLocalStorageProgress])

  // Filter documents by search
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const query = searchQuery.toLowerCase()
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.original_filename?.toLowerCase().includes(query)
    )
  }, [documents, searchQuery])

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments]
    switch (sortBy) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'created':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'updated':
      default:
        sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
    return sorted
  }, [filteredDocuments, sortBy])

  // Group documents by module
  const documentsByModule = useMemo(() => {
    const moduleMap = new Map<string, Document[]>()

    // Initialize with all modules
    modules.forEach((module) => {
      moduleMap.set(module.id, [])
    })
    moduleMap.set('__unassigned__', [])

    // Assign documents to modules
    sortedDocuments.forEach((doc) => {
      const assignment = moduleDocuments.find((md) => md.document_id === doc.id)
      if (assignment && moduleMap.has(assignment.module_id)) {
        moduleMap.get(assignment.module_id)!.push(doc)
      } else {
        moduleMap.get('__unassigned__')!.push(doc)
      }
    })

    return moduleMap
  }, [modules, sortedDocuments, moduleDocuments])

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const handleDelete = async (doc: Document, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!supabase) return

    if (!confirm(`Möchtest du "${doc.title}" wirklich löschen?`)) {
      return
    }

    try {
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path])
      }
      await supabase.from('sections').delete().eq('document_id', doc.id)
      const { error } = await supabase.from('documents').delete().eq('id', doc.id)

      if (error) throw error

      toast.success('Skript erfolgreich gelöscht')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Fehler beim Löschen')
    }
  }

  const handleRename = async (doc: Document) => {
    if (!supabase || !editingTitle.trim()) return

    try {
      const { error } = await supabase
        .from('documents')
        .update({ title: editingTitle.trim() })
        .eq('id', doc.id)

      if (error) throw error

      toast.success('Titel geändert')
      setEditingDocId(null)
      router.refresh()
    } catch (error) {
      console.error('Rename error:', error)
      toast.error('Fehler beim Umbenennen')
    }
  }

  const handleMoveToModule = async (docId: string, moduleId: string | null) => {
    if (!supabase) return

    try {
      // Remove existing assignment
      await supabase.from('module_documents').delete().eq('document_id', docId)

      // Add new assignment if moduleId provided
      if (moduleId) {
        const { error } = await supabase.from('module_documents').insert({
          module_id: moduleId,
          document_id: docId,
          sequence_order: 0,
        })
        if (error) throw error
      }

      toast.success(moduleId ? 'Skript verschoben' : 'Skript entfernt')
      router.refresh()
    } catch (error) {
      console.error('Move error:', error)
      toast.error('Fehler beim Verschieben')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const DocumentItem = ({ doc }: { doc: Document }) => {
    const isEditing = editingDocId === doc.id
    const progress = documentProgress.get(doc.id)
    const isComplete = progress && progress.progressPercent === 100

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group"
      >
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg transition-colors',
            'hover:bg-muted/50 cursor-pointer'
          )}
        >
          <GripVertical className="hidden sm:block w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />

          {/* Progress circle indicator */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg className="w-9 h-9 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/30"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - (progress?.progressPercent || 0) / 100)}
                className={cn(
                  'transition-all duration-500',
                  isComplete ? 'text-green-500' : 'text-brand-500'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <FileText className="w-4 h-4 text-brand-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleRename(doc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(doc)
                  if (e.key === 'Escape') setEditingDocId(null)
                }}
                className="h-7 text-sm"
                autoFocus
              />
            ) : (
              <Link href={`/documents/${doc.id}`} className="block">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground truncate group-hover:text-brand-400 transition-colors">
                    {doc.title}
                  </p>
                  {progress && progress.totalSections > 0 && (
                    <span className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      isComplete
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {progress.progressPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {progress && progress.totalSections > 0 && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {progress.completedSections}/{progress.totalSections}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(doc.updated_at)}
                  </span>
                  {doc.ai_summary && (
                    <span className="flex items-center gap-1 text-brand-400">
                      <Sparkles className="w-3 h-3" />
                      KI
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/documents/${doc.id}`)
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Öffnen
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setEditingDocId(doc.id)
                  setEditingTitle(doc.title)
                }}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Umbenennen
              </DropdownMenuItem>

              {modules.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FolderInput className="w-4 h-4" />
                    <span>Verschieben nach...</span>
                  </DropdownMenuItem>
                  <div className="px-2 py-1">
                    <button
                      onClick={() => handleMoveToModule(doc.id, null)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted"
                    >
                      Kein Modul
                    </button>
                    {modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => handleMoveToModule(doc.id, module.id)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate"
                      >
                        {module.title}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => handleDelete(doc, e)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    )
  }

  const ModuleSection = ({
    moduleId,
    title,
    documents,
    icon,
    moduleData,
  }: {
    moduleId: string
    title: string
    documents: Document[]
    icon?: React.ReactNode
    moduleData?: Module
  }) => {
    const isExpanded = expandedModules.has(moduleId)
    const isRealModule = moduleId !== '__unassigned__' && moduleData

    // Calculate combined progress for module
    const moduleProgressStats = useMemo(() => {
      let totalSections = 0
      let completedSections = 0

      documents.forEach(doc => {
        const progress = documentProgress.get(doc.id)
        if (progress) {
          totalSections += progress.totalSections
          completedSections += progress.completedSections
        }
      })

      const progressPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
      const isComplete = totalSections > 0 && completedSections === totalSections

      return { totalSections, completedSections, progressPercent, isComplete }
    }, [documents, documentProgress])

    return (
      <div className="border border-border/50 rounded-xl overflow-hidden group/module">
        <div className="flex items-center bg-muted/30 hover:bg-muted/50 transition-colors">
          <button
            onClick={() => toggleModule(moduleId)}
            className="flex-1 flex items-center gap-3 p-4"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}

            {/* Module progress circle */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg className="w-9 h-9 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/30"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - moduleProgressStats.progressPercent / 100)}
                  className={cn(
                    'transition-all duration-500',
                    moduleProgressStats.isComplete ? 'text-green-500' : 'text-brand-500'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {moduleProgressStats.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  icon || <FolderOpen className="w-4 h-4 text-brand-400" />
                )}
              </div>
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{title}</span>
                <span className="text-sm text-muted-foreground">
                  ({documents.length} {documents.length === 1 ? 'Skript' : 'Skripte'})
                </span>
                {moduleProgressStats.totalSections > 0 && (
                  <span className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    moduleProgressStats.isComplete
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {moduleProgressStats.progressPercent}%
                  </span>
                )}
              </div>
              {moduleProgressStats.totalSections > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden max-w-[120px] sm:max-w-[200px]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        moduleProgressStats.isComplete ? 'bg-green-500' : 'bg-brand-500'
                      )}
                      style={{ width: `${moduleProgressStats.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {moduleProgressStats.completedSections}/{moduleProgressStats.totalSections}
                  </span>
                </div>
              )}
            </div>
          </button>

          {isRealModule && (
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 opacity-0 group-hover/module:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onEditModule(moduleData)
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <DocumentItem key={doc.id} doc={doc} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Skripte in diesem Modul
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <GlassCard variant="elevated">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Skript-Verwaltung
          </h2>

          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Skripte suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Sortieren</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('updated')}>
                  Zuletzt bearbeitet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')}>
                  Alphabetisch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')}>
                  Erstellungsdatum
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCreateModule} className="gap-2">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Modul</span>
            </Button>
            <Button variant="premium" size="sm" onClick={onCreateScript} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Neues Skript</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {viewMode === 'modules' ? (
          <>
            {/* Unassigned documents */}
            {documentsByModule.get('__unassigned__')!.length > 0 && (
              <ModuleSection
                moduleId="__unassigned__"
                title="Nicht zugeordnet"
                documents={documentsByModule.get('__unassigned__')!}
                icon={<FileText className="w-5 h-5 text-muted-foreground" />}
              />
            )}

            {/* Modules */}
            {modules.map((module) => (
              <ModuleSection
                key={module.id}
                moduleId={module.id}
                title={module.title}
                documents={documentsByModule.get(module.id) || []}
                moduleData={module}
              />
            ))}

            {modules.length === 0 && documentsByModule.get('__unassigned__')!.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">
                  Noch keine Skripte
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstellen Sie Ihr erstes Skript oder laden Sie ein PDF hoch
                </p>
                <Button variant="premium" onClick={onCreateScript}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Skript erstellen
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-1">
            {sortedDocuments.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
