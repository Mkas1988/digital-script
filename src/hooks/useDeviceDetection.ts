'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DeviceInfo {
  /** True if device supports touch */
  isTouchDevice: boolean
  /** True if device is likely a tablet (touch + medium screen) */
  isTablet: boolean
  /** True if Apple Pencil or similar stylus may be supported */
  isPencilSupported: boolean
  /** Current pointer type from last interaction */
  pointerType: 'mouse' | 'touch' | 'pen' | null
  /** Screen size category */
  screenSize: 'mobile' | 'tablet' | 'desktop'
  /** True if device has coarse pointer (finger touch) */
  hasCoarsePointer: boolean
  /** Viewport width */
  viewportWidth: number
  /** Viewport height */
  viewportHeight: number
}

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

/**
 * Hook to detect device type and capabilities
 * Useful for adapting UI for tablet/pencil mode
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => ({
    isTouchDevice: false,
    isTablet: false,
    isPencilSupported: false,
    pointerType: null,
    screenSize: 'desktop',
    hasCoarsePointer: false,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  }))

  // Detect initial device capabilities
  const detectDeviceCapabilities = useCallback(() => {
    if (typeof window === 'undefined') return

    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE/Edge specific
      navigator.msMaxTouchPoints > 0

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Determine screen size category
    let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (viewportWidth < BREAKPOINTS.tablet) {
      screenSize = 'mobile'
    } else if (viewportWidth < BREAKPOINTS.desktop) {
      screenSize = 'tablet'
    }

    // Check for coarse pointer (touch)
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches

    // Tablet detection: touch device with medium screen size
    const isTablet = isTouchDevice && screenSize === 'tablet'

    // Pencil support: iPads and similar devices
    // This is a heuristic - actual pencil detection happens on pointer events
    const isPencilSupported =
      isTouchDevice &&
      (screenSize === 'tablet' || screenSize === 'desktop') &&
      // Check for iPad specifically
      (navigator.userAgent.includes('iPad') ||
        (navigator.userAgent.includes('Macintosh') && isTouchDevice))

    setDeviceInfo((prev) => ({
      ...prev,
      isTouchDevice,
      isTablet,
      isPencilSupported,
      screenSize,
      hasCoarsePointer,
      viewportWidth,
      viewportHeight,
    }))
  }, [])

  // Track pointer type from events
  const handlePointerEvent = useCallback((event: PointerEvent) => {
    const pointerType = event.pointerType as 'mouse' | 'touch' | 'pen'
    setDeviceInfo((prev) => {
      if (prev.pointerType !== pointerType) {
        return { ...prev, pointerType }
      }
      return prev
    })
  }, [])

  // Handle window resize
  const handleResize = useCallback(() => {
    detectDeviceCapabilities()
  }, [detectDeviceCapabilities])

  useEffect(() => {
    // Initial detection
    detectDeviceCapabilities()

    // Listen for pointer events to detect pen/touch/mouse
    window.addEventListener('pointerdown', handlePointerEvent)
    window.addEventListener('pointermove', handlePointerEvent)

    // Listen for resize
    window.addEventListener('resize', handleResize)

    // Media query listeners for pointer type changes
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const handlePointerChange = () => detectDeviceCapabilities()
    coarsePointerQuery.addEventListener('change', handlePointerChange)

    return () => {
      window.removeEventListener('pointerdown', handlePointerEvent)
      window.removeEventListener('pointermove', handlePointerEvent)
      window.removeEventListener('resize', handleResize)
      coarsePointerQuery.removeEventListener('change', handlePointerChange)
    }
  }, [detectDeviceCapabilities, handlePointerEvent, handleResize])

  return deviceInfo
}

/**
 * Check if current interaction is from Apple Pencil
 */
export function isPencilEvent(event: PointerEvent): boolean {
  return event.pointerType === 'pen'
}

/**
 * Get pressure from pointer event (for pencil)
 */
export function getPencilPressure(event: PointerEvent): number {
  if (event.pointerType !== 'pen') return 0
  return event.pressure
}

/**
 * Get tilt from pointer event (for pencil)
 */
export function getPencilTilt(event: PointerEvent): { x: number; y: number } {
  if (event.pointerType !== 'pen') return { x: 0, y: 0 }
  return {
    x: event.tiltX,
    y: event.tiltY,
  }
}
