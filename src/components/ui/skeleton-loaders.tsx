'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className
      )}
    />
  )
}

export function DocumentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Metadata */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border/50 flex justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  )
}

export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Title */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>

      {/* Content Paragraphs */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReaderSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 border-r border-border/50 bg-sidebar p-4 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* TOC Items */}
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <SectionSkeleton />
        </div>
      </div>
    </div>
  )
}

export function UploadSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/50 p-12 text-center space-y-4">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      <Skeleton className="h-10 w-32 mx-auto rounded-lg" />
    </div>
  )
}

export function TableOfContentsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Items */}
      <div className="space-y-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function NavbarSkeleton() {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </header>
  )
}
