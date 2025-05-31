export interface SettingsState {
  isHighContrastMode: boolean;
  toggleHighContrastMode: () => void;
  setHighContrastMode: (value: boolean) => void;
  fontSize: string;
  setFontSize: (size: string) => void;

  isAdaptiveDifficultyEnabled: boolean; // New
  toggleAdaptiveDifficulty: () => void;  // New
}
