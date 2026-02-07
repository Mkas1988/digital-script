'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  X,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { slideInRight } from '@/lib/animations'
import type { Section } from '@/lib/supabase/types'
import type { Bookmark as BookmarkType } from '@/hooks/useBookmarks'

interface BookmarkSidebarProps {
  isOpen: boolean
  isSticky?: boolean
  onClose: () => void
  bookmarks: BookmarkType[]
  sections: Section[]
  onBookmarkClick: (bookmark: BookmarkType) => void
  onDeleteBookmark: (id: string) => void | Promise<boolean | void>
  isTabletMode?: boolean
}

interface GroupedBookmarks {
  section: Section
  bookmark: BookmarkType
}

export function BookmarkSidebar({
  isOpen,
  isSticky = false,
  onClose,
  bookmarks,
  sections,
  onBookmarkClick,
  onDeleteBookmark,
  isTabletMode = false,
}: BookmarkSidebarProps) {
  // Map bookmarks to their sections
  const groupedBookmarks = useMemo((): GroupedBookmarks[] => {
    const sectionMap = new Map(sections.map((s) => [s.id, s]))

    return bookmarks
      .map((bookmark) => {
        const section = sectionMap.get(bookmark.section_id)
        if (!section) return null
        return { section, bookmark }
      })
      .filter((item): item is GroupedBookmarks => item !== null)
      .sort((a, b) => a.section.order_index - b.section.order_index)
  }, [bookmarks, sections])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Sidebar content
  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">Lesezeichen</h3>
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        </div>
        {!isSticky && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Bookmarks list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {groupedBookmarks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Keine Lesezeichen vorhanden</p>
              <p className="text-xs mt-1 opacity-70">
                Klicke auf das Lesezeichen-Symbol bei einer Sektion
              </p>
            </div>
          ) : (
            groupedBookmarks.map(({ section, bookmark }) => {
              const metadata = (section.metadata as { chapter_number?: string; level?: number }) || {}

              return (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'group p-3 rounded-lg cursor-pointer transition-colors',
                    'bg-slate-50 dark:bg-slate-800/50',
                    'hover:bg-amber-50 dark:hover:bg-amber-900/20',
                    'border border-transparent hover:border-amber-200 dark:hover:border-amber-800'
                  )}
                  onClick={() => onBookmarkClick(bookmark)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Bookmark className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {metadata.chapter_number && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Kapitel {metadata.chapter_number}
                        </span>
                      )}
                      <p className="font-medium text-sm line-clamp-2 mt-0.5">
                        {section.title}
                      </p>
                      {bookmark.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {bookmark.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(bookmark.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteBookmark(bookmark.id)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )

  // Sticky mode (desktop right sidebar)
  if (isSticky) {
    return <div className="h-full">{content}</div>
  }

  // Overlay mode (mobile/tablet)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-full max-w-sm',
              'bg-background border-l shadow-xl'
            )}
          >
            {content}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
