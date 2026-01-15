import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { HologramAvatar } from './HologramAvatar';
import { CommandBar } from './CommandBar';
import { ModelSelector } from './ModelSelector';
import { VideoAnalysisPanel } from './VideoAnalysisPanel';
import { ScoreSettings } from './ScoreSettings';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('hub');
  const [developerMode, setDeveloperMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c021a] via-[#120428] to-[#1a0033] text-white font-sans overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f2ff]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ff00aa]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed]/3 rounded-full blur-3xl" />
      </div>

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onClose={() => setSidebarOpen(false)}
        developerMode={developerMode}
        onDeveloperModeChange={setDeveloperMode}
      />

      {/* Main content */}
      <main className={`relative z-10 transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'} min-h-screen flex flex-col`}>
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search your files..."
                className="w-64 px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-white/40 focus:outline-none focus:border-[#00f2ff]/50 focus:bg-white/10 transition-all duration-300 group-hover:border-white/20"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ModelSelector />
            
            {/* Developer Mode Toggle */}
            <button
              onClick={() => setDeveloperMode(!developerMode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                developerMode
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/50 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              Dev Mode
            </button>
          </div>
        </header>

        {/* Hero section with hologram */}
        <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-8">
          <HologramAvatar />
          
          {/* Floating panels */}
          <div className="absolute top-8 right-8 w-80">
            {showSettings && <ScoreSettings onClose={() => setShowSettings(false)} />}
          </div>

          {showVideoPanel && (
            <div className="absolute top-8 left-8 w-96">
              <VideoAnalysisPanel onClose={() => setShowVideoPanel(false)} />
            </div>
          )}

          {/* Quick action buttons */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-sm hover:bg-white/10 hover:border-[#ff00aa]/50 hover:shadow-[0_0_20px_rgba(255,0,170,0.2)] transition-all duration-300"
            >
              Score Settings
            </button>
            <button
              onClick={() => setShowVideoPanel(!showVideoPanel)}
              className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-sm hover:bg-white/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all duration-300"
            >
              Video Analysis
            </button>
          </div>
        </div>

        {/* Command bar - fixed at bottom */}
        <CommandBar />
      </main>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
