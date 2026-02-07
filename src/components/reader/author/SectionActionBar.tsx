'use client'

import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Edit3,
  Trash2,
  MoreVertical,
  BookOpen,
  FileText,
  Target,
  ClipboardList,
  Lightbulb,
  MessageCircle,
  AlertCircle,
  FileCheck,
  BookMarked,
  Beaker,
  AlertTriangle,
  PenTool,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Section, SectionType } from '@/lib/supabase/types'

const TYPE_CONFIG: Record<SectionType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  chapter: { label: 'Kapitel', icon: BookOpen, color: 'text-blue-600' },
  subchapter: { label: 'Unterkapitel', icon: FileText, color: 'text-blue-500' },
  learning_objectives: { label: 'Lernziele', icon: Target, color: 'text-purple-600' },
  task: { label: 'Aufgabe', icon: ClipboardList, color: 'text-teal-600' },
  practice_impulse: { label: 'Übungsimpuls', icon: AlertCircle, color: 'text-violet-600' },
  reflection: { label: 'Reflexion', icon: MessageCircle, color: 'text-pink-600' },
  tip: { label: 'Tipp', icon: Lightbulb, color: 'text-amber-500' },
  summary: { label: 'Zusammenfassung', icon: FileCheck, color: 'text-emerald-600' },
  definition: { label: 'Definition', icon: BookMarked, color: 'text-indigo-600' },
  example: { label: 'Beispiel', icon: Beaker, color: 'text-cyan-600' },
  important: { label: 'Wichtig', icon: AlertTriangle, color: 'text-red-600' },
  exercise: { label: 'Übung', icon: PenTool, color: 'text-orange-600' },
  solution: { label: 'Lösung', icon: CheckCircle2, color: 'text-green-600' },
  reference: { label: 'Verweis', icon: ExternalLink, color: 'text-slate-600' },
}

interface SectionActionBarProps {
  section: Section
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onTypeChange: (type: SectionType) => void
  isFirst: boolean
  isLast: boolean
  isReordering: boolean
}

/**
 * Action bar that appears on section hover in Author Mode
 */
export function SectionActionBar({
  section,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTypeChange,
  isFirst,
  isLast,
  isReordering,
}: SectionActionBarProps) {
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  const currentConfig = TYPE_CONFIG[section.section_type]
  const CurrentIcon = currentConfig.icon

  return (
    <div
      className={cn(
        'absolute -top-3 right-4 z-20',
        'flex items-center gap-1 px-2 py-1',
        'bg-background border border-border rounded-lg shadow-lg',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
      )}
    >
      {/* Type selector */}
      <div className="relative">
        <button
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
            'hover:bg-muted transition-colors'
          )}
        >
          <CurrentIcon className={cn('w-4 h-4', currentConfig.color)} />
          <span className="text-foreground hidden sm:inline">{currentConfig.label}</span>
          <MoreVertical className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Type dropdown */}
        {showTypeMenu && (
          <div
            className={cn(
              'absolute top-full right-0 mt-1 z-50',
              'w-48 max-h-64 overflow-auto',
              'bg-background border border-border rounded-lg shadow-xl',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
          >
            {Object.entries(TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon
              const isActive = type === section.section_type
              return (
                <button
                  key={type}
                  onClick={() => {
                    onTypeChange(type as SectionType)
                    setShowTypeMenu(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-muted transition-colors',
                    isActive && 'bg-purple-50 dark:bg-purple-900/20'
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.color)} />
                  <span className={cn(
                    'text-foreground',
                    isActive && 'font-medium'
                  )}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Move buttons */}
      <button
        onClick={onMoveUp}
        disabled={isFirst || isReordering}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="Nach oben"
      >
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast || isReordering}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="Nach unten"
      >
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="w-px h-4 bg-border" />

      {/* Edit button */}
      <button
        onClick={onEdit}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'hover:bg-purple-100 dark:hover:bg-purple-900/30',
          'hover:text-purple-600'
        )}
        title="Bearbeiten"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'hover:bg-red-100 dark:hover:bg-red-900/30',
          'hover:text-red-600'
        )}
        title="Löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Click outside handler for type menu */}
      {showTypeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTypeMenu(false)}
        />
      )}
    </div>
  )
}
