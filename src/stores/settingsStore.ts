import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Defines the shape of the settings state managed by Zustand.
 */
interface SettingsState {
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
  setHighContrastMode: (value: boolean) => void;
  fontSize: string;
  setFontSize: (size: string) => void;

  isAdaptiveDifficultyEnabled: boolean; // New
  toggleAdaptiveDifficulty: () => void; // New
}

// Helper function to apply theme class to body
/**
 * Applies or removes the high contrast theme class from the document body.
 * @param {boolean} isHighContrast - True to apply high contrast, false to remove.
 */
export const applyThemeToBody = (isHighContrast: boolean) => {
  if (typeof window !== "undefined") {
    document.body.classList.toggle("theme-high-contrast", isHighContrast);
  }
};

// Helper array and function for font size
export const FONT_SIZE_CLASSES = ["text-size-large", "text-size-xlarge"]; // Only non-default classes

/**
 * Applies the specified font size class to the document's HTML element.
 * Removes other font size classes before applying the new one.
 * @param {string} size - The font size to apply ('default', 'large', 'xlarge').
 */
export const applyFontSizeToHtml = (size: string) => {
  if (typeof window !== "undefined") {
    FONT_SIZE_CLASSES.forEach((cls) => document.documentElement.classList.remove(cls));
    if (size === "large") {
      document.documentElement.classList.add("text-size-large");
    } else if (size === "xlarge") {
      document.documentElement.classList.add("text-size-xlarge");
    }
    // 'default' size means no extra class is added
  }
};

/**
 * Zustand store for managing global application settings.
 * Persists settings to localStorage.
 *
 * @property {boolean} isHighContrastMode - Whether high contrast mode is enabled.
 * @property {function} toggleHighContrastMode - Action to toggle high contrast mode.
 * @property {function} setHighContrastMode - Action to set high contrast mode explicitly.
 * @property {string} fontSize - Current font size setting (e.g., 'default', 'large', 'xlarge').
 * @property {function} setFontSize - Action to set the font size.
 * @property {boolean} isAdaptiveDifficultyEnabled - Whether adaptive difficulty is enabled for the game.
 * @property {function} toggleAdaptiveDifficulty - Action to toggle adaptive difficulty.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isHighContrastMode: false,
      fontSize: "default",
      isAdaptiveDifficultyEnabled: true, // Default adaptive difficulty to true

      toggleHighContrastMode: () => {
        const newMode = !get().isHighContrastMode;
        set({ isHighContrastMode: newMode });
      },
      setHighContrastMode: (value) => {
        set({ isHighContrastMode: value });
      },
      setFontSize: (size) => {
        set({ fontSize: size });
      },
      toggleAdaptiveDifficulty: () => {
        // New action
        const newMode = !get().isAdaptiveDifficultyEnabled;
        set({ isAdaptiveDifficultyEnabled: newMode });
        // No direct DOM side effect needed for this toggle itself
      },
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // applyThemeToBody(state.isHighContrastMode); // DOM moved to SettingsApplier
          // applyFontSizeToHtml(state.fontSize || 'default'); // DOM moved to SettingsApplier
          // isAdaptiveDifficultyEnabled does not need explicit action on rehydrate here,
          // components will read its value.
        }
      },
    }
  )
);

// Initial load script block removed, SettingsApplier component handles this.
