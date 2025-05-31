import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SettingsState } from "./types";
import storageService from "@/services/storage";

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
    // 'default' size means no extra class is added
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isHighContrastMode: false,
      fontSize: 'default',
      isAdaptiveDifficultyEnabled: true, // Default adaptive difficulty to true

      toggleHighContrastMode: () => {
        const newMode = !get().isHighContrastMode;
        set({ isHighContrastMode: newMode });
        applyThemeToBody(newMode);
      },
      setHighContrastMode: (value) => {
        set({ isHighContrastMode: value });
        applyThemeToBody(value);
      },
      setFontSize: (size) => {
        set({ fontSize: size });
        applyFontSizeToHtml(size);
      },
      toggleAdaptiveDifficulty: () => { // New action
        const newMode = !get().isAdaptiveDifficultyEnabled;
        set({ isAdaptiveDifficultyEnabled: newMode });
        // No direct DOM side effect needed for this toggle itself
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => storageService),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToBody(state.isHighContrastMode);
          applyFontSizeToHtml(state.fontSize || 'default');
          // isAdaptiveDifficultyEnabled does not need explicit action on rehydrate here,
          // components will read its value.
        }
      }
    }
  )
);

// Apply settings on initial client-side load
if (typeof window !== 'undefined') {
  try {
    // Use storageService to get the persisted state, which includes the 'state' wrapper and 'version'
    const persistedStorageValue = storageService.getObject<{ state: SettingsState, version?: number }>('app-settings');

    if (persistedStorageValue && persistedStorageValue.state) {
      const actualState = persistedStorageValue.state; // This is the SettingsState object
      // Apply high contrast mode
      if (typeof actualState.isHighContrastMode === 'boolean') {
        applyThemeToBody(actualState.isHighContrastMode);
      } else {
        applyThemeToBody(false); // Default if not set
      }
      // Apply font size
      if (typeof actualState.fontSize === 'string') {
        applyFontSizeToHtml(actualState.fontSize);
      } else {
        applyFontSizeToHtml('default'); // Default if not set
      }
      // isAdaptiveDifficultyEnabled will be picked up by components from the store once it initializes/rehydrates.
      // No direct DOM manipulation needed here for it.
    } else {
      // If no persisted state, apply defaults for visual settings
      applyThemeToBody(false);
      applyFontSizeToHtml('default');
    }
  } catch (e) {
    console.error("Error applying initial settings from storageService:", e); // Updated error message
    // Fallback to ensure default state if an error occurs
    applyThemeToBody(false);
    applyFontSizeToHtml('default');
  }
}
