import { useEffect } from "react";
import { useSettingsStore, applyThemeToBody, applyFontSizeToHtml } from "@/stores/settingsStore";
// Removed FONT_SIZE_CLASSES import as applyFontSizeToHtml from store should encapsulate it.

const SettingsApplier = () => {
  const isHighContrastMode = useSettingsStore((state) => state.isHighContrastMode);
  const fontSize = useSettingsStore((state) => state.fontSize);

  useEffect(() => {
    // console.log("SettingsApplier: High contrast mode changed to", isHighContrastMode);
    applyThemeToBody(isHighContrastMode); // Use imported function
  }, [isHighContrastMode]);

  useEffect(() => {
    // console.log("SettingsApplier: Font size changed to", fontSize);
    applyFontSizeToHtml(fontSize); // Use imported function
  }, [fontSize]);

  // This component does not render anything itself
  return null;
};

export default SettingsApplier;
