'use client'

import { cn } from '@/lib/utils'
import type { ModuleFormData } from '@/app/modules/create/page'

interface ModuleWizardStep1Props {
  data: ModuleFormData
  onChange: (data: Partial<ModuleFormData>) => void
}

export function ModuleWizardStep1({ data, onChange }: ModuleWizardStep1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Grunddaten
        </h2>
        <p className="text-sm text-muted-foreground">
          Gib deinem Modul einen Namen und eine Beschreibung
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Titel <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="z.B. Modul 1: Einführung in die Rechtswissenschaft"
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-background border border-input',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          )}
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Beschreibung
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Kurze Beschreibung des Moduls und der Lernziele..."
          rows={4}
          className={cn(
            'w-full px-4 py-3 rounded-lg resize-none',
            'bg-background border border-input',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          )}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Hilft Teammitgliedern den Inhalt zu verstehen.
        </p>
      </div>

      {/* Cover Image URL */}
      <div>
        <label
          htmlFor="cover"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Cover-Bild URL
        </label>
        <input
          id="cover"
          type="url"
          value={data.cover_image_url}
          onChange={(e) => onChange({ cover_image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-background border border-input',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          )}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Wird als Vorschaubild angezeigt.
        </p>
      </div>
    </div>
  )
}
