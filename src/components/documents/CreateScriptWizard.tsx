'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  FolderOpen,
  PenLine,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Module {
  id: string
  title: string
  description: string | null
}

interface CreateScriptWizardProps {
  isOpen: boolean
  onClose: () => void
  modules?: Module[]
}

type SectionType = 'chapter' | 'learning_objectives' | 'summary' | 'task'

const SECTION_TYPE_OPTIONS: { value: SectionType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'chapter',
    label: 'Kapitel',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Standard-Kapitelstruktur',
  },
  {
    value: 'learning_objectives',
    label: 'Lernziele',
    icon: <Target className="w-5 h-5" />,
    description: 'Beginne mit Lernzielen',
  },
  {
    value: 'summary',
    label: 'Zusammenfassung',
    icon: <FileText className="w-5 h-5" />,
    description: 'Starte mit einer Übersicht',
  },
  {
    value: 'task',
    label: 'Aufgabe',
    icon: <PenLine className="w-5 h-5" />,
    description: 'Aufgabenbasiertes Skript',
  },
]

const WIZARD_STEPS = [
  { id: 'basics', title: 'Grunddaten', description: 'Titel und Beschreibung' },
  { id: 'structure', title: 'Struktur', description: 'Erstes Element wählen' },
  { id: 'module', title: 'Modul', description: 'Optional zuordnen' },
]

export function CreateScriptWizard({ isOpen, onClose, modules = [] }: CreateScriptWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sectionType, setSectionType] = useState<SectionType>('chapter')
  const [sectionTitle, setSectionTitle] = useState('Kapitel 1')
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep(0)
        setTitle('')
        setDescription('')
        setSectionType('chapter')
        setSectionTitle('Kapitel 1')
        setSelectedModuleId(null)
        setIsCreating(false)
      }, 300)
    }
  }, [isOpen])

  // Update section title when section type changes
  useEffect(() => {
    const defaults: Record<SectionType, string> = {
      chapter: 'Kapitel 1',
      learning_objectives: 'Lernziele',
      summary: 'Zusammenfassung',
      task: 'Aufgabe 1',
    }
    setSectionTitle(defaults[sectionType])
  }, [sectionType])

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return title.trim().length > 0
      case 1:
        return sectionTitle.trim().length > 0
      case 2:
        return true // Module is optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreate = async () => {
    if (!canProceed()) return

    setIsCreating(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Bitte melden Sie sich erneut an')
        return
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          module_id: selectedModuleId || undefined,
          initial_section_type: sectionType,
          initial_section_title: sectionTitle.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen')
      }

      toast.success('Skript erfolgreich erstellt!')
      onClose()
      router.push(`/documents/${data.document.id}`)
      router.refresh()

    } catch (error) {
      console.error('Create error:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen')
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
          className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xl lg:max-w-2xl"
        >
          <GlassCard variant="elevated" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Neues Skript erstellen
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {WIZARD_STEPS[currentStep].description}
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

            {/* Progress indicator */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                {WIZARD_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center',
                      index < WIZARD_STEPS.length - 1 && 'flex-1'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                          index < currentStep
                            ? 'bg-brand-500 text-white'
                            : index === currentStep
                            ? 'bg-brand-500/20 text-brand-400 ring-2 ring-brand-500'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium hidden sm:block',
                          index === currentStep
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-4',
                          index < currentStep
                            ? 'bg-brand-500'
                            : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 min-h-[280px] sm:min-h-[320px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Basics */}
                {currentStep === 0 && (
                  <motion.div
                    key="basics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base">
                        Titel <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="z.B. Einführung in die Rechtsmethoden"
                        className="text-lg"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Der Titel wird als Überschrift für Ihr Skript angezeigt
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base">
                        Beschreibung <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Worum geht es in diesem Skript?"
                        rows={4}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Structure */}
                {currentStep === 1 && (
                  <motion.div
                    key="structure"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-base">
                        Womit möchten Sie beginnen?
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SECTION_TYPE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSectionType(option.value)}
                            className={cn(
                              'p-4 rounded-xl border-2 text-left transition-all',
                              sectionType === option.value
                                ? 'border-brand-500 bg-brand-500/10'
                                : 'border-border/50 hover:border-brand-500/50 hover:bg-muted/50'
                            )}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center',
                                  sectionType === option.value
                                    ? 'bg-brand-500/20 text-brand-400'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {option.icon}
                              </div>
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sectionTitle" className="text-base">
                        Titel des ersten Elements
                      </Label>
                      <Input
                        id="sectionTitle"
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        placeholder="z.B. Kapitel 1: Einführung"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Module */}
                {currentStep === 2 && (
                  <motion.div
                    key="module"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label className="text-base">
                        Modul zuordnen <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ordnen Sie das Skript einem Modul zu, um es später leichter zu finden
                      </p>

                      {modules.length > 0 ? (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedModuleId(null)}
                            className={cn(
                              'w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3',
                              selectedModuleId === null
                                ? 'border-brand-500 bg-brand-500/10'
                                : 'border-border/50 hover:border-brand-500/50'
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="font-medium">Kein Modul</span>
                              <p className="text-xs text-muted-foreground">
                                Das Skript wird ohne Modulzuordnung erstellt
                              </p>
                            </div>
                          </button>

                          {modules.map((module) => (
                            <button
                              key={module.id}
                              type="button"
                              onClick={() => setSelectedModuleId(module.id)}
                              className={cn(
                                'w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3',
                                selectedModuleId === module.id
                                  ? 'border-brand-500 bg-brand-500/10'
                                  : 'border-border/50 hover:border-brand-500/50'
                              )}
                            >
                              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-brand-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium block truncate">
                                  {module.title}
                                </span>
                                {module.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {module.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-lg bg-muted/50 text-center">
                          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Noch keine Module vorhanden
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sie können später ein Modul erstellen und Skripte zuordnen
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-brand-400" />
                        <span className="text-sm font-medium text-brand-400">
                          Zusammenfassung
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Titel:</span>{' '}
                          <span className="font-medium">{title || '–'}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Erstes Element:</span>{' '}
                          <span className="font-medium">
                            {SECTION_TYPE_OPTIONS.find(o => o.value === sectionType)?.label} – {sectionTitle}
                          </span>
                        </p>
                        {selectedModuleId && (
                          <p>
                            <span className="text-muted-foreground">Modul:</span>{' '}
                            <span className="font-medium">
                              {modules.find(m => m.id === selectedModuleId)?.title}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || isCreating}
                className="order-last sm:order-first"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isCreating}
                  className="w-full sm:w-auto"
                >
                  Abbrechen
                </Button>

                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button
                    variant="premium"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="w-full sm:w-auto"
                  >
                    Weiter
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="premium"
                    onClick={handleCreate}
                    disabled={!canProceed() || isCreating}
                    className="w-full sm:w-auto"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Erstellen...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Skript erstellen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
