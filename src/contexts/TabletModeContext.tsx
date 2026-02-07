'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useDeviceDetection, type DeviceInfo } from '@/hooks/useDeviceDetection'

export type TouchTargetSize = 'normal' | 'large'

interface TabletModeContextValue {
  /** Whether tablet mode is currently enabled */
  isTabletMode: boolean
  /** Toggle tablet mode on/off */
  setTabletMode: (enabled: boolean) => void
  /** Device information from detection hook */
  deviceInfo: DeviceInfo
  /** Whether sidebar is open (for tablet drawer mode) */
  sidebarOpen: boolean
  /** Toggle sidebar open/closed */
  toggleSidebar: () => void
  /** Set sidebar state directly */
  setSidebarOpen: (open: boolean) => void
  /** Current touch target size setting */
  touchTargetSize: TouchTargetSize
  /** Set touch target size */
  setTouchTargetSize: (size: TouchTargetSize) => void
  /** Whether toolbar is visible (for auto-hide) */
  toolbarVisible: boolean
  /** Toggle toolbar visibility */
  toggleToolbar: () => void
  /** Set toolbar visibility */
  setToolbarVisible: (visible: boolean) => void
  /** Whether user prefers tablet mode to be auto-enabled */
  autoEnableTabletMode: boolean
  /** Set auto-enable preference */
  setAutoEnableTabletMode: (auto: boolean) => void
}

const TabletModeContext = createContext<TabletModeContextValue | null>(null)

const STORAGE_KEY = 'digital-script-tablet-settings'

interface TabletSettings {
  tabletModeEnabled: boolean
  autoEnableTabletMode: boolean
  touchTargetSize: TouchTargetSize
}

interface TabletModeProviderProps {
  children: ReactNode
}

export function TabletModeProvider({ children }: TabletModeProviderProps) {
  const deviceInfo = useDeviceDetection()

  // UI state
  const [isTabletMode, setIsTabletMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [touchTargetSize, setTouchTargetSize] = useState<TouchTargetSize>('normal')
  const [autoEnableTabletMode, setAutoEnableTabletMode] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: TabletSettings = JSON.parse(stored)
        setIsTabletMode(settings.tabletModeEnabled)
        setAutoEnableTabletMode(settings.autoEnableTabletMode)
        setTouchTargetSize(settings.touchTargetSize)
      }
    } catch (err) {
      console.warn('Failed to load tablet settings:', err)
    }

    setIsInitialized(true)
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return

    try {
      const settings: TabletSettings = {
        tabletModeEnabled: isTabletMode,
        autoEnableTabletMode,
        touchTargetSize,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (err) {
      console.warn('Failed to save tablet settings:', err)
    }
  }, [isTabletMode, autoEnableTabletMode, touchTargetSize, isInitialized])

  // Auto-enable tablet mode when device is detected as tablet
  useEffect(() => {
    if (!isInitialized) return

    if (autoEnableTabletMode && deviceInfo.isTablet && !isTabletMode) {
      setIsTabletMode(true)
      // Default to larger touch targets on tablets
      setTouchTargetSize('large')
    }
  }, [deviceInfo.isTablet, autoEnableTabletMode, isTabletMode, isInitialized])

  // Auto-collapse sidebar on tablets
  useEffect(() => {
    if (isTabletMode && deviceInfo.screenSize === 'tablet') {
      setSidebarOpen(false)
    }
  }, [isTabletMode, deviceInfo.screenSize])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const toggleToolbar = useCallback(() => {
    setToolbarVisible((prev) => !prev)
  }, [])

  const value: TabletModeContextValue = {
    isTabletMode,
    setTabletMode: setIsTabletMode,
    deviceInfo,
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    touchTargetSize,
    setTouchTargetSize,
    toolbarVisible,
    toggleToolbar,
    setToolbarVisible,
    autoEnableTabletMode,
    setAutoEnableTabletMode,
  }

  return (
    <TabletModeContext.Provider value={value}>
      {children}
    </TabletModeContext.Provider>
  )
}

export function useTabletMode() {
  const context = useContext(TabletModeContext)
  if (!context) {
    throw new Error('useTabletMode must be used within a TabletModeProvider')
  }
  return context
}

/**
 * Hook to check if we should use touch-friendly sizing
 */
export function useTouchFriendly() {
  const context = useContext(TabletModeContext)
  if (!context) {
    // If not in provider, use device detection only
    return {
      isTouchFriendly: false,
      touchTargetSize: 'normal' as TouchTargetSize,
    }
  }

  return {
    isTouchFriendly:
      context.isTabletMode || context.deviceInfo.hasCoarsePointer,
    touchTargetSize: context.touchTargetSize,
  }
}
