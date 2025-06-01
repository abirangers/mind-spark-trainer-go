import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settingsStore"; // Adjust path if store is elsewhere

export const HighContrastToggle = () => {
  const isHighContrastMode = useSettingsStore((state) => state.isHighContrastMode);
  const toggleHighContrastMode = useSettingsStore((state) => state.toggleHighContrastMode);

  return (
    <div className="flex items-center space-x-2 p-4">
      <Switch
        id="high-contrast-mode"
        checked={isHighContrastMode}
        onCheckedChange={toggleHighContrastMode}
        aria-label="Toggle high contrast mode"
      />
      <Label htmlFor="high-contrast-mode">High Contrast Mode</Label>
    </div>
  );
};
