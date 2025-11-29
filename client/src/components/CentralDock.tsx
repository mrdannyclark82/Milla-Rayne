import React from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Video,
  BookOpen,
  Settings,
  Sparkles,
  Youtube,
} from 'lucide-react';

interface CentralDockProps {
  onToggleSharedNotepad: () => void;
  onShowVideoAnalysis?: () => void;
  onShowKnowledgeBase?: () => void;
  onShowSettings?: () => void;
  onShowFeatures?: () => void;
  onShowYoutubeMemories?: () => void;
}

export const CentralDock: React.FC<CentralDockProps> = ({
  onToggleSharedNotepad,
  onShowVideoAnalysis,
  onShowKnowledgeBase,
  onShowSettings,
  onShowFeatures,
  onShowYoutubeMemories,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-full px-4 py-2 shadow-lg shadow-purple-500/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSharedNotepad}
          className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
          title="Shared Notepad"
        >
          <FileText className="h-5 w-5" />
        </Button>

        {onShowVideoAnalysis && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowVideoAnalysis}
            className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
            title="Video Analysis"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}

        {onShowKnowledgeBase && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowKnowledgeBase}
            className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
            title="Knowledge Base"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        )}

        {onShowYoutubeMemories && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowYoutubeMemories}
            className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
            title="YouTube Memories"
          >
            <Youtube className="h-5 w-5" />
          </Button>
        )}

        {onShowFeatures && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowFeatures}
            className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
            title="Features"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        )}

        {onShowSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowSettings}
            className="hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
