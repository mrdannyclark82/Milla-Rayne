import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  BookOpen,
  Code,
  Terminal,
  Filter,
  TrendingUp,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react';
import type {
  YoutubeKnowledge,
  KnowledgeBaseStats,
  SearchKnowledgeParams,
} from '@/types/millalyzer';

interface KnowledgeBaseSearchProps {
  onSelectVideo?: (video: YoutubeKnowledge) => void;
  initialQuery?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * KnowledgeBaseSearch - Search and browse analyzed videos
 *
 * Features:
 * - Full-text search across videos
 * - Filter by type, tags, content
 * - Statistics dashboard
 * - Quick access to code/commands
 */
export function KnowledgeBaseSearch({
  onSelectVideo,
  initialQuery = '',
  onClose,
  className = '',
}: KnowledgeBaseSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<YoutubeKnowledge[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'stats'>('search');
  const [filters, setFilters] = useState<SearchKnowledgeParams>({});

  useEffect(() => {
    fetchStats();
    // Auto-search if initialQuery provided
    if (initialQuery) {
      handleSearch();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/youtube/knowledge/stats');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch knowledge base stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (filters.videoType) params.set('videoType', filters.videoType);
      if (filters.hasCode) params.set('hasCode', 'true');
      if (filters.hasCommands) params.set('hasCommands', 'true');

      const response = await fetch(`/api/youtube/knowledge?${params}`);
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card
      className={`bg-[#0f0f1a]/98 backdrop-blur-lg border-cyan-500/20 ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-xl text-white">Knowledge Base</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <Badge
                variant="outline"
                className="border-cyan-500/30 text-cyan-300"
              >
                {stats.totalVideos} videos
              </Badge>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-purple-300 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-blue-300 border-b-2 border-blue-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Stats
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search videos, code, commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, videoType: 'tutorial' })
                }
                className={`border-blue-500/30 text-blue-300 ${
                  filters.videoType === 'tutorial' ? 'bg-blue-500/20' : ''
                }`}
              >
                Tutorials
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilters({ ...filters, hasCode: true })}
                className={`border-green-500/30 text-green-300 ${
                  filters.hasCode ? 'bg-green-500/20' : ''
                }`}
              >
                <Code className="w-3 h-3 mr-1" />
                Has Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilters({ ...filters, hasCommands: true })}
                className={`border-purple-500/30 text-purple-300 ${
                  filters.hasCommands ? 'bg-purple-500/20' : ''
                }`}
              >
                <Terminal className="w-3 h-3 mr-1" />
                Has Commands
              </Button>
              {Object.keys(filters).length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilters({})}
                  className="text-white/60 hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results */}
            <ScrollArea className="h-[500px]">
              {results.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {results.map((video) => (
                    <VideoResultCard
                      key={video.id}
                      video={video}
                      onSelect={onSelectVideo}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Search className="w-12 h-12 mb-4" />
                  <p className="text-sm">
                    {query || Object.keys(filters).length > 0
                      ? 'No results found'
                      : 'Enter a search query'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  icon={<BookOpen className="w-4 h-4" />}
                  label="Videos"
                  value={stats.totalVideos}
                  color="purple"
                />
                <StatCard
                  icon={<Code className="w-4 h-4" />}
                  label="Code Snippets"
                  value={stats.totalCodeSnippets}
                  color="blue"
                />
                <StatCard
                  icon={<Terminal className="w-4 h-4" />}
                  label="Commands"
                  value={stats.totalCLICommands}
                  color="green"
                />
                <StatCard
                  icon={<Tag className="w-4 h-4" />}
                  label="Tags"
                  value={stats.topTags.length}
                  color="orange"
                />
              </div>

              {/* By Type */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white/80 mb-2">
                  By Type
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-white/5 rounded p-2"
                    >
                      <span className="text-sm text-white/70 capitalize">
                        {type}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-white/20 text-white/60"
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Languages */}
              {stats.topLanguages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-2">
                    Top Languages
                  </h4>
                  <div className="space-y-2">
                    {stats.topLanguages.slice(0, 5).map((lang, index) => (
                      <div
                        key={lang.language}
                        className="flex items-center justify-between bg-white/5 rounded p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-300">
                            #{index + 1}
                          </span>
                          <span className="text-sm text-white/70">
                            {lang.language}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-purple-500/30 text-purple-300"
                        >
                          {lang.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tags */}
              {stats.topTags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white/80 mb-2">
                    Popular Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.tag}
                        variant="outline"
                        className="border-blue-500/30 text-blue-300"
                      >
                        {tag.tag} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Videos */}
              {stats.recentVideos.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recently Analyzed
                  </h4>
                  <div className="space-y-2">
                    {stats.recentVideos.slice(0, 5).map((video) => (
                      <div
                        key={video.videoId}
                        className="bg-white/5 rounded p-2 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-white/80 line-clamp-1">
                          {video.title}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(video.analyzedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VideoResultCard({
  video,
  onSelect,
}: {
  video: YoutubeKnowledge;
  onSelect?: (video: YoutubeKnowledge) => void;
}) {
  return (
    <div
      onClick={() => onSelect?.(video)}
      className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white line-clamp-2 flex-1">
          {video.title}
        </h4>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border">
          {video.videoType}
        </Badge>
      </div>

      {video.summary && (
        <p className="text-xs text-white/60 mb-2 line-clamp-2">
          {video.summary}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {video.codeSnippets.length > 0 && (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-300 text-xs"
          >
            <Code className="w-3 h-3 mr-1" />
            {video.codeSnippets.length}
          </Badge>
        )}
        {video.cliCommands.length > 0 && (
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-300 text-xs"
          >
            <Terminal className="w-3 h-3 mr-1" />
            {video.cliCommands.length}
          </Badge>
        )}
        {video.tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-white/20 text-white/50 text-xs"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    green: 'border-green-500/30 bg-green-500/10 text-green-300',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  };

  return (
    <div
      className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.purple}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
