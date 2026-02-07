'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderPlus,
  Loader2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CreateModuleDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateModuleDialog({ isOpen, onClose }: CreateModuleDialogProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTitle('')
        setDescription('')
        setIsCreating(false)
      }, 300)
    }
  }, [isOpen])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Bitte geben Sie einen Titel ein')
      return
    }

    setIsCreating(true)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error('Bitte melden Sie sich erneut an')
        return
      }

      const { error } = await supabase.from('modules').insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        is_published: false,
        sequence_order: 0,
      }).select().single()

      if (error) {
        throw error
      }

      toast.success('Modul erfolgreich erstellt!')
      onClose()
      router.refresh()

    } catch (error: any) {
      console.error('Create error:', error)
      toast.error(`Fehler: ${error?.message || 'Unbekannter Fehler'}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

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
                  <FolderPlus className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Neues Modul
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Organisieren Sie Ihre Skripte
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isCreating}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="module-title" className="text-base">
                  Modulname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="module-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Rechtsmethoden Semester 1"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-description" className="text-base">
                  Beschreibung <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="module-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Worum geht es in diesem Modul?"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Abbrechen
              </Button>
              <Button
                variant="premium"
                onClick={handleCreate}
                disabled={!title.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Modul erstellen
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
