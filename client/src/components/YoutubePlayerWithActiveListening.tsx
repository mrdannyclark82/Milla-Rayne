import React, { useEffect, useRef, useState } from 'react';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
}

interface YoutubePlayerProps {
  videoId?: string;
  videos?: Video[];
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
  onAnalyzeVideo?: (videoId: string) => void;
  activeListeningEnabled?: boolean;
  onInsightDetected?: (insight: any) => void;
}

interface ListeningInsight {
  timestamp: number;
  videoTime: number;
  content: string;
  category: 'technical' | 'relationship' | 'general';
  relevance: 'high' | 'medium' | 'low';
  suggestedAction?: string;
  transcriptText?: string;
}

export function YoutubePlayerWithActiveListening({
  videoId,
  videos,
  onClose,
  onSelectVideo,
  onAnalyzeVideo,
  activeListeningEnabled = true,
  onInsightDetected,
}: YoutubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [showFeed, setShowFeed] = useState(!videoId && videos && videos.length > 0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 300 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isListening, setIsListening] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<ListeningInsight | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{ title: string; channel: string } | null>(null);
  const [pausePoints, setPausePoints] = useState<number[]>([]);
  const [insightCount, setInsightCount] = useState(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🎬 YoutubePlayer rendering with videoId:', videoId, 'videos:', videos?.length);

  // Initialize YouTube player API
  useEffect(() => {
    if (!videoId) return;

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      if (iframeRef.current) {
        playerRef.current = new (window as any).YT.Player(iframeRef.current, {
          videoId: videoId,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [videoId]);

  const onPlayerReady = (event: any) => {
    console.log('🎬 YouTube player ready');
    fetchVideoInfo();
    if (activeListeningEnabled) {
      startActiveListening();
    }
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    // 1 = playing, 2 = paused
    if (state === 1) {
      setIsPaused(false);
    } else if (state === 2) {
      setIsPaused(true);
    }
  };

  const fetchVideoInfo = async () => {
    if (!videoId) return;
    
    try {
      const response = await fetch(`/api/youtube/videos/${videoId}`);
      const data = await response.json();
      if (data.success && data.video) {
        setVideoInfo({
          title: data.video.title || 'Unknown Title',
          channel: data.video.channel || 'Unknown Channel',
        });
      }
    } catch (error) {
      console.error('Failed to fetch video info:', error);
    }
  };

  const startActiveListening = async () => {
    if (!videoId || isListening || !videoInfo) return;

    try {
      const response = await fetch('/api/active-listening/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId,
          videoContext: videoInfo 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsListening(true);
        setPausePoints(data.pausePoints || []);
        setInsightCount(data.insightCount || 0);
        console.log(`🎧 Active listening started - ${data.insightCount} insights at:`, data.pausePoints);
        
        // Check for pause points every 1 second (more frequent for precision)
        checkIntervalRef.current = setInterval(() => {
          checkForPause();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to start active listening:', error);
    }
  };

  const stopActiveListening = async () => {
    try {
      await fetch('/api/active-listening/stop', {
        method: 'POST',
      });
      
      setIsListening(false);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      console.log('🎧 Active listening stopped');
    } catch (error) {
      console.error('Failed to stop active listening:', error);
    }
  };

  const checkForPause = async () => {
    if (!playerRef.current || !videoId || isPaused) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      
      const response = await fetch('/api/active-listening/check-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime }),
      });

      const data = await response.json();
      
      if (data.success && data.insight && data.shouldPause) {
        // Pause the video
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
        
        setCurrentInsight(data.insight);
        setIsPaused(true);
        
        if (onInsightDetected) {
          onInsightDetected(data.insight);
        }
        
        console.log('🎧 Paused at', currentTime, 'for insight:', data.insight.category);
      }
    } catch (error) {
      console.error('Error checking for pause:', error);
    }
  };

  const handleContinueVideo = () => {
    setCurrentInsight(null);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const handleSaveInsight = async () => {
    if (!currentInsight || !videoId || !videoInfo) return;

    try {
      await fetch('/api/active-listening/save-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insight: currentInsight,
          videoId,
          videoTitle: videoInfo.title,
        }),
      });
      
      alert('Insight saved to memory!');
      handleContinueVideo();
    } catch (error) {
      console.error('Failed to save insight:', error);
    }
  };

  useEffect(() => {
    console.log('🎬 YoutubePlayer mounted');

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('🎬 Escape key pressed, closing player');
        if (isListening) {
          stopActiveListening();
        }
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isListening) {
        stopActiveListening();
      }
      console.log('🎬 YoutubePlayer unmounted');
    };
  }, [onClose, isListening]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'BUTTON') {
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleVideoSelect = (id: string) => {
    if (isListening) {
      stopActiveListening();
    }
    setShowFeed(false);
    onSelectVideo?.(id);
  };

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`
    : '';

  return (
    <>
      <div
        className="fixed z-50 bg-gray-900 rounded-lg shadow-2xl overflow-hidden border-2 border-purple-500/30"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: showFeed ? '380px' : '400px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        role="dialog"
        aria-modal="true"
        aria-label="YouTube player"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-white font-semibold text-sm">YouTube</span>
            {isListening && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="animate-pulse">🎧</span> Listening
              </span>
            )}
            {insightCount > 0 && (
              <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                {insightCount} insights
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {videoId && onAnalyzeVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyzeVideo(videoId);
                }}
                className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors flex items-center gap-1"
                title="Analyze this video"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyze
              </button>
            )}
            {videos && videos.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeed(!showFeed);
                }}
                className="text-white hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
                title={showFeed ? 'Show player' : 'Show feed'}
              >
                {showFeed ? '▶️' : '📋'}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isListening) {
                  stopActiveListening();
                }
                onClose();
              }}
              className="text-white hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-lg transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        {showFeed && videos ? (
          <div className="bg-gray-800 max-h-[400px] overflow-y-auto">
            {videos.map((video, index) => (
              <div
                key={video.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoSelect(video.id);
                }}
                className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 transition-colors"
              >
                <div className="flex gap-3">
                  {video.thumbnail && (
                    <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                      {index + 1}. {video.title}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{video.channel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videoId ? (
          <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
            <div id="youtube-player" ref={iframeRef} className="absolute top-0 left-0 w-full h-full"></div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">No video selected</div>
        )}
      </div>

      {/* Insight Overlay */}
      {currentInsight && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border-2 border-purple-500">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">
                {currentInsight.category === 'technical' ? '💡' : currentInsight.category === 'relationship' ? '💖' : '✨'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {currentInsight.category === 'technical' ? 'Technical Insight' : 
                   currentInsight.category === 'relationship' ? 'Relationship Insight' : 
                   'Interesting Moment'}
                </h3>
                <p className="text-gray-200 leading-relaxed">{currentInsight.content}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveInsight}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                💾 Remember This
              </button>
              <button
                onClick={handleContinueVideo}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ▶️ Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
