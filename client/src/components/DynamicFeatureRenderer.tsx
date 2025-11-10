import React, { useState, useEffect } from 'react';
import type { UICommand } from '@shared/schema';
import { VideoAnalysisPanel } from './VideoAnalysisPanel';
import { GuidedMeditation } from './GuidedMeditation';
import { KnowledgeBaseSearch } from './KnowledgeBaseSearch';
import { SharedNotepad } from './SharedNotepad';

interface DynamicFeatureRendererProps {
  uiCommand?: UICommand | null;
  onClose?: () => void;
}

export const DynamicFeatureRenderer: React.FC<DynamicFeatureRendererProps> = ({
  uiCommand,
  onClose,
}) => {
  const [activeCommand, setActiveCommand] = useState<UICommand | null>(null);

  useEffect(() => {
    if (uiCommand) {
      setActiveCommand(uiCommand);
    }
  }, [uiCommand]);

  const handleClose = () => {
    setActiveCommand(null);
    onClose?.();
  };

  if (!activeCommand || activeCommand.action !== 'SHOW_COMPONENT') {
    return null;
  }

  // Render the appropriate component based on the command
  const renderComponent = () => {
    switch (activeCommand.componentName) {
      case 'VideoAnalysisPanel':
        // This would typically fetch analysis data first, but for now use placeholder
        return (
          <VideoAnalysisPanel
            analysis={{
              videoId: activeCommand.data?.videoId || '',
              title: 'Video Analysis',
              type: 'tutorial',
              summary: 'Loading analysis...',
              keyPoints: [],
              codeSnippets: [],
              cliCommands: [],
              actionableItems: [],
              transcriptAvailable: false,
            }}
            onClose={handleClose}
          />
        );
      
      case 'GuidedMeditation':
        return (
          <GuidedMeditation
            duration={activeCommand.data?.duration || 10}
            onClose={handleClose}
          />
        );
      
      case 'KnowledgeBaseSearch':
        return (
          <KnowledgeBaseSearch
            initialQuery={activeCommand.data?.query || ''}
            onClose={handleClose}
          />
        );
      
      case 'SharedNotepad':
        return (
          <SharedNotepad onClose={handleClose} />
        );
      
      case 'CodeSnippetCard':
        // Code snippet would be rendered inline in chat, not as a full modal
        return null;
      
      default:
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-6 max-w-lg">
              <h2 className="text-xl font-bold mb-4">Unknown Component</h2>
              <p className="text-gray-300">
                Component "{activeCommand.componentName}" is not yet implemented.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderComponent();
};
