import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
  setHighContrastMode: (value: boolean) => void;
}

// Helper function to apply class to body
const applyThemeToBody = (isHighContrast: boolean) => {
  if (typeof window !== 'undefined') { // Ensure runs only on client
    document.body.classList.toggle('theme-high-contrast', isHighContrast);
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isHighContrastMode: false, // Default value
      toggleHighContrastMode: () => {
        const newMode = !get().isHighContrastMode;
        set({ isHighContrastMode: newMode });
        applyThemeToBody(newMode);
      },
      setHighContrastMode: (value) => {
        set({ isHighContrastMode: value });
        applyThemeToBody(value);
      },
    }),
    {
      name: 'app-settings', // Name for localStorage item
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToBody(state.isHighContrastMode);
        }
      }
    }
  )
);

// Apply theme on initial client-side load based on persisted settings
// This helps avoid a flash of default theme if localStorage has a different setting
// before Zustand fully rehydrates and calls onRehydrateStorage.
if (typeof window !== 'undefined') {
  try {
    const persistedStateString = localStorage.getItem('app-settings');
    if (persistedStateString) {
      const persistedState = JSON.parse(persistedStateString);
      if (persistedState && persistedState.state && typeof persistedState.state.isHighContrastMode === 'boolean') {
        applyThemeToBody(persistedState.state.isHighContrastMode);
      }
    }
  } catch (e) {
    console.error("Error applying initial theme from localStorage:", e);
    // Fallback: ensure default state (no class) if an error occurs or no persisted state
    applyThemeToBody(false);
  }
}
