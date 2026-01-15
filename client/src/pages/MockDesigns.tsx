import { useState } from 'react';
import { MessageCircle, Send, Mic, Settings, BookOpen, Youtube, Sparkles, Palette, Brain, Volume2, LogIn, Zap, GitBranch, X, Code } from 'lucide-react';
import { YoutubePlayerCyberpunk } from '../components/YoutubePlayerCyberpunk';
import { SandboxManager } from '../components/SandboxManager';
import { Sandbox } from '../components/Sandbox';

export default function MockDesigns() {
  return <CombinedDesign />;
}

function CombinedDesign() {
  const [message, setMessage] = useState('');
  const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>(undefined);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSandboxManager, setShowSandboxManager] = useState(false);
  const [showIDE, setShowIDE] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeNav, setActiveNav] = useState('chat');

  const sampleVideos = [
    { id: 'dQw4w9WgXcQ', title: 'AI and the Future of Creativity', channel: 'TechTalks', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
    { id: 'jNQXAC9IVRw', title: 'Building Neural Networks from Scratch', channel: 'ML Academy', thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg' },
    { id: '9bZkp7q19f0', title: 'The Art of Prompt Engineering', channel: 'AI Insights', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg' },
  ];

  const navItems = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'memory', icon: Brain, label: 'Memory' },
    { id: 'knowledge', icon: BookOpen, label: 'Knowledge' },
    { id: 'youtube', icon: Youtube, label: 'Media' },
    { id: 'create', icon: Palette, label: 'Create' },
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === 'youtube') {
      setShowYoutubePlayer(true);
    }
  };

  const handleSelectVideo = (videoId: string) => {
    setCurrentVideoId(videoId);
  };

  const handleGoogleAuth = async () => {
    if (isAuthenticated) {
      setIsAuthenticated(false);
    } else {
      try {
        const response = await fetch('/api/auth/google/url');
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            window.open(data.url, '_blank', 'width=500,height=600');
          }
        }
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(true);
      }
    }
  };

  return (
    <div className="milla-container">
      <div className="bg-gradient-1" />
      <div className="bg-gradient-2" />

      <div className="main-layout">
        <aside className="desktop-sidebar">
          <div className="logo-icon">
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-btn ${activeNav === item.id ? 'active' : ''}`}
              >
                <item.icon style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            ))}
          </nav>

          <div className="voice-indicator">
            <Volume2 style={{ width: '1rem', height: '1rem', color: '#a78bfa' }} />
          </div>

          <button onClick={() => setShowSettingsPanel(true)} className="nav-btn settings-btn">
            <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </aside>

        <main className="main-content">
          <header className="mobile-header">
            <div className="mobile-header-left">
              <div className="mobile-logo">
                <Sparkles style={{ width: '1rem', height: '1rem', color: 'white' }} />
              </div>
              <span className="mobile-title">MILLA.AI</span>
            </div>
            <button onClick={() => setShowSettingsPanel(true)} className="mobile-settings-btn">
              <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </header>

          <div className="chat-area">
            <div className="chat-container">
              <div className="message-row ai">
                <div className="avatar ai-avatar" />
                <div className="message-bubble ai-bubble">
                  <div className="bubble-highlight" />
                  <p className="message-text">
                    <span className="ai-tag">[MILLA.AI]</span> Systems online. Neural pathways synchronized. 
                    {isAuthenticated ? ' Google services connected. ' : ' '} 
                    Ready to assist with any task — from complex analysis to creative exploration. What would you like to explore today?
                  </p>
                </div>
              </div>

              <div className="message-row user">
                <div className="message-bubble user-bubble">
                  <div className="bubble-highlight" />
                  <p className="message-text">Show me some interesting videos about AI</p>
                </div>
                <div className="avatar user-avatar" />
              </div>

              <div className="message-row ai">
                <div className="avatar ai-avatar" />
                <div className="message-bubble ai-bubble">
                  <div className="bubble-highlight" />
                  <p className="message-text">
                    <span className="ai-tag">[MILLA.AI]</span> I found some great AI content for you! Click below to open the player.
                  </p>
                  <button onClick={() => { setShowYoutubePlayer(true); setCurrentVideoId(undefined); }} className="youtube-btn">
                    <Youtube style={{ width: '1rem', height: '1rem' }} />
                    Open YouTube Player
                  </button>
                  <div className="tag-row">
                    <span className="tag cyan">AI</span>
                    <span className="tag violet">Videos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="input-area">
            <div className="input-container">
              <div className="input-wrapper">
                <div className="input-bg" />
                <input
                  type="text"
                  placeholder="Message Milla..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="message-input"
                />
                <button className="input-btn mic-btn">
                  <Mic style={{ width: '1.125rem', height: '1.125rem' }} />
                </button>
                <button className="input-btn send-btn">
                  <Send style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
              <div className="command-chips">
                {['/analyze', '/create', '/remember', '/youtube'].map((cmd) => (
                  <span key={cmd} onClick={() => cmd === '/youtube' && setShowYoutubePlayer(true)} className="chip">{cmd}</span>
                ))}
              </div>
            </div>
          </div>

          <nav className="mobile-nav">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`mobile-nav-btn ${activeNav === item.id ? 'active' : ''}`}>
                <item.icon style={{ width: '1.25rem', height: '1.25rem' }} />
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            ))}
            <button onClick={() => setShowSettingsPanel(true)} className="mobile-nav-btn">
              <Settings style={{ width: '1.25rem', height: '1.25rem' }} />
              <span className="mobile-nav-label">Settings</span>
            </button>
          </nav>
        </main>
      </div>

      {showYoutubePlayer && (
        <YoutubePlayerCyberpunk
          videoId={currentVideoId}
          videos={sampleVideos}
          onClose={() => { setShowYoutubePlayer(false); setCurrentVideoId(undefined); }}
          onSelectVideo={handleSelectVideo}
          onAnalyzeVideo={(id) => console.log('Analyze video:', id)}
        />
      )}

      {showSettingsPanel && (
        <div className="settings-overlay">
          <div className="settings-backdrop" onClick={() => setShowSettingsPanel(false)} />
          <div className="settings-panel">
            <div className="settings-header">
              <h2 className="settings-title">Settings</h2>
              <button onClick={() => setShowSettingsPanel(false)} className="close-btn">
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            <div className="settings-section">
              <h3 className="section-title"><LogIn style={{ width: '1rem', height: '1rem' }} /> Google Authentication</h3>
              <button onClick={handleGoogleAuth} className={`auth-btn ${isAuthenticated ? 'connected' : ''}`}>
                {isAuthenticated ? (
                  <><span className="status-dot" />Connected to Google</>
                ) : (
                  <>Sign in with Google</>
                )}
              </button>
              {isAuthenticated && (
                <div className="services-row">
                  {['YouTube', 'Calendar', 'Gmail', 'Drive'].map((service) => (
                    <span key={service} className="service-tag">{service}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="settings-section">
              <h3 className="section-title"><Zap style={{ width: '1rem', height: '1rem' }} /> Proactive Enhancements</h3>
              <div className="health-card">
                <div className="health-header">
                  <span className="health-label">Repository Health</span>
                  <span className="health-value">8.5/10</span>
                </div>
                <div className="health-bar-bg">
                  <div className="health-bar-fill" />
                </div>
                <p className="health-desc">Active monitoring for optimizations and improvements</p>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="section-title"><GitBranch style={{ width: '1rem', height: '1rem' }} /> Sandbox Environments</h3>
              <div className="sandbox-list">
                {['Real-time Chat', 'Voice Integration', 'Memory System'].map((sandbox, i) => (
                  <div key={sandbox} className="sandbox-item">
                    <span className="sandbox-name">{sandbox}</span>
                    <span className={`sandbox-status ${i === 0 ? 'active' : 'ready'}`}>
                      {i === 0 ? 'Active' : 'Ready'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowSettingsPanel(false); setShowSandboxManager(true); }}
                className="sandbox-manage-btn"
              >
                <GitBranch style={{ width: '0.875rem', height: '0.875rem' }} />
                Manage Sandboxes
              </button>
              <button
                onClick={() => { setShowSettingsPanel(false); setShowIDE(true); }}
                className="ide-btn"
              >
                <Code style={{ width: '0.875rem', height: '0.875rem' }} />
                Open IDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Manager */}
      <SandboxManager
        isOpen={showSandboxManager}
        onClose={() => setShowSandboxManager(false)}
        onOpenIDE={() => { setShowSandboxManager(false); setShowIDE(true); }}
      />

      {/* IDE Sandbox */}
      <Sandbox
        isOpen={showIDE}
        onClose={() => setShowIDE(false)}
      />

      <style>{`
        * { box-sizing: border-box; }
        
        .milla-container {
          min-height: 100vh;
          height: 100vh;
          background: #000;
          position: relative;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .bg-gradient-1 {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top, rgba(120, 50, 255, 0.15), transparent 50%);
        }
        
        .bg-gradient-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at bottom right, rgba(0, 200, 255, 0.1), transparent 50%);
        }
        
        .main-layout {
          position: relative;
          display: flex;
          height: 100%;
        }
        
        .desktop-sidebar {
          width: 4.5rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 0;
          gap: 1.5rem;
          flex-shrink: 0;
        }
        
        .logo-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }
        
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        
        .nav-btn {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: transparent;
          border: none;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .nav-btn.active {
          background: rgba(34, 211, 238, 0.15);
          border: 1px solid rgba(34, 211, 238, 0.3);
          color: #22d3ee;
        }
        
        .nav-btn:hover:not(.active) {
          color: #9ca3af;
        }
        
        .voice-indicator {
          padding: 0.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1));
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0.5rem;
        }
        
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        
        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .mobile-logo {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
        }
        
        .mobile-title {
          color: #22d3ee;
          font-weight: 600;
          font-size: 1.125rem;
        }
        
        .mobile-settings-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 0.5rem;
          cursor: pointer;
        }
        
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .chat-container {
          max-width: 48rem;
          margin: 0 auto;
        }
        
        .message-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .message-row.user {
          justify-content: flex-end;
        }
        
        .avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .ai-avatar {
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
        }
        
        .user-avatar {
          background: #1f2937;
          border: 1px solid #374151;
        }
        
        .message-bubble {
          backdrop-filter: blur(20px);
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          max-width: calc(100% - 3rem);
          position: relative;
          overflow: hidden;
        }
        
        .ai-bubble {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 0.25rem;
        }
        
        .user-bubble {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(192, 38, 211, 0.8));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-top-right-radius: 0.25rem;
        }
        
        .bubble-highlight {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(34, 211, 238, 0.5), transparent);
        }
        
        .user-bubble .bubble-highlight {
          background: linear-gradient(to right, transparent, rgba(167, 139, 250, 0.5), transparent);
        }
        
        .message-text {
          color: #e5e7eb;
          line-height: 1.5;
          margin: 0;
          font-size: 0.9375rem;
        }
        
        .user-bubble .message-text {
          color: white;
        }
        
        .ai-tag {
          color: #22d3ee;
        }
        
        .youtube-btn {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: #f87171;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        
        .youtube-btn:hover {
          background: linear-gradient(to right, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.2));
        }
        
        .tag-row {
          margin-top: 0.625rem;
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        
        .tag {
          padding: 0.1875rem 0.5rem;
          font-size: 0.6875rem;
          border-radius: 0.25rem;
        }
        
        .tag.cyan {
          background: rgba(34, 211, 238, 0.2);
          color: #22d3ee;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        .tag.violet {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .input-area {
          padding: 0.75rem 1rem;
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .input-container {
          max-width: 48rem;
          margin: 0 auto;
        }
        
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .input-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(34, 211, 238, 0.05));
        }
        
        .message-input {
          flex: 1;
          background: transparent;
          color: white;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          position: relative;
          z-index: 10;
          min-width: 0;
        }
        
        .message-input::placeholder {
          color: #6b7280;
        }
        
        .input-btn {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          position: relative;
          z-index: 10;
          flex-shrink: 0;
        }
        
        .mic-btn {
          background: transparent;
          color: #9ca3af;
        }
        
        .send-btn {
          background: linear-gradient(to right, #8b5cf6, #22d3ee);
          color: white;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
        }
        
        .command-chips {
          display: flex;
          gap: 0.375rem;
          margin-top: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        
        .chip {
          padding: 0.25rem 0.625rem;
          font-size: 0.6875rem;
          border-radius: 0.375rem;
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          white-space: nowrap;
        }
        
        .chip:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .mobile-nav {
          display: none;
          justify-content: space-around;
          align-items: center;
          padding: 0.5rem;
          padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.375rem 0.75rem;
        }
        
        .mobile-nav-btn.active {
          color: #22d3ee;
        }
        
        .mobile-nav-label {
          font-size: 0.625rem;
          font-weight: 500;
        }
        
        .settings-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
        }
        
        .settings-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .settings-panel {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 20rem;
          max-width: 85vw;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          overflow-y: auto;
          box-shadow: -10px 0 40px rgba(139, 92, 246, 0.2);
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .settings-title {
          color: #22d3ee;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .close-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
        }
        
        .settings-section {
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          color: #a78bfa;
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .auth-btn {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #e5e7eb;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .auth-btn.connected {
          border: 1px solid rgba(34, 211, 238, 0.4);
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
        }
        
        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 8px #22d3ee;
        }
        
        .services-row {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        
        .service-tag {
          padding: 0.25rem 0.5rem;
          font-size: 0.6875rem;
          border-radius: 0.25rem;
          background: rgba(34, 211, 238, 0.1);
          color: #22d3ee;
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        
        .health-card {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 0.5rem;
          padding: 0.75rem;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .health-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .health-label {
          color: #9ca3af;
          font-size: 0.75rem;
        }
        
        .health-value {
          color: #22d3ee;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .health-bar-bg {
          height: 0.375rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.25rem;
          overflow: hidden;
        }
        
        .health-bar-fill {
          width: 85%;
          height: 100%;
          background: linear-gradient(to right, #8b5cf6, #22d3ee);
          border-radius: 0.25rem;
        }
        
        .health-desc {
          color: #6b7280;
          font-size: 0.6875rem;
          margin: 0.5rem 0 0;
        }
        
        .sandbox-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .sandbox-item {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sandbox-name {
          color: #e5e7eb;
          font-size: 0.8125rem;
        }
        
        .sandbox-status {
          padding: 0.125rem 0.375rem;
          font-size: 0.625rem;
          border-radius: 0.25rem;
        }
        
        .sandbox-status.active {
          background: rgba(34, 211, 238, 0.2);
          color: #22d3ee;
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        .sandbox-status.ready {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .sandbox-manage-btn,
        .ide-btn {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.625rem;
          border-radius: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .sandbox-manage-btn {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(34, 211, 238, 0.2));
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #a78bfa;
        }
        
        .sandbox-manage-btn:hover {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3));
        }
        
        .ide-btn {
          background: rgba(34, 211, 238, 0.15);
          border: 1px solid rgba(34, 211, 238, 0.4);
          color: #22d3ee;
        }
        
        .ide-btn:hover {
          background: rgba(34, 211, 238, 0.25);
        }
        
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none;
          }
          
          .mobile-header {
            display: flex;
          }
          
          .mobile-nav {
            display: flex;
          }
          
          .command-chips {
            margin-bottom: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
