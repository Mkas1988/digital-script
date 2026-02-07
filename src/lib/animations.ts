import { Variants, Transition } from 'framer-motion'

// Transition presets
export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.2, ease: 'easeOut' } as Transition,
  slow: { duration: 0.3, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  springBouncy: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
  smooth: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } as Transition,
}

// Animation variants for common patterns
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const slideUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
}

export const slideDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
}

export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

export const drawerSlide: Variants = {
  closed: { x: '-100%' },
  open: {
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
}

export const toolbarReveal: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 200 },
  },
}

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

// Card hover effect
export const cardHover: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

// Button press effect
export const buttonPress: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
}

// Sidebar animation
export const sidebarAnimation: Variants = {
  open: {
    width: 288,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  closed: {
    width: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
}

// Modal/Dialog animation
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
}

// Notification/Toast animation
export const toastAnimation: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

// List item animation (for staggered lists)
export const listItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
}

// Progress bar animation
export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (value: number) => ({
    width: `${value}%`,
    transition: { duration: 0.5, ease: 'easeOut' },
  }),
}

// Skeleton shimmer effect (use with CSS)
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// Glow pulse effect
export const glowPulse: Variants = {
  initial: { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
  animate: {
    boxShadow: [
      '0 0 20px rgba(99, 102, 241, 0.3)',
      '0 0 40px rgba(99, 102, 241, 0.5)',
      '0 0 20px rgba(99, 102, 241, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Utility function for creating custom stagger
export function createStagger(staggerDelay: number = 0.05): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }
}

// Utility for creating delay-based animations
export function withDelay(delay: number, variants: Variants): Variants {
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...(typeof variants.animate === 'object' && 'transition' in variants.animate
          ? variants.animate.transition
          : {}),
        delay,
      },
    },
  }
}
