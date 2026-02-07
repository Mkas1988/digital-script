'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Brain,
  Cloud,
  FileSearch,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { LinearProgress } from '@/components/ui/circular-progress'
import { toast } from 'sonner'
import { scaleIn, fadeInUp } from '@/lib/animations'

interface UploadStep {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed'
}

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  // Lazy initialize supabase client only on client side
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  const uploadSteps: UploadStep[] = [
    {
      id: 'upload',
      label: 'Hochladen',
      icon: <Cloud className="w-4 h-4" />,
      status: currentStep > 0 ? 'completed' : currentStep === 0 && isUploading ? 'active' : 'pending',
    },
    {
      id: 'process',
      label: 'Verarbeiten',
      icon: <FileSearch className="w-4 h-4" />,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      id: 'extract',
      label: 'Extrahieren',
      icon: <FileText className="w-4 h-4" />,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
    },
    {
      id: 'ai',
      label: 'KI-Analyse',
      icon: <Brain className="w-4 h-4" />,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
    },
  ]

  const handleUpload = async (file: File) => {
    if (!supabase) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Bitte nur PDF-Dateien hochladen')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß (max. 50MB)')
      return
    }

    setIsUploading(true)
    setUploadProgress(10)
    setCurrentStep(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Nicht angemeldet')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      setUploadProgress(30)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      setUploadProgress(50)
      setCurrentStep(1)

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name.replace('.pdf', '').replace(/_/g, ' '),
          original_filename: file.name,
          storage_path: fileName,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUploadProgress(70)
      setCurrentStep(2)

      // Parse PDF and extract text
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id, storagePath: fileName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler beim Verarbeiten der PDF')
      }

      setUploadProgress(90)
      setCurrentStep(3)

      // Small delay to show AI step
      await new Promise(resolve => setTimeout(resolve, 500))

      setUploadProgress(100)
      setCurrentStep(4)

      toast.success('Skript erfolgreich hochgeladen!')
      router.refresh()

      // Navigate to the document
      setTimeout(() => {
        router.push(`/documents/${document.id}`)
      }, 800)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hochladen')
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentStep(0)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
    >
      <GlassCard
        variant={isDragging ? 'elevated' : 'default'}
        className={`relative overflow-hidden transition-all duration-300 ${
          isDragging ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-background' : ''
        } ${isUploading ? 'pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.02]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          {isDragging && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 px-6">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-md space-y-8"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentStep === 4 ? (
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    ) : (
                      <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
                    )}
                  </motion.div>
                </div>

                {/* Progress steps */}
                <div className="flex justify-between items-center">
                  {uploadSteps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                      <motion.div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          step.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : step.status === 'active'
                            ? 'bg-brand-500/20 text-brand-400'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                        animate={step.status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: step.status === 'active' ? Infinity : 0 }}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.status === 'active' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          step.icon
                        )}
                      </motion.div>
                      <span className={`text-xs font-medium ${
                        step.status === 'completed'
                          ? 'text-green-500'
                          : step.status === 'active'
                          ? 'text-brand-400'
                          : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                      {index < uploadSteps.length - 1 && (
                        <div className="absolute" style={{ left: `${(index + 0.5) * 25}%`, top: '50%' }}>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <LinearProgress
                    value={uploadProgress}
                    size="md"
                    showValue
                    className="text-brand-400"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col items-center"
              >
                {/* Upload Icon */}
                <motion.div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    isDragging
                      ? 'bg-brand-500/20'
                      : 'bg-gradient-to-br from-brand-500/10 to-brand-600/10'
                  }`}
                  animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Upload className={`w-10 h-10 transition-colors ${
                    isDragging ? 'text-brand-400' : 'text-brand-500/70'
                  }`} />
                </motion.div>

                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  PDF hochladen
                </h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Ziehe eine PDF-Datei hierher oder wähle eine Datei aus
                </p>

                {/* Feature badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    KI-Strukturierung
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium">
                    <FileText className="w-3 h-3" />
                    Automatische Kapitel
                  </span>
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <Button variant="premium" size="lg" asChild>
                    <span className="gap-2">
                      <Upload className="w-4 h-4" />
                      Datei auswählen
                    </span>
                  </Button>
                </label>

                <p className="text-xs text-muted-foreground mt-4">
                  PDF bis zu 50MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gradient border effect on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 rounded-xl border-2 border-brand-500/50 animate-pulse" />
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
