import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settingsStore";

export const FontSizeSelector = () => {
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setFontSize = useSettingsStore((state) => state.setFontSize);

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="font-size-select" className="whitespace-nowrap">
        Font Size
      </Label>
      <Select value={fontSize} onValueChange={(value) => setFontSize(value)}>
        <SelectTrigger id="font-size-select" className="w-[140px]">
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="large">Large</SelectItem>
          <SelectItem value="xlarge">Extra Large</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
