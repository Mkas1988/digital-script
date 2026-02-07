/**
 * Highlight color palette for text annotations
 */

export interface HighlightColor {
  value: string
  label: string
  tailwind: string
  darkTailwind: string
}

export const HIGHLIGHT_COLORS: Record<string, HighlightColor> = {
  yellow: {
    value: '#ffeb3b',
    label: 'Gelb',
    tailwind: 'bg-yellow-300/50',
    darkTailwind: 'dark:bg-yellow-500/30',
  },
  green: {
    value: '#a5d6a7',
    label: 'Grün',
    tailwind: 'bg-green-300/50',
    darkTailwind: 'dark:bg-green-500/30',
  },
  blue: {
    value: '#90caf9',
    label: 'Blau',
    tailwind: 'bg-blue-300/50',
    darkTailwind: 'dark:bg-blue-500/30',
  },
  pink: {
    value: '#f48fb1',
    label: 'Rosa',
    tailwind: 'bg-pink-300/50',
    darkTailwind: 'dark:bg-pink-500/30',
  },
  orange: {
    value: '#ffcc80',
    label: 'Orange',
    tailwind: 'bg-orange-300/50',
    darkTailwind: 'dark:bg-orange-500/30',
  },
} as const

export const HIGHLIGHT_COLOR_VALUES = Object.values(HIGHLIGHT_COLORS)
export const HIGHLIGHT_COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as Array<
  keyof typeof HIGHLIGHT_COLORS
>

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_COLORS.yellow.value

/**
 * Get highlight color by value
 */
export function getHighlightColorByValue(value: string): HighlightColor | null {
  return (
    Object.values(HIGHLIGHT_COLORS).find((color) => color.value === value) ||
    null
  )
}

/**
 * Get tailwind classes for a highlight color value
 */
export function getHighlightClasses(colorValue: string): string {
  const color = getHighlightColorByValue(colorValue)
  if (!color) return 'bg-yellow-300/50 dark:bg-yellow-500/30'
  return `${color.tailwind} ${color.darkTailwind}`
}
