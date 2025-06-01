import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
export const applyThemeToBody = (isHighContrast: boolean) => {
  if (typeof window !== "undefined") {
    document.body.classList.toggle("theme-high-contrast", isHighContrast);
  }
};

// Helper array and function for font size
export const FONT_SIZE_CLASSES = ["text-size-large", "text-size-xlarge"]; // Only non-default classes

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
