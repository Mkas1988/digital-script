'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Highlighter,
  StickyNote,
  Bookmark,
  Layers,
  TrendingUp,
  CheckCircle2,
  Clock,
  Flame,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/hooks/useDashboardStats'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: typeof BookOpen
  color: string
  bgColor: string
  delay?: number
}

function StatCard({ title, value, subtitle, icon: Icon, color, bgColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4',
        'bg-background hover:shadow-md transition-shadow',
        bgColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </div>
    </motion.div>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
}

function ProgressRing({ progress, size = 80, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-brand-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{progress}%</span>
      </div>
    </div>
  )
}

/**
 * Learning Dashboard component showing statistics and progress
 */
export function LearningDashboard() {
  const stats = useDashboardStats()

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (stats.error) {
    return null // Silently fail
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Main Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-gradient-to-br from-brand-500/5 via-background to-background p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ProgressRing progress={stats.progress.progressPercent} size={100} strokeWidth={10} />

          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" />
              Lernfortschritt
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.progress.completedSections} von {stats.progress.totalSections} Abschnitte gelesen
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress.progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.documents.completed}
              </div>
              <div className="text-xs text-muted-foreground">Fertig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.documents.inProgress}
              </div>
              <div className="text-xs text-muted-foreground">In Arbeit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.documents.total}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Markierungen"
          value={stats.annotations.highlights}
          icon={Highlighter}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-50 dark:bg-yellow-950/30"
          delay={0.1}
        />
        <StatCard
          title="Notizen"
          value={stats.annotations.notes}
          icon={StickyNote}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
          delay={0.2}
        />
        <StatCard
          title="Lesezeichen"
          value={stats.annotations.bookmarks}
          icon={Bookmark}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-50 dark:bg-amber-950/30"
          delay={0.3}
        />
        <StatCard
          title="Lernkarten"
          value={stats.flashcards.total}
          subtitle={stats.flashcards.dueToday > 0 ? `${stats.flashcards.dueToday} fällig` : undefined}
          icon={Layers}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-50 dark:bg-purple-950/30"
          delay={0.4}
        />
      </div>

      {/* Flashcard Stats Row */}
      {stats.flashcards.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm">
              <span className="font-semibold">{stats.flashcards.mastered}</span>
              <span className="text-muted-foreground ml-1">gemeistert</span>
            </span>
          </div>
          {stats.flashcards.dueToday > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm">
                <span className="font-semibold">{stats.flashcards.dueToday}</span>
                <span className="text-muted-foreground ml-1">heute fällig</span>
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
