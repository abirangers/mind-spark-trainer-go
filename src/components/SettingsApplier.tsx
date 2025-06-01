import { useEffect } from "react";
import { useSettingsStore, applyThemeToBody, applyFontSizeToHtml } from "@/stores/settingsStore";
// Removed FONT_SIZE_CLASSES import as applyFontSizeToHtml from store should encapsulate it.

/**
 * A side-effect component that subscribes to settings changes in `useSettingsStore`
 * and applies them directly to the DOM (e.g., body class for theme, HTML class for font size).
 * This component does not render any visible UI.
 *
 * @returns {null} Does not render any DOM elements.
 */
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
