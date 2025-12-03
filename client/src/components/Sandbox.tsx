import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-expect-error - react-simple-code-editor does not ship TypeScript types
// TODO: Consider adding @types/react-simple-code-editor if types become available
import Editor from 'react-simple-code-editor';
import { Highlight, themes } from 'prism-react-renderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Play,
  Code,
  Eye,
  Split,
  FolderTree,
  FileCode,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Wand2,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
} from 'lucide-react';

interface SandboxProps {
  initialCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onDiscuss?: (code: string) => void;
  width?: number;
}

interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'info';
  args: string[];
  timestamp: string;
}

interface VirtualFile {
  name: string;
  content: string;
  language: string;
}

interface GitHubNode {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

type ViewMode = 'code' | 'preview' | 'split';

// Prettier for code formatting (loaded dynamically)
// Note: Module-level caching is intentional here - Prettier is a large library
// that should only be loaded once and shared across all Sandbox instances
let prettierLoaded = false;
let prettier: any = null;
let prettierPlugins: any = {};

async function loadPrettier() {
  if (prettierLoaded) return;
  try {
    prettier = await import('prettier/standalone');
    const parserBabel = await import('prettier/plugins/babel');
    const parserHtml = await import('prettier/plugins/html');
    const parserCss = await import('prettier/plugins/postcss');
    const parserEstree = await import('prettier/plugins/estree');
    prettierPlugins = {
      babel: parserBabel,
      html: parserHtml,
      postcss: parserCss,
      estree: parserEstree,
    };
    prettierLoaded = true;
  } catch (e) {
    console.warn('Failed to load Prettier:', e);
  }
}

export const Sandbox: React.FC<SandboxProps> = ({
  initialCode = '',
  isOpen,
  onClose,
  onDiscuss,
  width,
}) => {
  // Virtual file system
  const [files, setFiles] = useState<VirtualFile[]>([
    { name: 'index.html', content: getDefaultHtml(), language: 'html' },
    { name: 'style.css', content: getDefaultCss(), language: 'css' },
    {
      name: 'script.js',
      content: initialCode || getDefaultJs(),
      language: 'javascript',
    },
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(2); // Start on script.js

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(true);

  // GitHub repo browser
  const [repoUrl, setRepoUrl] = useState('');
  const [repoNodes, setRepoNodes] = useState<GitHubNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // AI code generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // New file modal state
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewKey = useRef(0);

  // Load Prettier on mount
  useEffect(() => {
    loadPrettier();
  }, []);

  // Get current active file
  const activeFile = files[activeFileIndex];

  // Update file content
  const updateFileContent = useCallback(
    (content: string) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === activeFileIndex ? { ...f, content } : f))
      );
    },
    [activeFileIndex]
  );

  // Add new file - opens inline input
  const addNewFile = () => {
    setShowNewFileInput(true);
    setNewFileName('');
  };

  // Confirm new file creation
  const confirmNewFile = () => {
    if (!newFileName.trim()) {
      setShowNewFileInput(false);
      return;
    }

    const extension = newFileName.split('.').pop()?.toLowerCase() || 'js';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      html: 'html',
      css: 'css',
      json: 'json',
    };

    setFiles((prev) => [
      ...prev,
      {
        name: newFileName.trim(),
        content: '',
        language: languageMap[extension] || 'javascript',
      },
    ]);
    setActiveFileIndex(files.length);
    setShowNewFileInput(false);
    setNewFileName('');
  };

  // Delete file
  const deleteFile = (index: number) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  // Format code with Prettier
  const formatCode = async () => {
    if (!prettierLoaded || !prettier) {
      console.warn('Prettier not loaded');
      return;
    }

    try {
      const file = files[activeFileIndex];
      let parser = 'babel';
      if (file.language === 'html') parser = 'html';
      else if (file.language === 'css') parser = 'css';
      else if (file.language === 'json') parser = 'json';

      const formatted = await prettier.format(file.content, {
        parser,
        plugins: Object.values(prettierPlugins),
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });

      updateFileContent(formatted);
    } catch (e) {
      console.error('Format error:', e);
    }
  };

  // Run the code in preview
  const runCode = useCallback(() => {
    previewKey.current++;
    setConsoleLogs([]);

    const htmlFile = files.find((f) => f.name.endsWith('.html'));
    const cssFile = files.find((f) => f.name.endsWith('.css'));
    const jsFiles = files.filter(
      (f) => f.name.endsWith('.js') || f.name.endsWith('.jsx')
    );

    // Build console interception script
    const consoleScript = `
      <script>
        (function() {
          const originalConsole = { ...console };
          ['log', 'error', 'warn', 'info'].forEach(level => {
            console[level] = (...args) => {
              originalConsole[level](...args);
              window.parent.postMessage({
                type: 'console',
                level,
                args: args.map(a => {
                  try { return JSON.stringify(a); }
                  catch { return String(a); }
                }),
                timestamp: new Date().toISOString()
              }, '*');
            };
          });
          window.onerror = (msg, url, line, col, error) => {
            window.parent.postMessage({
              type: 'console',
              level: 'error',
              args: [msg + ' at line ' + line + ':' + col],
              timestamp: new Date().toISOString()
            }, '*');
          };
        })();
      </script>
    `;

    // Combine all JS files
    const jsContent = jsFiles.map((f) => f.content).join('\n\n');

    // Build full HTML
    let fullHtml =
      htmlFile?.content ||
      `<!DOCTYPE html><html><head></head><body></body></html>`;

    // Inject CSS
    if (cssFile) {
      fullHtml = fullHtml.replace(
        '</head>',
        `<style>${cssFile.content}</style></head>`
      );
    }

    // Inject console interception + JS
    fullHtml = fullHtml.replace(
      '</body>',
      `${consoleScript}<script>${jsContent}</script></body>`
    );

    if (iframeRef.current) {
      iframeRef.current.srcdoc = fullHtml;
    }
  }, [files]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: event.data.level,
            args: event.data.args,
            timestamp: event.data.timestamp,
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch GitHub repo contents
  const fetchRepoContents = async (path = '') => {
    if (!repoUrl) return;

    // Parse owner/repo from URL
    const match = repoUrl.match(
      /github\.com\/([^/]+)\/([^/\s]+)/i
    );
    if (!match) {
      setRepoError('Invalid GitHub URL format');
      return;
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    setLoadingRepo(true);
    setRepoError(null);

    try {
      const response = await fetch('/api/repo/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: repoName, path }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const nodes: GitHubNode[] = await response.json();
      setRepoNodes(nodes);
    } catch (e) {
      setRepoError(e instanceof Error ? e.message : 'Failed to fetch repo');
    } finally {
      setLoadingRepo(false);
    }
  };

  // Fetch file content from GitHub
  const fetchFileContent = async (node: GitHubNode) => {
    if (node.type !== 'blob' || !node.url) return;

    try {
      const response = await fetch(node.url);
      if (!response.ok) throw new Error('Failed to fetch file');

      const content = await response.text();
      const extension = node.path.split('.').pop()?.toLowerCase() || 'txt';
      const languageMap: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        jsx: 'javascript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        py: 'python',
      };

      // Add to files
      setFiles((prev) => [
        ...prev,
        {
          name: node.path.split('/').pop() || node.path,
          content,
          language: languageMap[extension] || 'plaintext',
        },
      ]);
      setActiveFileIndex(files.length);
    } catch (e) {
      console.error('Failed to fetch file:', e);
    }
  };

  // AI Code Generation
  const generateCode = async () => {
    if (!aiPrompt.trim()) return;

    setGeneratingCode(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate code for: ${aiPrompt}\n\nContext: Current file is ${activeFile.name} (${activeFile.language}). Respond with just the code, no explanations.`,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      const generatedCode = data.response || '';

      // Extract code from markdown code blocks if present
      const codeMatch = generatedCode.match(/```[\w]*\n?([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[1].trim() : generatedCode.trim();

      if (code) {
        updateFileContent(activeFile.content + '\n\n' + code);
      }

      setAiPrompt('');
    } catch (e) {
      console.error('AI generation error:', e);
    } finally {
      setGeneratingCode(false);
    }
  };

  // Syntax highlighting for editor
  const highlightCode = (code: string) => {
    const language = activeFile?.language || 'javascript';
    return (
      <Highlight
        theme={themes.nightOwl}
        code={code}
        language={language === 'plaintext' ? 'javascript' : language}
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </>
        )}
      </Highlight>
    );
  };

  // Discuss code with Milla
  const handleDiscuss = () => {
    if (onDiscuss && activeFile) {
      onDiscuss(activeFile.content);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-4 z-50 flex flex-col bg-gray-900/95 backdrop-blur-lg rounded-xl border border-purple-500/30 shadow-2xl overflow-hidden"
      style={{ width: width ? `${width}px` : undefined }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Code Sandbox</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-black/40 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('code')}
              className={`px-3 py-1 ${viewMode === 'code' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60'}`}
            >
              <FileCode className="w-4 h-4 mr-1" />
              Code
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 ${viewMode === 'split' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60'}`}
            >
              <Split className="w-4 h-4 mr-1" />
              Split
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 ${viewMode === 'preview' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60'}`}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={runCode}
            className="text-green-400 hover:bg-green-500/20"
            title="Run code"
          >
            <Play className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={formatCode}
            className="text-blue-400 hover:bg-blue-500/20"
            title="Format code"
          >
            <Wand2 className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiscuss}
            className="text-purple-400 hover:bg-purple-500/20"
            title="Discuss with Milla"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-56 border-r border-white/10 bg-black/20 flex flex-col">
          {/* File tabs */}
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60 uppercase tracking-wider">
                Files
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={addNewFile}
                className="w-6 h-6 text-white/60 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-32">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer group ${
                    index === activeFileIndex
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                  onClick={() => setActiveFileIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  {files.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(index);
                      }}
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              {/* Inline new file input */}
              {showNewFileInput && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <File className="w-4 h-4 text-green-400" />
                  <Input
                    autoFocus
                    placeholder="filename.js"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmNewFile();
                      if (e.key === 'Escape') setShowNewFileInput(false);
                    }}
                    onBlur={confirmNewFile}
                    className="h-6 text-xs bg-black/40 border-purple-500/50 text-white px-2"
                  />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* GitHub Repo Browser */}
          <div className="flex-1 p-2 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="w-4 h-4 text-white/60" />
              <span className="text-xs text-white/60 uppercase tracking-wider">
                GitHub
              </span>
            </div>

            <div className="flex gap-1 mb-2">
              <Input
                placeholder="github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="text-xs h-7 bg-black/40 border-white/10 text-white"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchRepoContents()}
                disabled={loadingRepo}
                className="w-7 h-7 text-white/60 hover:text-white"
              >
                {loadingRepo ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            </div>

            {repoError && (
              <p className="text-xs text-red-400 mb-2">{repoError}</p>
            )}

            <ScrollArea className="flex-1">
              {repoNodes.map((node) => (
                <div
                  key={node.sha}
                  className="flex items-center gap-2 px-2 py-1 text-sm text-white/70 hover:bg-white/5 rounded cursor-pointer"
                  onClick={() =>
                    node.type === 'blob'
                      ? fetchFileContent(node)
                      : fetchRepoContents(node.path)
                  }
                >
                  {node.type === 'tree' ? (
                    <Folder className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <File className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="truncate">
                    {node.path.split('/').pop()}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* AI Code Generation */}
          <div className="p-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/60 uppercase tracking-wider">
                AI Generate
              </span>
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Describe code to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateCode()}
                className="text-xs h-7 bg-black/40 border-white/10 text-white"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={generateCode}
                disabled={generatingCode}
                className="w-7 h-7 text-purple-400 hover:bg-purple-500/20"
              >
                {generatingCode ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`flex-1 flex ${viewMode === 'split' ? 'flex-row' : 'flex-col'} overflow-hidden`}
          >
            {/* Code Editor */}
            {(viewMode === 'code' || viewMode === 'split') && (
              <div
                className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden border-r border-white/10`}
              >
                <div className="px-3 py-2 border-b border-white/10 bg-black/20 flex items-center justify-between">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {activeFile?.name}
                  </Badge>
                  <span className="text-xs text-white/40">
                    {activeFile?.language}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <Editor
                    value={activeFile?.content || ''}
                    onValueChange={updateFileContent}
                    highlight={highlightCode}
                    padding={16}
                    style={{
                      fontFamily: '"Fira Code", "Fira Mono", monospace',
                      fontSize: 14,
                      minHeight: '100%',
                      backgroundColor: 'transparent',
                    }}
                    className="min-h-full text-white"
                  />
                </ScrollArea>
              </div>
            )}

            {/* Preview */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div
                className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden`}
              >
                <div className="px-3 py-2 border-b border-white/10 bg-black/20 flex items-center justify-between">
                  <span className="text-sm text-white/70">Preview</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={runCode}
                    className="h-6 px-2 text-xs text-green-400 hover:bg-green-500/20"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    key={previewKey.current}
                    ref={iframeRef}
                    title="Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Console */}
          {showConsole && (
            <div className="h-40 border-t border-white/10 bg-black/40 flex flex-col">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm text-white/70">Console</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConsoleLogs([])}
                  className="h-6 px-2 text-xs text-white/60 hover:text-white"
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="flex-1 p-2">
                {consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`font-mono text-xs py-0.5 ${
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'warn'
                          ? 'text-yellow-400'
                          : log.level === 'info'
                            ? 'text-blue-400'
                            : 'text-white/80'
                    }`}
                  >
                    <span className="text-white/40 mr-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.args.join(' ')}
                  </div>
                ))}
                {consoleLogs.length === 0 && (
                  <p className="text-white/40 text-xs">
                    Console output will appear here...
                  </p>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Default file contents
function getDefaultHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandbox</title>
</head>
<body>
  <div id="app">
    <h1>Hello, Milla!</h1>
    <p>Edit the code to see changes.</p>
  </div>
</body>
</html>`;
}

function getDefaultCss() {
  return `body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  min-height: 100vh;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  background: linear-gradient(90deg, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`;
}

function getDefaultJs() {
  return `// Welcome to the Sandbox!
// Write your JavaScript code here

console.log('Hello from the Sandbox!');

// Example: Add interactivity
document.querySelector('h1').addEventListener('click', () => {
  console.log('Title clicked!');
  alert('You clicked the title!');
});`;
}

export default Sandbox;
