import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from '@/stores/settingsStore'; // Adjust path as needed

export const AdaptiveDifficultyToggle = () => {
  // Select specific state slices for performance
  const isAdaptiveDifficultyEnabled = useSettingsStore(
    (state) => state.isAdaptiveDifficultyEnabled
  );
  const toggleAdaptiveDifficulty = useSettingsStore(
    (state) => state.toggleAdaptiveDifficulty
  );

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="adaptive-difficulty-mode"
        checked={isAdaptiveDifficultyEnabled}
        onCheckedChange={toggleAdaptiveDifficulty}
        aria-label="Toggle adaptive N-Level adjustment"
      />
      <Label htmlFor="adaptive-difficulty-mode" className="cursor-pointer">
        Auto-adjust N-Level
      </Label>
    </div>
  );
};
