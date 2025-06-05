import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  isHighContrastMode: boolean
  toggleHighContrastMode: () => void
  setHighContrastMode: (value: boolean) => void
  fontSize: string
  setFontSize: (size: string) => void
}

/**
 * @store useSettingsStore
 * @description Zustand store for managing global application settings.
 * This store handles user preferences such as high contrast mode and font size,
 * persisting them to localStorage and applying them dynamically to the document.
 *
 * @state {boolean} isHighContrastMode - Current state of high contrast mode.
 * @action toggleHighContrastMode - Action to toggle high contrast mode on/off.
 * @action setHighContrastMode - Action to set high contrast mode to a specific value.
 * @state {string} fontSize - Current font size setting (e.g., 'default', 'large', 'xlarge').
 * @action setFontSize - Action to set the application's font size.
 */

// Helper function to apply theme class to body
const applyThemeToBody = (isHighContrast: boolean) => {
  if (typeof window !== 'undefined') {
    document.body.classList.toggle('theme-high-contrast', isHighContrast)
  }
}

// Helper array and function for font size
const FONT_SIZE_CLASSES = ['text-size-large', 'text-size-xlarge'] // Only non-default classes

const applyFontSizeToHtml = (size: string) => {
  if (typeof window !== 'undefined') {
    FONT_SIZE_CLASSES.forEach(cls => document.documentElement.classList.remove(cls))
    if (size === 'large') {
      document.documentElement.classList.add('text-size-large')
    } else if (size === 'xlarge') {
      document.documentElement.classList.add('text-size-xlarge')
    }
    // 'default' size means no extra class is added
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isHighContrastMode: false,
      fontSize: 'default',

      /**
       * @action toggleHighContrastMode
       * @description Toggles the high contrast mode on or off and applies the theme to the body.
       */
      toggleHighContrastMode: () => {
        const newMode = !get().isHighContrastMode
        set({ isHighContrastMode: newMode })
        applyThemeToBody(newMode)
      },
      /**
       * @action setHighContrastMode
       * @description Sets the high contrast mode to a specific value and applies the theme.
       * @param {boolean} value - True to enable high contrast mode, false to disable.
       */
      setHighContrastMode: value => {
        set({ isHighContrastMode: value })
        applyThemeToBody(value)
      },
      /**
       * @action setFontSize
       * @description Sets the application's font size and applies it to the HTML element.
       * @param {string} size - The desired font size (e.g., 'default', 'large', 'xlarge').
       */
      setFontSize: size => {
        set({ fontSize: size })
        applyFontSizeToHtml(size)
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          applyThemeToBody(state.isHighContrastMode)
          applyFontSizeToHtml(state.fontSize || 'default')
        }
      },
    }
  )
)

// Apply settings on initial client-side load
if (typeof window !== 'undefined') {
  try {
    const persistedStateString = localStorage.getItem('app-settings')
    if (persistedStateString) {
      const persistedState = JSON.parse(persistedStateString)
      if (persistedState && persistedState.state) {
        // Apply high contrast mode
        if (typeof persistedState.state.isHighContrastMode === 'boolean') {
          applyThemeToBody(persistedState.state.isHighContrastMode)
        } else {
          applyThemeToBody(false) // Default if not set
        }
        // Apply font size
        if (typeof persistedState.state.fontSize === 'string') {
          applyFontSizeToHtml(persistedState.state.fontSize)
        } else {
          applyFontSizeToHtml('default') // Default if not set
        }
      }
    } else {
      // If no persisted state, apply defaults for visual settings
      applyThemeToBody(false)
      applyFontSizeToHtml('default')
    }
  } catch (e) {
    console.error('Error applying initial settings from localStorage:', e)
    // Fallback to ensure default state if an error occurs
    applyThemeToBody(false)
    applyFontSizeToHtml('default')
  }
}
