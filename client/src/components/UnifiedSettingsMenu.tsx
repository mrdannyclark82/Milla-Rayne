/**
 * UnifiedSettingsMenu - Consolidated settings dropdown
 * 
 * Provides a single settings icon that opens a menu with:
 * - Scene Settings
 * - Voice Settings
 * - Developer Mode
 * 
 * This keeps the UI clean and uncluttered.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SceneSettingsDialog } from './SceneSettingsDialog';
import { VoicePickerDialog } from './VoicePickerDialog';
import DeveloperModeToggle from './DeveloperModeToggle';

interface UnifiedSettingsMenuProps {
  // Voice settings props
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceSelect: (voice: SpeechSynthesisVoice) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  voicePitch: number;
  onVoicePitchChange: (pitch: number) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
  getButtonSize: () => "default" | "sm";
  setShowVoicePicker: (show: boolean) => void;
}

export const UnifiedSettingsMenu: React.FC<UnifiedSettingsMenuProps> = ({
  getButtonSize,
  setShowVoicePicker
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={getButtonSize()}
          title="Open settings menu"
          aria-label="Open settings menu"
          className="bg-white/10 hover:bg-white/20"
        >
          <i className="fas fa-cog mr-2"></i>
          Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black/90 backdrop-blur-md border border-white/20 text-white"
      >
        <SceneSettingsDialog>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
          >
            <i className="fas fa-window-restore mr-2 text-purple-400"></i>
            Scene Settings
          </DropdownMenuItem>
        </SceneSettingsDialog>
        
        <DropdownMenuItem
          onClick={() => setShowVoicePicker(true)}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <i className="fas fa-microphone mr-2 text-blue-400"></i>
          Voice Settings
        </DropdownMenuItem>
        
        <DeveloperModeToggle>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
          >
            <i className="fas fa-wrench mr-2 text-green-400"></i>
            Developer Mode
          </DropdownMenuItem>
        </DeveloperModeToggle>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
