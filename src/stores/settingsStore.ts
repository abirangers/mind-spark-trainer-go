import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
  setHighContrastMode: (value: boolean) => void;
  fontSize: string; // Added
  setFontSize: (size: string) => void; // Added
}

// Helper function to apply theme class to body
const applyThemeToBody = (isHighContrast: boolean) => {
  if (typeof window !== 'undefined') {
    document.body.classList.toggle('theme-high-contrast', isHighContrast);
  }
};

// Helper array and function for font size
const FONT_SIZE_CLASSES = ['text-size-large', 'text-size-xlarge']; // Only non-default classes

const applyFontSizeToHtml = (size: string) => {
  if (typeof window !== 'undefined') {
    FONT_SIZE_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
    if (size === 'large') {
      document.documentElement.classList.add('text-size-large');
    } else if (size === 'xlarge') {
      document.documentElement.classList.add('text-size-xlarge');
    }
    // 'default' size means no extra class is added, or 'text-size-default' if we had one.
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isHighContrastMode: false,
      fontSize: 'default', // Initial state for fontSize
      toggleHighContrastMode: () => {
        const newMode = !get().isHighContrastMode;
        set({ isHighContrastMode: newMode });
        applyThemeToBody(newMode);
      },
      setHighContrastMode: (value) => {
        set({ isHighContrastMode: value });
        applyThemeToBody(value);
      },
      setFontSize: (size) => { // Added setFontSize action
        set({ fontSize: size });
        applyFontSizeToHtml(size);
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToBody(state.isHighContrastMode);
          // Ensure fontSize is applied on rehydration, defaulting if undefined
          applyFontSizeToHtml(state.fontSize || 'default');
        }
      }
    }
  )
);

// Apply settings on initial client-side load
if (typeof window !== 'undefined') {
  try {
    const persistedStateString = localStorage.getItem('app-settings');
    if (persistedStateString) {
      const persistedState = JSON.parse(persistedStateString);
      if (persistedState && persistedState.state) {
        // Apply high contrast mode
        if (typeof persistedState.state.isHighContrastMode === 'boolean') {
          applyThemeToBody(persistedState.state.isHighContrastMode);
        } else {
          applyThemeToBody(false); // Default if not set
        }
        // Apply font size
        if (typeof persistedState.state.fontSize === 'string') {
          applyFontSizeToHtml(persistedState.state.fontSize);
        } else {
          applyFontSizeToHtml('default'); // Default if not set
        }
      }
    } else {
      // If no persisted state, apply defaults
      applyThemeToBody(false);
      applyFontSizeToHtml('default');
    }
  } catch (e) {
    console.error("Error applying initial settings from localStorage:", e);
    // Fallback to ensure default state if an error occurs
    applyThemeToBody(false);
    applyFontSizeToHtml('default');
  }
}
