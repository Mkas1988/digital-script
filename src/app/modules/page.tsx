'use client'

import { useRouter } from 'next/navigation'
import { Folder, Plus, Users, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { useModules } from '@/hooks/useModules'

export default function ModulesPage() {
  const router = useRouter()
  const { modules, isLoading, error } = useModules()

  const moduleCount = modules.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Meine Module
                  </h1>
                  <p className="text-muted-foreground">
                    Organisiere deine Kurse und Lerneinheiten
                  </p>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex gap-3">
              {moduleCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">
                    <span className="font-semibold text-foreground">{moduleCount}</span>
                    <span className="text-muted-foreground ml-1">
                      {moduleCount === 1 ? 'Modul' : 'Module'}
                    </span>
                  </span>
                </div>
              )}
              <Button
                onClick={() => router.push('/modules/create')}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Neues Modul
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && modules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="w-20 h-20 rounded-3xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                <Folder className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Noch keine Module
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Erstelle dein erstes Modul, um Skripte zu organisieren und
                Lerneinheiten zu strukturieren.
              </p>
              <Button
                onClick={() => router.push('/modules/create')}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Erstes Modul erstellen
              </Button>
            </div>
          )}

          {/* Modules Grid */}
          {!isLoading && !error && modules.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Alle Module
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => router.push(`/modules/${module.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
