'use client'

import { useState, useEffect } from 'react'
import { LearningDashboard } from './LearningDashboard'

/**
 * Client component wrapper for the dashboard section
 * Used in server components like the documents page
 * Uses mounted check to prevent hydration mismatch
 */
export function DashboardSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show skeleton during SSR and initial hydration
  if (!mounted) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          Dein Lernfortschritt
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        Dein Lernfortschritt
      </h2>
      <LearningDashboard />
    </section>
  )
}
