import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  Brain,
  Database,
  Wrench,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ReasoningStep {
  type: 'intent' | 'tools' | 'memory' | 'response';
  title: string;
  content: string | string[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface XAIData {
  commandIntent?: string;
  toolsSelected?: string[];
  memoryFragments?: Array<{ content: string; relevance: number }>;
  responseGeneration?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
  reasoning: ReasoningStep[];
}

interface XAIOverlayProps {
  data: XAIData | null;
  onClose: () => void;
}

export const XAIOverlay: React.FC<XAIOverlayProps> = ({ data, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['intent', 'tools', 'memory', 'response'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!data) {
    return null;
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'intent':
        return <Brain className="w-4 h-4" />;
      case 'tools':
        return <Wrench className="w-4 h-4" />;
      case 'memory':
        return <Database className="w-4 h-4" />;
      case 'response':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 text-gray-100 border-gray-700">
        <CardHeader className="border-b border-gray-700 flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            XAI Transparency - Agent Reasoning
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="p-6 space-y-4">
            {/* Command Intent */}
            {data.commandIntent && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('intent')}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getIconForType('intent')}
                    <span className="font-semibold">
                      Initial Command Intent
                    </span>
                  </div>
                  {expandedSections.has('intent') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.has('intent') && (
                  <div className="p-4 bg-gray-850">
                    <p className="text-sm text-gray-300">
                      {data.commandIntent}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tools Selected */}
            {data.toolsSelected && data.toolsSelected.length > 0 && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('tools')}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getIconForType('tools')}
                    <span className="font-semibold">Tools Selected</span>
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                      {data.toolsSelected.length}
                    </span>
                  </div>
                  {expandedSections.has('tools') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.has('tools') && (
                  <div className="p-4 bg-gray-850">
                    <div className="flex flex-wrap gap-2">
                      {data.toolsSelected.map((tool, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-600/20 border border-purple-500 rounded-full text-sm text-purple-300"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Memory Fragments */}
            {data.memoryFragments && data.memoryFragments.length > 0 && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('memory')}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getIconForType('memory')}
                    <span className="font-semibold">
                      Memory Fragments Retrieved
                    </span>
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                      {data.memoryFragments.length}
                    </span>
                  </div>
                  {expandedSections.has('memory') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.has('memory') && (
                  <div className="p-4 bg-gray-850 space-y-3">
                    {data.memoryFragments.map((fragment, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-900 border border-gray-700 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            Memory {index + 1}
                          </span>
                          <span className="text-xs bg-blue-600/20 px-2 py-0.5 rounded text-blue-300">
                            Relevance: {(fragment.relevance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {fragment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Response Generation */}
            {data.responseGeneration && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('response')}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getIconForType('response')}
                    <span className="font-semibold">
                      Final Decision/Response
                    </span>
                  </div>
                  {expandedSections.has('response') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.has('response') && (
                  <div className="p-4 bg-gray-850 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-400">Model</span>
                        <p className="text-sm font-medium">
                          {data.responseGeneration.model}
                        </p>
                      </div>
                      {data.responseGeneration.tokensUsed && (
                        <div>
                          <span className="text-xs text-gray-400">
                            Tokens Used
                          </span>
                          <p className="text-sm font-medium">
                            {data.responseGeneration.tokensUsed.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {data.responseGeneration.processingTime && (
                        <div>
                          <span className="text-xs text-gray-400">
                            Processing Time
                          </span>
                          <p className="text-sm font-medium">
                            {data.responseGeneration.processingTime.toFixed(2)}
                            ms
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reasoning Steps Timeline */}
            {data.reasoning && data.reasoning.length > 0 && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-850">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-green-400" />
                  Reasoning Timeline
                </h3>
                <div className="space-y-3">
                  {data.reasoning.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          {getIconForType(step.type)}
                        </div>
                        {index < data.reasoning.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {step.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {step.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {Array.isArray(step.content) ? (
                          <ul className="text-sm text-gray-300 space-y-1">
                            {step.content.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-300">
                            {step.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
};
