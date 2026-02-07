'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'elevated' | 'interactive' | 'solid'
  glow?: boolean
  gradient?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = false, gradient = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden',
          // Base glass effect
          variant !== 'solid' && [
            'bg-white/70 dark:bg-gray-900/70',
            'backdrop-blur-xl',
            'border border-white/20 dark:border-white/10',
          ],
          // Solid variant
          variant === 'solid' && [
            'bg-card',
            'border border-border',
          ],
          // Elevated variant
          variant === 'elevated' && [
            'shadow-xl',
          ],
          // Interactive variant
          variant === 'interactive' && [
            'cursor-pointer transition-all duration-300',
            'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1',
            'hover:border-brand-300/50 dark:hover:border-brand-500/30',
            'active:scale-[0.98]',
          ],
          // Glow effect
          glow && 'shadow-glow animate-glow-pulse',
          // Gradient background
          gradient && 'gradient-brand-soft',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
GlassCard.displayName = 'GlassCard'

const GlassCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
GlassCardHeader.displayName = 'GlassCardHeader'

const GlassCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

const GlassCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
GlassCardDescription.displayName = 'GlassCardDescription'

const GlassCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

const GlassCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
GlassCardFooter.displayName = 'GlassCardFooter'

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
}
