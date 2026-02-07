'use client'

import { useRef, useEffect, useCallback } from 'react'

export interface TouchGestureCallbacks {
  /** Called when user swipes from left edge to open sidebar */
  onEdgeSwipeRight?: () => void
  /** Called when user swipes from right edge */
  onEdgeSwipeLeft?: () => void
  /** Called on double tap */
  onDoubleTap?: (x: number, y: number) => void
  /** Called on long press */
  onLongPress?: (x: number, y: number) => void
  /** Called on pinch gesture */
  onPinch?: (scale: number) => void
  /** Called on swipe left (for navigation) */
  onSwipeLeft?: () => void
  /** Called on swipe right (for navigation) */
  onSwipeRight?: () => void
}

export interface TouchGestureOptions {
  /** Distance from edge to trigger edge swipe (default: 20) */
  edgeThreshold?: number
  /** Minimum swipe distance (default: 100) */
  swipeThreshold?: number
  /** Maximum time between taps for double tap (default: 300) */
  doubleTapDelay?: number
  /** Minimum hold time for long press (default: 500) */
  longPressDelay?: number
  /** Enable edge swipe gestures (default: true) */
  enableEdgeSwipe?: boolean
  /** Enable double tap (default: true) */
  enableDoubleTap?: boolean
  /** Enable long press (default: false) */
  enableLongPress?: boolean
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  edgeThreshold: 20,
  swipeThreshold: 100,
  doubleTapDelay: 300,
  longPressDelay: 500,
  enableEdgeSwipe: true,
  enableDoubleTap: true,
  enableLongPress: false,
}

interface TouchState {
  startX: number
  startY: number
  startTime: number
  isEdgeTouch: 'left' | 'right' | null
}

/**
 * Hook for handling touch gestures
 * Supports edge swipe, double tap, long press, and pinch
 */
export function useTouchGestures(
  callbacks: TouchGestureCallbacks,
  options: TouchGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const touchStateRef = useRef<TouchState | null>(null)
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialPinchDistanceRef = useRef<number | null>(null)

  // Clear long press timer
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      // Handle pinch start
      if (event.touches.length === 2) {
        initialPinchDistanceRef.current = getTouchDistance(event.touches)
        return
      }

      if (event.touches.length !== 1) return

      const touch = event.touches[0]
      const screenWidth = window.innerWidth

      // Detect edge touch
      let isEdgeTouch: 'left' | 'right' | null = null
      if (opts.enableEdgeSwipe) {
        if (touch.clientX <= opts.edgeThreshold) {
          isEdgeTouch = 'left'
        } else if (touch.clientX >= screenWidth - opts.edgeThreshold) {
          isEdgeTouch = 'right'
        }
      }

      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isEdgeTouch,
      }

      // Start long press timer
      if (opts.enableLongPress && callbacks.onLongPress) {
        clearLongPress()
        longPressTimerRef.current = setTimeout(() => {
          if (touchStateRef.current) {
            callbacks.onLongPress?.(
              touchStateRef.current.startX,
              touchStateRef.current.startY
            )
            touchStateRef.current = null
          }
        }, opts.longPressDelay)
      }
    },
    [opts, callbacks, getTouchDistance, clearLongPress]
  )

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      // Handle pinch
      if (event.touches.length === 2 && initialPinchDistanceRef.current) {
        const currentDistance = getTouchDistance(event.touches)
        const scale = currentDistance / initialPinchDistanceRef.current
        callbacks.onPinch?.(scale)
        return
      }

      // Cancel long press on move
      clearLongPress()

      if (!touchStateRef.current || event.touches.length !== 1) return

      const touch = event.touches[0]
      const deltaX = touch.clientX - touchStateRef.current.startX
      const deltaY = touch.clientY - touchStateRef.current.startY

      // Check if it's a horizontal swipe (not vertical scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        // Prevent scroll during horizontal swipe
        // event.preventDefault() // Uncomment if needed
      }
    },
    [callbacks, getTouchDistance, clearLongPress]
  )

  // Handle touch end
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      clearLongPress()
      initialPinchDistanceRef.current = null

      if (!touchStateRef.current) return

      const state = touchStateRef.current
      touchStateRef.current = null

      // Get end position (use changedTouches for touchend)
      const touch = event.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - state.startX
      const deltaY = touch.clientY - state.startY
      const deltaTime = Date.now() - state.startTime
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Check for double tap (small movement, quick tap)
      if (
        opts.enableDoubleTap &&
        distance < 10 &&
        deltaTime < 200 &&
        callbacks.onDoubleTap
      ) {
        const now = Date.now()
        const lastTap = lastTapRef.current

        if (
          lastTap &&
          now - lastTap.time < opts.doubleTapDelay &&
          Math.abs(touch.clientX - lastTap.x) < 30 &&
          Math.abs(touch.clientY - lastTap.y) < 30
        ) {
          callbacks.onDoubleTap(touch.clientX, touch.clientY)
          lastTapRef.current = null
          return
        }

        lastTapRef.current = {
          time: now,
          x: touch.clientX,
          y: touch.clientY,
        }
        return
      }

      // Check for swipe
      if (Math.abs(deltaX) >= opts.swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Edge swipe
        if (state.isEdgeTouch === 'left' && deltaX > 0) {
          callbacks.onEdgeSwipeRight?.()
          return
        }
        if (state.isEdgeTouch === 'right' && deltaX < 0) {
          callbacks.onEdgeSwipeLeft?.()
          return
        }

        // Regular swipe
        if (deltaX > 0) {
          callbacks.onSwipeRight?.()
        } else {
          callbacks.onSwipeLeft?.()
        }
      }
    },
    [opts, callbacks, clearLongPress]
  )

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    clearLongPress()
    touchStateRef.current = null
    initialPinchDistanceRef.current = null
  }, [clearLongPress])

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
      clearLongPress()
    }
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    clearLongPress,
  ])
}

/**
 * Hook to track if user is using pen/pencil input
 */
export function usePencilInput() {
  const isPencilRef = useRef(false)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      isPencilRef.current = event.pointerType === 'pen'
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return { isPencil: isPencilRef.current }
}
