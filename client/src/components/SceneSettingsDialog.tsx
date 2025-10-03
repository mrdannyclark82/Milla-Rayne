/**
 * Scene Settings Dialog - Standalone settings for adaptive scene
 * Minimal version that doesn't depend on other complex components
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SceneSettingsPanel } from './scene/SceneSettingsPanel';

interface SceneSettingsDialogProps {
  children: React.ReactNode;
}

export const SceneSettingsDialog: React.FC<SceneSettingsDialogProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Scene Settings</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <SceneSettingsPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
};
