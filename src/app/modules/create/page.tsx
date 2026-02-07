'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModules } from '@/hooks/useModules'
import { ModuleWizardStep1 } from '@/components/modules/wizard/ModuleWizardStep1'
import { ModuleWizardStep2 } from '@/components/modules/wizard/ModuleWizardStep2'

interface WizardStep {
  id: number
  title: string
  description: string
}

const steps: WizardStep[] = [
  { id: 1, title: 'Grunddaten', description: 'Name und Beschreibung' },
  { id: 2, title: 'Dokumente', description: 'Skripte hinzufügen' },
]

export interface ModuleFormData {
  title: string
  description: string
  cover_image_url: string
  documentIds: string[]
}

export default function CreateModulePage() {
  const router = useRouter()
  const { createModule } = useModules()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    cover_image_url: '',
    documentIds: [],
  })

  const updateFormData = (data: Partial<ModuleFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.title.trim().length > 0
    }
    return true
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const module = await createModule({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        cover_image_url: formData.cover_image_url || undefined,
      })

      if (!module) {
        throw new Error('Fehler beim Erstellen des Moduls')
      }

      // If documents were selected, add them
      if (formData.documentIds.length > 0) {
        for (const docId of formData.documentIds) {
          await fetch(`/api/modules/${module.id}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: docId }),
          })
        }
      }

      // Navigate to the new module
      router.push(`/modules/${module.id}`)
    } catch (err) {
      console.error('Failed to create module:', err)
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/modules')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Module
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Neues Modul erstellen
          </h1>
          <p className="text-muted-foreground">
            Erstelle ein neues Modul und füge Dokumente hinzu
          </p>
        </header>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors',
                    currentStep > step.id
                      ? 'bg-purple-600 text-white'
                      : currentStep === step.id
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border-2 border-purple-600'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      currentStep >= step.id
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    currentStep > step.id ? 'bg-purple-600' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-card border border-border/50 rounded-xl p-6 mb-6">
          {currentStep === 1 && (
            <ModuleWizardStep1 data={formData} onChange={updateFormData} />
          )}
          {currentStep === 2 && (
            <ModuleWizardStep2 data={formData} onChange={updateFormData} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Erstelle Modul...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Modul erstellen
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
