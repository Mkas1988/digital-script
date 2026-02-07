'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  Loader2,
  X,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Module } from '@/lib/supabase/types'

interface EditModuleDialogProps {
  isOpen: boolean
  onClose: () => void
  module: Module | null
}

export function EditModuleDialog({ isOpen, onClose, module }: EditModuleDialogProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Initialize form when module changes
  useEffect(() => {
    if (module) {
      setTitle(module.title)
      setDescription(module.description || '')
    }
  }, [module])

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSaving(false)
        setIsDeleting(false)
      }, 300)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!title.trim() || !module) {
      toast.error('Bitte geben Sie einen Titel ein')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      toast.success('Modul erfolgreich aktualisiert!')
      onClose()
      router.refresh()

    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(`Fehler: ${error?.message || 'Unbekannter Fehler'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!module) return

    if (!confirm(`Möchten Sie das Modul "${module.title}" wirklich löschen? Die Skripte werden nicht gelöscht, nur die Zuordnung.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Löschen')
      }

      toast.success('Modul erfolgreich gelöscht!')
      onClose()
      router.refresh()

    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(`Fehler: ${error?.message || 'Unbekannter Fehler'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !module) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard variant="elevated" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Modul bearbeiten
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Titel und Beschreibung ändern
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isSaving || isDeleting}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-module-title" className="text-base">
                  Modulname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-module-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Rechtsmethoden Semester 1"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-module-description" className="text-base">
                  Beschreibung <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="edit-module-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Worum geht es in diesem Modul?"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Löschen...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving || isDeleting}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="premium"
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving || isDeleting}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    'Speichern'
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
