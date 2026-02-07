'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { scaleIn } from '@/lib/animations'
import type { Section } from '@/lib/supabase/types'

interface SearchResult {
  sectionId: string
  sectionTitle: string
  sectionIndex: number
  text: string
  matchStart: number
  matchEnd: number
}

interface DocumentSearchProps {
  sections: Section[]
  isOpen: boolean
  onClose: () => void
  onNavigate: (sectionId: string) => void
}

/**
 * Full-text search component for document content
 */
export function DocumentSearch({
  sections,
  isOpen,
  onClose,
  onNavigate,
}: DocumentSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Search through all sections
  const results = useMemo((): SearchResult[] => {
    if (!query || query.length < 2) return []

    const searchResults: SearchResult[] = []
    const lowerQuery = query.toLowerCase()
    const contextLength = 80 // Characters around the match

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const content = section.content.toLowerCase()
      let searchIndex = 0

      // Find all matches in this section
      while (searchIndex < content.length) {
        const matchIndex = content.indexOf(lowerQuery, searchIndex)
        if (matchIndex === -1) break

        // Get context around the match
        const contextStart = Math.max(0, matchIndex - contextLength)
        const contextEnd = Math.min(
          section.content.length,
          matchIndex + query.length + contextLength
        )

        let text = section.content.slice(contextStart, contextEnd)
        if (contextStart > 0) text = '...' + text
        if (contextEnd < section.content.length) text = text + '...'

        searchResults.push({
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIndex: i,
          text,
          matchStart: matchIndex - contextStart + (contextStart > 0 ? 3 : 0),
          matchEnd:
            matchIndex - contextStart + query.length + (contextStart > 0 ? 3 : 0),
        })

        searchIndex = matchIndex + query.length

        // Limit results per section
        if (searchResults.filter((r) => r.sectionId === section.id).length >= 3) {
          break
        }
      }
    }

    return searchResults.slice(0, 20) // Limit total results
  }, [sections, query])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        const result = results[selectedIndex]
        if (result) {
          onNavigate(result.sectionId)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIndex, onNavigate, onClose]
  )

  // Handle clicking a result
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onNavigate(result.sectionId)
      onClose()
    },
    [onNavigate, onClose]
  )

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'fixed top-[15%] left-1/2 -translate-x-1/2 z-50',
              'w-full max-w-xl',
              'bg-white dark:bg-gray-900',
              'rounded-2xl shadow-2xl',
              'border border-gray-200/50 dark:border-gray-700/50',
              'overflow-hidden'
            )}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="relative flex items-center gap-2">
                <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Im Dokument suchen... (mind. 2 Zeichen)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 h-12 text-base"
                  autoComplete="off"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 h-8 w-8"
                    onClick={handleClear}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {results.length > 0
                    ? `${results.length} Treffer gefunden`
                    : query.length >= 2
                    ? 'Keine Treffer'
                    : 'Tippe zum Suchen...'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
                  <span>navigieren</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] ml-2">↵</kbd>
                  <span>öffnen</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] ml-2">esc</kbd>
                  <span>schließen</span>
                </span>
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="max-h-[50vh]">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.sectionId}-${result.matchStart}`}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors',
                        'flex items-start gap-3',
                        index === selectedIndex
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {result.sectionIndex + 1}.
                          </span>
                          <span className="text-sm font-medium truncate">
                            {result.sectionTitle}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {result.text.slice(0, result.matchStart)}
                          <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground px-0.5 rounded">
                            {result.text.slice(result.matchStart, result.matchEnd)}
                          </mark>
                          {result.text.slice(result.matchEnd)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
                    </button>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine Treffer für "{query}"</p>
                  <p className="text-xs mt-1">Versuche andere Suchbegriffe</p>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Durchsuche das gesamte Dokument</p>
                  <p className="text-xs mt-1">Gib mindestens 2 Zeichen ein</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
