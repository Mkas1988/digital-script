'use client'

import { Folder, Users, FileText, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Module, ModuleRole } from '@/lib/supabase/types'

interface ModuleWithRole extends Module {
  role: ModuleRole
}

interface ModuleCardProps {
  module: ModuleWithRole
  onClick?: () => void
  className?: string
}

const roleLabels: Record<ModuleRole, string> = {
  owner: 'Eigentümer',
  editor: 'Bearbeiter',
  viewer: 'Leser',
}

const roleColors: Record<ModuleRole, string> = {
  owner: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
  editor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  viewer: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50',
}

export function ModuleCard({ module, onClick, className }: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left w-full',
        'p-6 rounded-xl',
        'bg-card border border-border/50',
        'hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center shrink-0">
          <Folder className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex items-center gap-2">
          {/* Published Status */}
          {module.is_published ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Globe className="w-3 h-3" />
              <span className="text-xs font-medium">Veröffentlicht</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <Lock className="w-3 h-3" />
              <span className="text-xs font-medium">Entwurf</span>
            </div>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
          {module.title}
        </h3>
        {module.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {module.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        {/* Role Badge */}
        <span className={cn('text-xs font-medium px-2 py-1 rounded-md', roleColors[module.role])}>
          {roleLabels[module.role]}
        </span>

        {/* Updated Date */}
        <span className="text-xs text-muted-foreground">
          {new Date(module.updated_at).toLocaleDateString('de-DE', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </button>
  )
}
