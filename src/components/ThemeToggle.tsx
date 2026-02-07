'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <span className="sr-only">Theme wechseln</span>
        <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 relative overflow-hidden"
        >
          <span className="sr-only">Theme wechseln</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={resolvedTheme}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-brand-400" />
              ) : (
                <Sun className="w-4 h-4 text-brand-500" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer gap-2"
        >
          <Sun className="w-4 h-4" />
          <span>Hell</span>
          {theme === 'light' && (
            <span className="ml-auto text-brand-400">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer gap-2"
        >
          <Moon className="w-4 h-4" />
          <span>Dunkel</span>
          {theme === 'dark' && (
            <span className="ml-auto text-brand-400">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer gap-2"
        >
          <Monitor className="w-4 h-4" />
          <span>System</span>
          {theme === 'system' && (
            <span className="ml-auto text-brand-400">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for inline use
export function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-muted/50 border border-border/50 transition-colors hover:bg-muted"
      aria-label="Theme wechseln"
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg flex items-center justify-center"
        animate={{ x: resolvedTheme === 'dark' ? 28 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </motion.div>
    </button>
  )
}
