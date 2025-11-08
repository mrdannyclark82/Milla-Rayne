import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Newspaper,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  TrendingUp,
  Code2,
  Cloud,
  Database,
  Shield,
  Briefcase,
  Cpu,
} from 'lucide-react';
import type { DailyNewsDigest, NewsItem } from '@/types/millalyzer';

interface DailyNewsDigestProps {
  digest: DailyNewsDigest;
  onAnalyzeVideo?: (videoId: string) => void;
  onWatchVideo?: (videoId: string) => void;
  className?: string;
}

/**
 * DailyNewsDigest - Display daily tech news from YouTube
 * 
 * Features:
 * - Categorized news items
 * - Top stories section
 * - Quick actions (analyze, watch)
 * - Collapsible categories
 */
export function DailyNewsDigest({
  digest,
  onAnalyzeVideo,
  onWatchVideo,
  className = '',
}: DailyNewsDigestProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'AI & Machine Learning': <Cpu className="w-4 h-4" />,
      'Web Development': <Code2 className="w-4 h-4" />,
      'DevOps & Cloud': <Cloud className="w-4 h-4" />,
      'Programming Languages': <Code2 className="w-4 h-4" />,
      'Data Science': <Database className="w-4 h-4" />,
      'Security & Privacy': <Shield className="w-4 h-4" />,
      'Tech Industry': <Briefcase className="w-4 h-4" />,
    };
    return icons[category] || <Newspaper className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'AI & Machine Learning': 'border-purple-500/30 bg-purple-500/10',
      'Web Development': 'border-blue-500/30 bg-blue-500/10',
      'DevOps & Cloud': 'border-cyan-500/30 bg-cyan-500/10',
      'Programming Languages': 'border-green-500/30 bg-green-500/10',
      'Data Science': 'border-orange-500/30 bg-orange-500/10',
      'Security & Privacy': 'border-red-500/30 bg-red-500/10',
      'Tech Industry': 'border-yellow-500/30 bg-yellow-500/10',
    };
    return colors[category] || 'border-gray-500/30 bg-gray-500/10';
  };

  return (
    <Card className={`bg-black/40 backdrop-blur-lg border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-xl text-white">Daily Tech News</CardTitle>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-300">
            {digest.date}
          </Badge>
        </div>
        <p className="text-sm text-white/60 mt-2">
          Found {digest.totalVideos} new videos across {Object.keys(digest.categories).length} categories
          {digest.analysisCount > 0 && (
            <span className="text-purple-300"> • {digest.analysisCount} auto-analyzed</span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Stories */}
        {digest.topStories.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Top Stories
            </h3>
            <div className="space-y-2">
              {digest.topStories.slice(0, 5).map((story, index) => (
                <NewsItemCard
                  key={story.videoId}
                  item={story}
                  index={index}
                  onAnalyze={onAnalyzeVideo}
                  onWatch={onWatchVideo}
                  isTopStory
                />
              ))}
            </div>
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Categories */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {Object.entries(digest.categories).map(([category, items]) => (
              <div key={category} className={`rounded-lg border ${getCategoryColor(category)}`}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="font-semibold text-white">{category}</span>
                    <Badge variant="outline" className="border-white/20 text-white/60">
                      {items.length}
                    </Badge>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>

                {expandedCategories.has(category) && (
                  <div className="px-4 pb-4 space-y-2">
                    {items.map((item, index) => (
                      <NewsItemCard
                        key={item.videoId}
                        item={item}
                        index={index}
                        onAnalyze={onAnalyzeVideo}
                        onWatch={onWatchVideo}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * NewsItemCard - Display individual news item
 */
interface NewsItemCardProps {
  item: NewsItem;
  index: number;
  onAnalyze?: (videoId: string) => void;
  onWatch?: (videoId: string) => void;
  isTopStory?: boolean;
}

function NewsItemCard({ item, index, onAnalyze, onWatch, isTopStory }: NewsItemCardProps) {
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors group">
      <div className="flex gap-3">
        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="flex-shrink-0">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-24 h-16 object-cover rounded"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white line-clamp-2 flex-1">
              {isTopStory && (
                <span className="text-orange-400 mr-1">#{index + 1}</span>
              )}
              {item.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
            <span>{item.channel}</span>
            <span>•</span>
            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
            {item.relevanceScore !== undefined && (
              <>
                <span>•</span>
                <span className="text-purple-300">Score: {item.relevanceScore}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onWatch && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onWatch(item.videoId)}
                className="h-6 px-2 text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
              >
                <Play className="w-3 h-3 mr-1" />
                Watch
              </Button>
            )}
            {onAnalyze && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAnalyze(item.videoId)}
                className="h-6 px-2 text-xs text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Analyze
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
