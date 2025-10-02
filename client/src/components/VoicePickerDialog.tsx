import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface VoicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceSelect: (voice: SpeechSynthesisVoice) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  voicePitch: number;
  onVoicePitchChange: (pitch: number) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
}

export function VoicePickerDialog({
  open,
  onOpenChange,
  availableVoices,
  selectedVoice,
  onVoiceSelect,
  speechRate,
  onSpeechRateChange,
  voicePitch,
  onVoicePitchChange,
  voiceVolume,
  onVoiceVolumeChange
}: VoicePickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("neutral");

  // Voice preview function
  const previewVoice = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hello, I'm Milla. This is how I sound.");
    utterance.voice = voice;
    utterance.rate = speechRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;
    window.speechSynthesis.speak(utterance);
  };

  // Filter voices based on search and filters
  const filteredVoices = availableVoices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.lang.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGender = genderFilter === "all" || 
      (genderFilter === "female" && (
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      )) ||
      (genderFilter === "male" && (
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('mark')
      ));

    const matchesAccent = accentFilter === "all" || 
      voice.lang.includes(accentFilter);

    return matchesSearch && matchesGender && matchesAccent;
  });

  // Get unique accents from available voices
  const availableAccents = Array.from(new Set(availableVoices.map(v => v.lang)))
    .sort();

  // Style presets
  const stylePresets = {
    neutral: { rate: 1.0, pitch: 1.0, volume: 0.8 },
    friendly: { rate: 0.95, pitch: 1.1, volume: 0.9 },
    professional: { rate: 1.1, pitch: 0.95, volume: 0.85 },
    excited: { rate: 1.2, pitch: 1.2, volume: 1.0 },
    calm: { rate: 0.85, pitch: 0.9, volume: 0.7 },
    newsreader: { rate: 1.05, pitch: 1.0, volume: 0.9 }
  };

  const applyStylePreset = (style: keyof typeof stylePresets) => {
    setSelectedStyle(style);
    const preset = stylePresets[style];
    onSpeechRateChange(preset.rate);
    onVoicePitchChange(preset.pitch);
    onVoiceVolumeChange(preset.volume);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-black/90 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center">
            <i className="fas fa-microphone-alt mr-2 text-green-400"></i>
            Voice Selection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search voices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
              aria-label="Search voices"
            />

            <div className="flex gap-2 flex-wrap">
              {/* Gender Filter */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-white/30 ${genderFilter === "all" ? "bg-green-600/30 border-green-400/50" : ""}`}
                  onClick={() => setGenderFilter("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-white/30 ${genderFilter === "female" ? "bg-green-600/30 border-green-400/50" : ""}`}
                  onClick={() => setGenderFilter("female")}
                >
                  <i className="fas fa-female mr-1"></i>
                  Female
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-white/30 ${genderFilter === "male" ? "bg-green-600/30 border-green-400/50" : ""}`}
                  onClick={() => setGenderFilter("male")}
                >
                  <i className="fas fa-male mr-1"></i>
                  Male
                </Button>
              </div>

              {/* Accent Filter */}
              <select
                value={accentFilter}
                onChange={(e) => setAccentFilter(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/30 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Filter by accent"
              >
                <option value="all">All Accents</option>
                {availableAccents.map(accent => (
                  <option key={accent} value={accent}>{accent}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Voice Style Presets</label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(stylePresets).map((style) => (
                <Button
                  key={style}
                  size="sm"
                  variant="outline"
                  className={`border-white/30 ${selectedStyle === style ? "bg-purple-600/30 border-purple-400/50" : ""}`}
                  onClick={() => applyStylePreset(style as keyof typeof stylePresets)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Voice Controls */}
          <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-white/80 font-medium">Speech Rate</label>
                <span className="text-xs text-white/60">{speechRate.toFixed(2)}x</span>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(value) => onSpeechRateChange(value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
                aria-label="Speech rate"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-white/80 font-medium">Pitch</label>
                <span className="text-xs text-white/60">{voicePitch.toFixed(2)}</span>
              </div>
              <Slider
                value={[voicePitch]}
                onValueChange={(value) => onVoicePitchChange(value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
                aria-label="Voice pitch"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-white/80 font-medium">Volume</label>
                <span className="text-xs text-white/60">{Math.round(voiceVolume * 100)}%</span>
              </div>
              <Slider
                value={[voiceVolume]}
                onValueChange={(value) => onVoiceVolumeChange(value[0])}
                min={0.1}
                max={1.0}
                step={0.1}
                className="w-full"
                aria-label="Voice volume"
              />
            </div>
          </div>

          {/* Voice List */}
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">
              Available Voices ({filteredVoices.length})
            </label>
            <div className="max-h-64 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2">
              {filteredVoices.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No voices match your filters
                </div>
              ) : (
                filteredVoices.map((voice, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedVoice?.name === voice.name
                        ? "bg-green-600/20 border-green-400/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } cursor-pointer transition-colors`}
                    onClick={() => onVoiceSelect(voice)}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedVoice?.name === voice.name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onVoiceSelect(voice);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{voice.name}</div>
                      <div className="text-xs text-gray-400">
                        {voice.lang} • {voice.localService ? "Local" : "Online"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-400 hover:text-green-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVoice(voice);
                      }}
                      aria-label={`Preview ${voice.name}`}
                    >
                      <i className="fas fa-play"></i>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/30 text-white/70 hover:text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
