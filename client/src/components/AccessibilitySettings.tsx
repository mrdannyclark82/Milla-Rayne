import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessibilitySettingsProps {
  highContrast: boolean;
  onHighContrastChange: (enabled: boolean) => void;
  dyslexiaFont: boolean;
  onDyslexiaFontChange: (enabled: boolean) => void;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  onColorBlindModeChange: (mode: "none" | "protanopia" | "deuteranopia" | "tritanopia") => void;
  largeTouchTargets: boolean;
  onLargeTouchTargetsChange: (enabled: boolean) => void;
}

export function AccessibilitySettings({
  highContrast,
  onHighContrastChange,
  dyslexiaFont,
  onDyslexiaFontChange,
  colorBlindMode,
  onColorBlindModeChange,
  largeTouchTargets,
  onLargeTouchTargetsChange
}: AccessibilitySettingsProps) {
  const colorBlindModes = [
    { value: "none", label: "None", icon: "eye" },
    { value: "protanopia", label: "Protanopia (Red-blind)", icon: "eye-slash" },
    { value: "deuteranopia", label: "Deuteranopia (Green-blind)", icon: "eye-slash" },
    { value: "tritanopia", label: "Tritanopia (Blue-blind)", icon: "eye-slash" }
  ];

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <i className="fas fa-universal-access mr-2 text-blue-400"></i>
          Accessibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">High Contrast Mode</span>
          <Button
            variant="outline"
            size="sm"
            className={`border-white/30 text-white/70 hover:text-white ${
              highContrast ? 'bg-blue-600/20 border-blue-400/50 text-blue-300' : ''
            }`}
            onClick={() => onHighContrastChange(!highContrast)}
            aria-label="Toggle high contrast mode"
            aria-pressed={highContrast}
          >
            <i className={`fas ${highContrast ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
            {highContrast ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Dyslexia-Friendly Font</span>
          <Button
            variant="outline"
            size="sm"
            className={`border-white/30 text-white/70 hover:text-white ${
              dyslexiaFont ? 'bg-blue-600/20 border-blue-400/50 text-blue-300' : ''
            }`}
            onClick={() => onDyslexiaFontChange(!dyslexiaFont)}
            aria-label="Toggle dyslexia-friendly font"
            aria-pressed={dyslexiaFont}
          >
            <i className={`fas ${dyslexiaFont ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
            {dyslexiaFont ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Large Touch Targets</span>
          <Button
            variant="outline"
            size="sm"
            className={`border-white/30 text-white/70 hover:text-white ${
              largeTouchTargets ? 'bg-blue-600/20 border-blue-400/50 text-blue-300' : ''
            }`}
            onClick={() => onLargeTouchTargetsChange(!largeTouchTargets)}
            aria-label="Toggle large touch targets"
            aria-pressed={largeTouchTargets}
          >
            <i className={`fas ${largeTouchTargets ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
            {largeTouchTargets ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-white/80 text-sm">Color Blind Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {colorBlindModes.map((mode) => (
              <Button
                key={mode.value}
                variant="outline"
                size="sm"
                className={`border-white/30 text-white/70 hover:text-white text-xs ${
                  colorBlindMode === mode.value ? 'bg-blue-600/20 border-blue-400/50' : ''
                }`}
                onClick={() => onColorBlindModeChange(mode.value as any)}
                aria-label={`Set color blind mode to ${mode.label}`}
                aria-pressed={colorBlindMode === mode.value}
              >
                <i className={`fas fa-${mode.icon} mr-1`}></i>
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-white/60">
            <i className="fas fa-info-circle mr-1"></i>
            These settings improve accessibility for users with different needs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
