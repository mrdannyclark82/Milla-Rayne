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
}

export function YoutubePlayer({ videoId, videos, onClose, onSelectVideo, onAnalyzeVideo }: YoutubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showFeed, setShowFeed] = useState(!videoId && videos && videos.length > 0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 300 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  console.log('🎬 YoutubePlayer rendering with videoId:', videoId, 'videos:', videos?.length);
  
  useEffect(() => {
    console.log('🎬 YoutubePlayer mounted');
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('🎬 Escape key pressed, closing player');
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      console.log('🎬 YoutubePlayer unmounted');
    };
  }, [onClose]);
  
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
    setShowFeed(false);
    onSelectVideo?.(id);
  };
  
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : '';
  
  return (
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
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="text-white font-semibold text-sm">YouTube</span>
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
              title={showFeed ? "Show player" : "Show feed"}
            >
              {showFeed ? '▶️' : '📋'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
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
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                    {index + 1}. {video.title}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {video.channel}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videoId ? (
        <div 
          className="relative w-full bg-black" 
          style={{ 
            paddingBottom: '56.25%',
          }}
        >
          <iframe
            ref={iframeRef}
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
            title="YouTube video player"
            onLoad={() => console.log('🎬 iframe loaded successfully')}
            onError={(e) => console.error('🎬 iframe error:', e)}
          ></iframe>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-400">
          No video selected
        </div>
      )}
    </div>
  );
}
