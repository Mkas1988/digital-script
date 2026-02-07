'use client'

import { useMemo } from 'react'
import {
  BookOpen,
  FileText,
  Target,
  ClipboardList,
  Lightbulb,
  MessageSquare,
  Info,
  FileCheck,
  BookMarked,
  FlaskConical,
  AlertTriangle,
  Dumbbell,
  CheckCircle,
  Link,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionType } from '@/lib/supabase/types'
import { sectionTypeLabels, sectionTypeGroups } from '@/hooks/useEditSection'

interface SectionTypeSelectorProps {
  value: SectionType
  onChange: (type: SectionType) => void
  disabled?: boolean
  className?: string
}

// Icon mapping for section types
const sectionTypeIcons: Record<SectionType, typeof BookOpen> = {
  chapter: BookOpen,
  subchapter: FileText,
  learning_objectives: Target,
  task: ClipboardList,
  practice_impulse: Lightbulb,
  reflection: MessageSquare,
  tip: Info,
  summary: FileCheck,
  definition: BookMarked,
  example: FlaskConical,
  important: AlertTriangle,
  exercise: Dumbbell,
  solution: CheckCircle,
  reference: Link,
}

// Color mapping for section types
const sectionTypeColors: Record<SectionType, string> = {
  chapter: 'text-slate-600 dark:text-slate-400',
  subchapter: 'text-slate-500 dark:text-slate-400',
  learning_objectives: 'text-purple-600 dark:text-purple-400',
  task: 'text-blue-600 dark:text-blue-400',
  practice_impulse: 'text-cyan-600 dark:text-cyan-400',
  reflection: 'text-indigo-600 dark:text-indigo-400',
  tip: 'text-amber-600 dark:text-amber-400',
  summary: 'text-green-600 dark:text-green-400',
  definition: 'text-teal-600 dark:text-teal-400',
  example: 'text-orange-600 dark:text-orange-400',
  important: 'text-red-600 dark:text-red-400',
  exercise: 'text-emerald-600 dark:text-emerald-400',
  solution: 'text-lime-600 dark:text-lime-400',
  reference: 'text-gray-600 dark:text-gray-400',
}

// Group labels
const groupLabels: Record<keyof typeof sectionTypeGroups, string> = {
  structure: 'Struktur',
  content: 'Inhalt',
  interactive: 'Interaktiv',
  emphasis: 'Hervorhebung',
}

/**
 * Dropdown selector for section types with icons and grouping
 */
export function SectionTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: SectionTypeSelectorProps) {
  // Build options grouped by category
  const groupedOptions = useMemo(() => {
    return Object.entries(sectionTypeGroups).map(([groupKey, types]) => ({
      key: groupKey as keyof typeof sectionTypeGroups,
      label: groupLabels[groupKey as keyof typeof sectionTypeGroups],
      types: types.map(type => ({
        type,
        label: sectionTypeLabels[type],
        Icon: sectionTypeIcons[type],
        color: sectionTypeColors[type],
      })),
    }))
  }, [])

  const selectedOption = useMemo(() => ({
    type: value,
    label: sectionTypeLabels[value],
    Icon: sectionTypeIcons[value],
    color: sectionTypeColors[value],
  }), [value])

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SectionType)}
        disabled={disabled}
        className={cn(
          'w-full appearance-none cursor-pointer',
          'px-3 py-2 pr-10',
          'bg-background border border-input rounded-lg',
          'text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          selectedOption.color
        )}
        style={{ paddingLeft: '2.5rem' }}
      >
        {groupedOptions.map(group => (
          <optgroup key={group.key} label={group.label}>
            {group.types.map(option => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Icon overlay */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <selectedOption.Icon className={cn('w-4 h-4', selectedOption.color)} />
      </div>

      {/* Dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
