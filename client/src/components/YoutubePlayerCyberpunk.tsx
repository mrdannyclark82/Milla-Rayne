import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, GripHorizontal, List, Play } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
}

interface YoutubePlayerCyberpunkProps {
  videoId?: string;
  videos?: Video[];
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
  onAnalyzeVideo?: (videoId: string) => void;
}

export function YoutubePlayerCyberpunk({
  videoId,
  videos,
  onClose,
  onSelectVideo,
  onAnalyzeVideo,
}: YoutubePlayerCyberpunkProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showFeed, setShowFeed] = useState(!videoId && videos && videos.length > 0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 340 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 240, e.clientY - dragStart.y)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

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
    if ((e.target as HTMLElement).tagName !== 'BUTTON' && !isMobile) {
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleVideoSelect = (id: string) => {
    setShowFeed(false);
    onSelectVideo?.(id);
  };

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : '';

  const mobileStyles: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: '4.5rem',
    left: '0.5rem',
    right: '0.5rem',
    width: 'auto',
    maxWidth: 'none',
  } : {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: showFeed ? '340px' : '360px',
  };

  return (
    <div
      style={{
        ...mobileStyles,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(34, 211, 238, 0.1)',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="YouTube player"
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3))',
          padding: '0.625rem 0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: isMobile ? 'default' : 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isMobile && <GripHorizontal style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />}
          <svg style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span style={{ color: '#22d3ee', fontWeight: 600, fontSize: '0.875rem' }}>YouTube</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {videoId && onAnalyzeVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyzeVideo(videoId); }}
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.5rem',
                color: '#a78bfa',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Sparkles style={{ width: '0.875rem', height: '0.875rem' }} />
              Analyze
            </button>
          )}
          {videos && videos.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFeed(!showFeed); }}
              style={{
                background: 'rgba(34, 211, 238, 0.2)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '0.375rem',
                padding: '0.375rem',
                color: '#22d3ee',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showFeed ? <Play style={{ width: '0.875rem', height: '0.875rem' }} /> : <List style={{ width: '0.875rem', height: '0.875rem' }} />}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '0.375rem',
              padding: '0.375rem',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X style={{ width: '0.875rem', height: '0.875rem' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      {showFeed && videos ? (
        <div style={{ maxHeight: isMobile ? '200px' : '280px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.5)' }}>
          {videos.map((video, index) => (
            <div
              key={video.id}
              onClick={(e) => { e.stopPropagation(); handleVideoSelect(video.id); }}
              style={{
                padding: '0.625rem',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background 0.2s',
                background: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {video.thumbnail && (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{ width: '5rem', height: '3rem', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#e5e7eb',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {index + 1}. {video.title}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.6875rem', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {video.channel}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videoId ? (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            title="YouTube video player"
          />
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 0.75rem', opacity: 0.5 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
          </svg>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No video selected</p>
        </div>
      )}
    </div>
  );
}
