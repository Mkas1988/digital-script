'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentCoverProps {
  title: string
  subtitle?: string
  author?: {
    name: string
    title?: string
    bio?: string
    imageUrl?: string
    quote?: string
  }
  institution?: string
  className?: string
  onScrollDown?: () => void
}

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

export function DocumentCover({
  title,
  subtitle,
  author,
  institution = 'FOM Hochschule',
  className,
  onScrollDown,
}: DocumentCoverProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'relative min-h-[70vh] bg-gradient-to-br from-teal-600 to-teal-700 overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 lg:p-12 max-w-3xl mx-auto w-full">
        {/* Institution */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <span className="text-white/80 text-sm font-medium tracking-wider uppercase">
            {institution}
          </span>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-auto"
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-white/90 font-light">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Author Section with Photo and Quote */}
        {author && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="my-6 flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            {/* Author Photo - always visible with fallback */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl bg-white/20 backdrop-blur-sm">
                {author.imageUrl && !imageError ? (
                  <Image
                    src={author.imageUrl}
                    alt={author.name}
                    width={144}
                    height={144}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-300/50 to-teal-600/50">
                    <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold">
                      {getInitials(author.name)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quote and Author Details */}
            <div className="flex-1">
              {/* Quote */}
              {author.quote && (
                <div className="mb-4">
                  <div className="text-white/20 text-[40px] md:text-[50px] font-serif leading-none -mb-4 -ml-1">
                    "
                  </div>
                  <blockquote className="text-sm md:text-base lg:text-lg text-white/90 font-medium leading-relaxed italic">
                    {author.quote}
                  </blockquote>
                </div>
              )}

              {/* Author Details */}
              <div className="pt-3 border-t border-white/20">
                <h3 className="text-base md:text-lg font-semibold text-white">
                  {author.name}
                </h3>
                {author.title && (
                  <p className="text-white/70 text-xs md:text-sm mt-0.5">
                    {author.title}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Bottom fade gradient for smooth transition to TOC */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-auto pt-8 pb-4 flex flex-col items-center cursor-pointer"
          onClick={onScrollDown}
        >
          <span className="text-white/70 text-sm mb-2">Nach unten scrollen</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-white/70" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
