'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Menu,
  FileText,
  Home,
  BookOpen,
  User,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TabletSidebar } from './TabletSidebar'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  userEmail?: string
  onLogout: () => void
}

export function MobileNav({ userEmail, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      href: '/documents',
      label: 'Meine Skripte',
      icon: FileText,
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
    },
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <>
      {/* Hamburger Button - nur auf Mobile sichtbar */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-10 w-10"
        onClick={() => setIsOpen(true)}
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Sidebar */}
      <TabletSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="left"
        width={280}
        header={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">FOM Hochschule</span>
          </div>
        }
      >
        <nav className="flex flex-col h-full">
          {/* Main Navigation */}
          <div className="flex-1 py-4">
            <div className="px-3 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Navigation
              </p>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
                    'touch-list-item',
                    active
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-border/50 py-4">
            <div className="px-3 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account
              </p>
            </div>

            {userEmail && (
              <div className="px-4 py-2 mx-2">
                <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
              </div>
            )}

            <button
              onClick={() => {
                setIsOpen(false)
                onLogout()
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors w-full',
                'touch-list-item',
                'text-destructive hover:bg-destructive/10'
              )}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Abmelden</span>
            </button>
          </div>
        </nav>
      </TabletSidebar>
    </>
  )
}
