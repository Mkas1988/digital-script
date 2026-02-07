'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  MoreVertical,
  Trash2,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { CircularProgress } from '@/components/ui/circular-progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { staggerContainer, staggerItem, cardHover } from '@/lib/animations'
import type { Document } from '@/lib/supabase/types'

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter()

  // Lazy initialize supabase client only on client side
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  const handleDelete = async (doc: Document, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!supabase) return

    if (!confirm(`Möchtest du "${doc.title}" wirklich löschen?`)) {
      return
    }

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.storage_path])

      // Delete sections first (foreign key constraint)
      await supabase.from('sections').delete().eq('document_id', doc.id)

      // Delete document
      const { error } = await supabase.from('documents').delete().eq('id', doc.id)

      if (error) throw error

      toast.success('Skript erfolgreich gelöscht')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Fehler beim Löschen')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getReadingProgress = (doc: Document) => {
    // TODO: Implement actual reading progress from database
    // For now, return a placeholder based on document age
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.min(daysSinceCreated * 10, 100)
  }

  return (
    <motion.div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {documents.map((doc, index) => (
        <motion.div
          key={doc.id}
          variants={staggerItem}
          custom={index}
        >
          <Link href={`/documents/${doc.id}`}>
            <motion.div
              variants={cardHover}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <GlassCard
                variant="interactive"
                className="group relative overflow-hidden h-full"
              >
                {/* Premium gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 opacity-80" />

                {/* AI Badge if processed */}
                {doc.ai_summary && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    KI
                  </div>
                )}

                <div className="p-5 pt-6">
                  {/* Header with icon and menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-400" />
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-brand-400 transition-colors line-clamp-2 text-sm">
                        {doc.title}
                      </h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10"
                        >
                          <span className="sr-only">Menü öffnen</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`/documents/${doc.id}`)
                          }}
                          className="cursor-pointer gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Öffnen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(doc, e)}
                          className="cursor-pointer text-destructive gap-2 focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Document info */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.original_filename}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {doc.total_pages && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{doc.total_pages} Seiten</span>
                        </div>
                      )}
                      {doc.has_images && (
                        <div className="flex items-center gap-1.5 text-brand-400">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Bilder</span>
                        </div>
                      )}
                    </div>

                    {/* Footer with date and progress */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(doc.updated_at)}</span>
                      </div>

                      <CircularProgress
                        value={getReadingProgress(doc)}
                        size="xs"
                        showValue
                        className="text-brand-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-600/5" />
                </div>
              </GlassCard>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Empty state component
export function DocumentListEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard variant="elevated" className="py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Noch keine Skripte
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Lade dein erstes PDF hoch, um es als interaktives Skript zu lesen.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
