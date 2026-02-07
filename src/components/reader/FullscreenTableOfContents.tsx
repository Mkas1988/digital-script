'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, BookOpen, Target, Lightbulb, ClipboardCheck, HelpCircle, FileText, PenTool, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Section, SectionType, SectionMetadata } from '@/lib/supabase/types'

const sectionTypeIcons: Partial<Record<SectionType, LucideIcon>> = {
  learning_objectives: Target,
  task: ClipboardCheck,
  practice_impulse: Lightbulb,
  reflection: HelpCircle,
  summary: FileText,
  exercise: PenTool,
}

interface FullscreenTableOfContentsProps {
  sections: Section[]
  onSelectSection: (sectionId: string) => void
  onScrollDown?: () => void
}

interface ChapterGroup {
  chapter_number: string
  mainSection: Section | null
  children: Section[]
}

export function FullscreenTableOfContents({
  sections,
  onSelectSection,
  onScrollDown,
}: FullscreenTableOfContentsProps) {
  // Group sections by chapter
  const chapterGroups = useMemo(() => {
    const groups = new Map<string, ChapterGroup>()

    sections.forEach((section) => {
      const metadata = (section.metadata as SectionMetadata) || {}
      const chapterNum = metadata.chapter_number || '0'
      const level = metadata.level || 0

      if (!groups.has(chapterNum)) {
        groups.set(chapterNum, {
          chapter_number: chapterNum,
          mainSection: null,
          children: [],
        })
      }

      const group = groups.get(chapterNum)!

      if (level === 0) {
        group.mainSection = section
      } else {
        group.children.push(section)
      }
    })

    // Sort groups
    const chapterOrder: Record<string, number> = {
      'intro': 0,
      'outro': 100,
      'solutions': 101,
      'appendix': 102,
    }

    return Array.from(groups.values())
      .sort((a, b) => {
        const orderA = chapterOrder[a.chapter_number] ?? (parseInt(a.chapter_number) || 50)
        const orderB = chapterOrder[b.chapter_number] ?? (parseInt(b.chapter_number) || 50)
        return orderA - orderB
      })
      .filter(g => g.mainSection) // Only show groups with main sections
  }, [sections])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative py-12 bg-slate-900 overflow-hidden flex flex-col"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="toc-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#toc-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 lg:p-12 flex-1 max-w-3xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-teal-400" />
            <span className="text-teal-400 text-sm font-medium tracking-wider uppercase">
              Inhaltsverzeichnis
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Kapitelübersicht
          </h2>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-auto max-w-4xl"
        >
          <div className="space-y-4">
            {chapterGroups.map((group, index) => {
              const mainSection = group.mainSection!
              const metadata = (mainSection.metadata as SectionMetadata) || {}
              const isAppendix = group.chapter_number === 'appendix'
              const isIntro = group.chapter_number === 'intro'
              const isOutro = group.chapter_number === 'outro'
              const chapterNumber = isAppendix || isIntro || isOutro ? null : index

              return (
                <motion.div
                  key={group.chapter_number}
                  variants={itemVariants}
                  className="group"
                >
                  <button
                    onClick={() => onSelectSection(mainSection.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl transition-all duration-200',
                      'hover:bg-white/10 active:scale-[0.98]',
                      'border border-white/10 hover:border-teal-500/50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Chapter number */}
                      <div className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                        'bg-teal-500/20 text-teal-400 font-bold text-lg'
                      )}>
                        {chapterNumber !== null ? chapterNumber + 1 : (
                          <BookOpen className="w-5 h-5" />
                        )}
                      </div>

                      {/* Title and metadata */}
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-white group-hover:text-teal-400 transition-colors">
                          {mainSection.title}
                        </h3>
                        {mainSection.page_start && (
                          <p className="text-white/50 text-sm mt-1">
                            Seite {mainSection.page_start}
                            {mainSection.page_end && mainSection.page_end !== mainSection.page_start && ` - ${mainSection.page_end}`}
                          </p>
                        )}

                        {/* Children preview */}
                        {group.children.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.children.slice(0, 4).map((child) => {
                              const childType = child.section_type as SectionType
                              const TypeIcon = sectionTypeIcons[childType]
                              return (
                                <span
                                  key={child.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-white/60 text-xs"
                                >
                                  {TypeIcon && <TypeIcon className="w-3 h-3" />}
                                  {child.title.length > 30 ? child.title.slice(0, 30) + '...' : child.title}
                                </span>
                              )
                            })}
                            {group.children.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 text-white/40 text-xs">
                                +{group.children.length - 4} weitere
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-auto pt-8 pb-4 flex flex-col items-center cursor-pointer"
          onClick={onScrollDown}
        >
          <span className="text-white/50 text-sm mb-2">Zum Inhalt scrollen</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-white/50" />
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative elements - subtle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      {/* Top fade gradient for smooth transition from cover */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none" />

      {/* Bottom fade gradient - subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
    </motion.div>
  )
}
