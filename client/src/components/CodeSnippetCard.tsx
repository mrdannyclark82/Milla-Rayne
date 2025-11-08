import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import type { CodeSnippet } from '@/types/millalyzer';

interface CodeSnippetCardProps {
  snippet: CodeSnippet;
  index: number;
  className?: string;
}

/**
 * CodeSnippetCard - Display code snippet with syntax highlighting and copy functionality
 * 
 * Features:
 * - Language badge
 * - Collapsible for long code
 * - Copy to clipboard
 * - Timestamp link (if available)
 */
export function CodeSnippetCard({ snippet, index, className = '' }: CodeSnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      typescript: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      python: 'bg-green-500/20 text-green-300 border-green-500/30',
      java: 'bg-red-500/20 text-red-300 border-red-500/30',
      go: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      rust: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      php: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      bash: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      sql: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      dockerfile: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
    };
    return colors[language.toLowerCase()] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const shouldCollapse = snippet.code.split('\n').length > 10;
  const displayCode = expanded || !shouldCollapse
    ? snippet.code
    : snippet.code.split('\n').slice(0, 10).join('\n') + '\n...';

  // Map language names to Prism language identifiers
  const getPrismLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      go: 'go',
      rust: 'rust',
      cpp: 'cpp',
      'c++': 'cpp',
      php: 'php',
      bash: 'bash',
      shell: 'bash',
      sql: 'sql',
      dockerfile: 'docker',
      docker: 'docker',
      yaml: 'yaml',
      json: 'json',
      markdown: 'markdown',
    };
    return langMap[lang.toLowerCase()] || 'javascript';
  };

  return (
    <Card className={`bg-black/40 backdrop-blur-sm border-white/10 p-4 hover:border-blue-500/30 transition-colors group ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Badge className={`${getLanguageColor(snippet.language)} border text-xs`}>
            <Code className="w-3 h-3 mr-1" />
            {snippet.language}
          </Badge>
          {snippet.timestamp && (
            <span className="text-xs font-mono text-purple-300">
              [{snippet.timestamp}]
            </span>
          )}
          <span className="text-xs text-white/40">#{index + 1}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400 mr-1" />
              <span className="text-xs text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-white/60 mr-1" />
              <span className="text-xs text-white/60">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Description */}
      {snippet.description && (
        <p className="text-sm text-white/70 mb-3">{snippet.description}</p>
      )}

      {/* Code Block with Syntax Highlighting */}
      <div className="relative">
        <Highlight
          theme={themes.nightOwl}
          code={displayCode}
          language={getPrismLanguage(snippet.language)}
        >
          {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre 
              className={`${highlightClassName} bg-black/60 rounded-lg p-4 overflow-x-auto border border-white/5`}
              style={{ ...style, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell text-right pr-4 select-none opacity-40 text-xs">
                    {i + 1}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>

        {/* Expand/Collapse Button */}
        {shouldCollapse && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="absolute bottom-2 right-2 h-6 px-2 bg-black/60 hover:bg-black/80 text-white/60 hover:text-white"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                <span className="text-xs">Expand</span>
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
