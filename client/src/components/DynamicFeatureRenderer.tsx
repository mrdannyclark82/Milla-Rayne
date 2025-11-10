import React, { useState, useEffect } from 'react';
import type { UICommand } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Video, Heart, Search, FileText } from 'lucide-react';

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

  const getIcon = () => {
    switch (activeCommand.componentName) {
      case 'VideoAnalysisPanel':
        return <Video className="w-6 h-6" />;
      case 'GuidedMeditation':
        return <Heart className="w-6 h-6" />;
      case 'KnowledgeBaseSearch':
        return <Search className="w-6 h-6" />;
      case 'SharedNotepad':
        return <FileText className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeCommand.componentName) {
      case 'VideoAnalysisPanel':
        return 'Video Analysis';
      case 'GuidedMeditation':
        return 'Guided Meditation';
      case 'KnowledgeBaseSearch':
        return 'Knowledge Base Search';
      case 'SharedNotepad':
        return 'Shared Notepad';
      default:
        return 'Feature';
    }
  };

  const getDescription = () => {
    const reason = activeCommand.metadata?.reason || 'No reason provided';
    const data = activeCommand.data || {};
    
    return (
      <div className="space-y-2">
        <p className="text-gray-300">{reason}</p>
        {Object.keys(data).length > 0 && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Command Data:</p>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-900 text-gray-100 border-gray-700">
        <CardHeader className="border-b border-gray-700 flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {getDescription()}
          
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Agent-Driven UI Activated!</strong> This demonstrates that the agent has 
              detected your intent and triggered the appropriate UI component. In a full implementation, 
              the actual component would be rendered here.
            </p>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
