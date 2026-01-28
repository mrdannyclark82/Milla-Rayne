import { useState } from 'react';
import { X, Sun, Waves, Activity, Volume2 } from 'lucide-react';

interface ScoreSettingsProps {
  values: {
    ambientLight: number;
    amplitude: number;
    status: number;
    volume: number;
  };
  onChange: (values: ScoreSettingsProps['values']) => void;
  onClose: () => void;
}

interface SettingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  color: string;
}

function SettingSlider({ label, value, onChange, icon, color }: SettingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className="text-sm text-white/80">{label}</span>
        </div>
        <span className="text-xs text-white/40">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color.includes('cyan') ? '#00f2ff' : color.includes('pink') ? '#ff00aa' : '#7c3aed'} ${value}%, rgba(255,255,255,0.1) ${value}%)`,
        }}
      />
    </div>
  );
}

export function ScoreSettings({ values, onChange, onClose }: ScoreSettingsProps) {
  const updateValue = (key: keyof ScoreSettingsProps['values'], value: number) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  return (
    <div className="backdrop-blur-xl bg-[#0c021a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-medium text-white">Score Settings</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings */}
      <div className="p-4 space-y-5">
        <SettingSlider
          label="Ambient Light"
          value={values.ambientLight}
          onChange={(v) => updateValue('ambientLight', v)}
          icon={<Sun className="w-4 h-4" />}
          color="text-[#00f2ff]"
        />
        
        <SettingSlider
          label="Amplitude"
          value={values.amplitude}
          onChange={(v) => updateValue('amplitude', v)}
          icon={<Waves className="w-4 h-4" />}
          color="text-[#ff00aa]"
        />
        
        <SettingSlider
          label="Status"
          value={values.status}
          onChange={(v) => updateValue('status', v)}
          icon={<Activity className="w-4 h-4" />}
          color="text-[#7c3aed]"
        />
        
        <SettingSlider
          label="Volume"
          value={values.volume}
          onChange={(v) => updateValue('volume', v)}
          icon={<Volume2 className="w-4 h-4" />}
          color="text-[#00f2ff]"
        />
      </div>

      {/* Status indicator */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
          <span className="text-xs text-white/50">System Active</span>
        </div>
      </div>
    </div>
  );
}

export default ScoreSettings;
