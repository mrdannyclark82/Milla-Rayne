import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Highlight, themes } from 'prism-react-renderer';
import {
  Clock,
  Code,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { CodeSnippetCard } from './CodeSnippetCard';
import type {
  VideoAnalysis,
  KeyPoint,
  ActionableItem,
} from '@/types/millalyzer';

interface VideoAnalysisPanelProps {
  analysis: VideoAnalysis;
  onClose?: () => void;
  onSaveToKnowledge?: () => void;
  className?: string;
}

/**
 * VideoAnalysisPanel - Display millAlyzer video analysis results
 *
 * Shows comprehensive video analysis including:
 * - Video metadata and summary
 * - Key points with timestamps
 * - Code snippets (copyable)
 * - CLI commands (copyable)
 * - Actionable items
 */
export function VideoAnalysisPanel({
  analysis,
  onClose,
  onSaveToKnowledge,
  className = '',
}: VideoAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'code' | 'commands' | 'steps'
  >('overview');

  const getTypeColor = (type: string) => {
    const colors = {
      tutorial: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      news: 'bg-green-500/20 text-green-300 border-green-500/30',
      discussion: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      entertainment: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getImportanceIcon = (importance: string) => {
    if (importance === 'high')
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (importance === 'medium')
      return <Info className="w-4 h-4 text-yellow-400" />;
    return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return timestamp.replace(/^0+/, '');
  };

  return (
    <Card
      className={`bg-black/40 backdrop-blur-lg border-white/10 ${className}`}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-xl text-white">
              millAlyzer Analysis
            </CardTitle>
          </div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">
            {analysis.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getTypeColor(analysis.type)} border`}>
              {analysis.type}
            </Badge>
            {analysis.transcriptAvailable && (
              <Badge
                variant="outline"
                className="border-green-500/30 text-green-300"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Transcript
              </Badge>
            )}
            {analysis.codeSnippets.length > 0 && (
              <Badge
                variant="outline"
                className="border-blue-500/30 text-blue-300"
              >
                <Code className="w-3 h-3 mr-1" />
                {analysis.codeSnippets.length} snippets
              </Badge>
            )}
            {analysis.cliCommands.length > 0 && (
              <Badge
                variant="outline"
                className="border-purple-500/30 text-purple-300"
              >
                <Terminal className="w-3 h-3 mr-1" />
                {analysis.cliCommands.length} commands
              </Badge>
            )}
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-white/80 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-purple-300 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Overview
          </button>
          {analysis.codeSnippets.length > 0 && (
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'text-blue-300 border-b-2 border-blue-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Code ({analysis.codeSnippets.length})
            </button>
          )}
          {analysis.cliCommands.length > 0 && (
            <button
              onClick={() => setActiveTab('commands')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'commands'
                  ? 'text-purple-300 border-b-2 border-purple-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Commands ({analysis.cliCommands.length})
            </button>
          )}
          {analysis.actionableItems.length > 0 && (
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'steps'
                  ? 'text-green-300 border-b-2 border-green-400'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Steps ({analysis.actionableItems.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-4 pr-4">
              <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Key Points ({analysis.keyPoints.length})
              </h4>
              <div className="space-y-3">
                {analysis.keyPoints.map((point: KeyPoint, index: number) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {getImportanceIcon(point.importance)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {point.timestamp && (
                            <span className="text-xs font-mono text-purple-300">
                              [{formatTimestamp(point.timestamp)}]
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/90">{point.point}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 pr-4">
              {analysis.codeSnippets.map((snippet, index) => (
                <CodeSnippetCard key={index} snippet={snippet} index={index} />
              ))}
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3 pr-4">
              {analysis.cliCommands.map((cmd, index) => (
                <CLICommandCard key={index} command={cmd} index={index} />
              ))}
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-3 pr-4">
              {analysis.actionableItems.map(
                (item: ActionableItem, index: number) => (
                  <ActionableItemCard key={index} item={item} index={index} />
                )
              )}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <Separator className="bg-white/10" />
        <div className="flex gap-2 justify-end">
          {onSaveToKnowledge && (
            <Button
              onClick={onSaveToKnowledge}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Save to Knowledge Base
            </Button>
          )}
          <Button
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
            onClick={() =>
              window.open(
                `https://youtube.com/watch?v=${analysis.videoId}`,
                '_blank'
              )
            }
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Watch on YouTube
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CLICommandCard - Display a single CLI command with copy functionality and syntax highlighting
 */
function CLICommandCard({ command, index }: { command: any; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      linux: 'text-orange-300',
      mac: 'text-blue-300',
      windows: 'text-cyan-300',
      all: 'text-green-300',
    };
    return colors[platform as keyof typeof colors] || colors.all;
  };

  return (
    <div className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span
            className={`text-xs font-semibold ${getPlatformColor(command.platform)}`}
          >
            {command.platform.toUpperCase()}
          </span>
          {command.timestamp && (
            <span className="text-xs font-mono text-white/40">
              [{command.timestamp}]
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-white/60" />
          )}
        </Button>
      </div>
      <Highlight theme={themes.nightOwl} code={command.command} language="bash">
        {({
          className,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        }: {
          className?: string;
          style?: React.CSSProperties;
          tokens: any[][];
          getLineProps: (props: {
            line: any;
            key?: number;
          }) => React.HTMLAttributes<HTMLDivElement>;
          getTokenProps: (props: {
            token: any;
            key?: number;
          }) => React.HTMLAttributes<HTMLSpanElement>;
        }) => (
          <pre
            className={`${className} text-sm font-mono block bg-black/60 rounded px-3 py-2 mb-2 overflow-x-auto`}
            style={{ ...style, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            {tokens.map((line: any[], i: number) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token: any, key: number) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      {command.description && (
        <p className="text-xs text-white/60">{command.description}</p>
      )}
    </div>
  );
}

/**
 * ActionableItemCard - Display actionable step from tutorial
 */
function ActionableItemCard({
  item,
  index,
}: {
  item: ActionableItem;
  index: number;
}) {
  const getTypeIcon = (type: string) => {
    if (type === 'warning')
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    if (type === 'tip') return <Info className="w-4 h-4 text-blue-400" />;
    if (type === 'resource')
      return <ExternalLink className="w-4 h-4 text-purple-400" />;
    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getTypeIcon(item.type)}</div>
        <div className="flex-1">
          {item.order !== undefined && (
            <span className="text-xs font-semibold text-purple-300 mb-1 block">
              Step {item.order}
            </span>
          )}
          <p className="text-sm text-white/90">{item.content}</p>
          {item.dependencies && item.dependencies.length > 0 && (
            <div className="mt-2 text-xs text-white/50">
              Dependencies: {item.dependencies.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
