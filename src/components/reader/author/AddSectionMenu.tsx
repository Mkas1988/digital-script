'use client'

import { useState, useRef, useEffect } from 'react'
import {
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
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionType } from '@/lib/supabase/types'

interface SectionTypeConfig {
  type: SectionType
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

const SECTION_GROUPS: { title: string; types: SectionTypeConfig[] }[] = [
  {
    title: 'Struktur',
    types: [
      {
        type: 'chapter',
        label: 'Kapitel',
        icon: BookOpen,
        color: 'text-blue-600',
        description: 'Hauptkapitel',
      },
      {
        type: 'subchapter',
        label: 'Unterkapitel',
        icon: FileText,
        color: 'text-blue-500',
        description: 'Unterabschnitt',
      },
    ],
  },
  {
    title: 'Inhalt',
    types: [
      {
        type: 'summary',
        label: 'Zusammenfassung',
        icon: FileCheck,
        color: 'text-emerald-600',
        description: 'Kernpunkte zusammenfassen',
      },
      {
        type: 'tip',
        label: 'Tipp',
        icon: Lightbulb,
        color: 'text-amber-500',
        description: 'Hinweis oder Tipp',
      },
      {
        type: 'important',
        label: 'Wichtig',
        icon: AlertTriangle,
        color: 'text-red-600',
        description: 'Wichtiger Hinweis',
      },
      {
        type: 'definition',
        label: 'Definition',
        icon: BookMarked,
        color: 'text-indigo-600',
        description: 'Begriffsdefinition',
      },
      {
        type: 'example',
        label: 'Beispiel',
        icon: Beaker,
        color: 'text-cyan-600',
        description: 'Praxisbeispiel',
      },
    ],
  },
  {
    title: 'Lernen',
    types: [
      {
        type: 'learning_objectives',
        label: 'Lernziele',
        icon: Target,
        color: 'text-purple-600',
        description: 'Was gelernt werden soll',
      },
      {
        type: 'exercise',
        label: 'Aufgabe',
        icon: PenTool,
        color: 'text-orange-600',
        description: 'Übungsaufgabe',
      },
      {
        type: 'solution',
        label: 'Lösung',
        icon: CheckCircle2,
        color: 'text-green-600',
        description: 'Lösung zu Aufgabe',
      },
      {
        type: 'reflection',
        label: 'Reflexion',
        icon: MessageCircle,
        color: 'text-pink-600',
        description: 'Reflexionsfrage',
      },
      {
        type: 'practice_impulse',
        label: 'Übungsimpuls',
        icon: AlertCircle,
        color: 'text-violet-600',
        description: 'Praktischer Impuls',
      },
      {
        type: 'task',
        label: 'Arbeitsauftrag',
        icon: ClipboardList,
        color: 'text-teal-600',
        description: 'Konkrete Aufgabe',
      },
    ],
  },
  {
    title: 'Sonstiges',
    types: [
      {
        type: 'reference',
        label: 'Literaturverweis',
        icon: ExternalLink,
        color: 'text-slate-600',
        description: 'Quellenangabe',
      },
    ],
  },
]

interface AddSectionMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: SectionType, title: string) => void
  isCreating: boolean
}

/**
 * Dropdown menu for selecting a section type when adding new content
 */
export function AddSectionMenu({
  isOpen,
  onClose,
  onSelect,
  isCreating,
}: AddSectionMenuProps) {
  const [selectedType, setSelectedType] = useState<SectionType | null>(null)
  const [title, setTitle] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Focus input when type is selected
  useEffect(() => {
    if (selectedType && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedType])

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
      setTitle('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTypeSelect = (type: SectionType) => {
    setSelectedType(type)
  }

  const handleCreate = () => {
    if (selectedType && title.trim()) {
      onSelect(selectedType, title.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedType && title.trim()) {
      handleCreate()
    }
    if (e.key === 'Escape') {
      if (selectedType) {
        setSelectedType(null)
        setTitle('')
      } else {
        onClose()
      }
    }
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-50 left-1/2 -translate-x-1/2 mt-2',
        'w-80 max-h-[70vh] overflow-auto',
        'bg-background border border-border rounded-xl shadow-xl',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-foreground">
          {selectedType ? 'Titel eingeben' : 'Element hinzufügen'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      {selectedType ? (
        // Title input
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const config = SECTION_GROUPS
                .flatMap(g => g.types)
                .find(t => t.type === selectedType)
              if (!config) return null
              const Icon = config.icon
              return (
                <>
                  <Icon className={cn('w-5 h-5', config.color)} />
                  <span className="font-medium text-foreground">{config.label}</span>
                </>
              )
            })()}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titel eingeben..."
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-muted border border-input',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-purple-500'
            )}
            disabled={isCreating}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setSelectedType(null)
                setTitle('')
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              disabled={isCreating}
            >
              Zurück
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || isCreating}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium',
                'bg-purple-600 text-white',
                'hover:bg-purple-700 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Erstelle...
                </>
              ) : (
                'Erstellen'
              )}
            </button>
          </div>
        </div>
      ) : (
        // Type selection
        <div className="p-2">
          {SECTION_GROUPS.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <div className="my-2 border-t border-border/50" />}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.types.map((config) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={config.type}
                      onClick={() => handleTypeSelect(config.type)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                        'text-left transition-colors',
                        'hover:bg-muted'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 shrink-0', config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">
                          {config.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
