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

import { ElevenLabsVoice } from '@/types/elevenLabs';

interface UnifiedSettingsMenuProps {
  // Voice settings props
  selectedVoice: ElevenLabsVoice | null;
  onVoiceSelect: (voice: ElevenLabsVoice) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  voicePitch: number;
  onVoicePitchChange: (pitch: number) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
  getButtonSize: () => 'default' | 'sm';
  setShowVoicePicker: (show: boolean) => void;
}

export const UnifiedSettingsMenu: React.FC<UnifiedSettingsMenuProps> = ({
  getButtonSize,
  setShowVoicePicker,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          title="Open settings menu"
          aria-label="Open settings menu"
          className="bg-white/10 hover:bg-white/20"
        >
          <i className="fas fa-cog"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 bg-[#2d3e50] backdrop-blur-md border border-gray-600 text-white"
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

        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <a href="/oauth/google" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-google mr-2 text-red-400"></i>
            Connect Google Services
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
