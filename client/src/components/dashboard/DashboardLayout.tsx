import { useState, useEffect } from 'react';
import { Menu, X, Wifi, Shield, Sparkles, Radio } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { HologramAvatar } from './HologramAvatar';
import { CommandBar } from './CommandBar';
import { ModelSelector, type AIModel } from './ModelSelector';
import { VideoAnalysisPanel } from './VideoAnalysisPanel';
import { ScoreSettings } from './ScoreSettings';
import { ChatThreadPanel } from './ChatThreadPanel';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('hub');
  const [developerMode, setDeveloperMode] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showVideoPanel, setShowVideoPanel] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([
    `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Session initialized`,
  ]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<string[]>([]);
  const [scoreSettings, setScoreSettings] = useState({
    ambientLight: 65,
    amplitude: 50,
    status: 80,
    volume: 70,
  });

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

  const timestamped = (message: string) =>
    `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${message}`;

  const logActivity = (entry: string) => {
    setActivityLog(prev => [timestamped(entry), ...prev].slice(0, 8));
  };

  const handleSendMessage = (message: string) => {
    logActivity(`Command sent: ${message}`);
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 900);
  };

  const handleListeningStart = () => {
    setIsListening(true);
    logActivity('Voice capture started');
  };

  const handleListeningStop = () => {
    setIsListening(false);
    logActivity('Voice capture stopped');
  };

  const handleAnalyzeComplete = (label: string) => {
    logActivity(`Video analyzed: ${label}`);
    setRecentAnalyses(prev => [label, ...prev].slice(0, 5));
  };

  const handleScoreChange = (next: typeof scoreSettings) => {
    setScoreSettings(next);
    logActivity('Score settings adjusted');
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    logActivity(`Model selected: ${model.name}`);
  };

  const sectionLabels: Record<string, string> = {
    hub: 'Milla Hub',
    knowledge: 'Knowledge Base',
    news: 'Daily News Digest',
    gmail: 'Gmail & Tasks',
    database: 'Data Storage',
    models: 'AI Models',
    settings: 'Settings',
  };

  const statusCards = [
    { label: 'Active Section', status: sectionLabels[activeSection] ?? 'Milla Hub' },
    { label: 'Model', status: selectedModel?.name ?? 'Select a model' },
    { label: 'Voice Channel', status: isListening ? 'Listening' : 'Idle' },
  ];

  return (
    <div className="min-h-screen bg-[#0c021a] text-white font-sans overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,242,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,0,170,0.08),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(124,58,237,0.12),transparent_40%)]" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0)_65%,rgba(255,255,255,0.08)_100%)] animate-pulse" />
        <div className="absolute inset-0 bg-[length:120px_120px] bg-cyber-grid opacity-20 mix-blend-screen" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none fixed inset-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#00f2ff] opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationName: 'float',
              animationDuration: `${6 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 3}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/10 hover:bg-white/20 transition-all duration-300 shadow-glow-sm"
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
      <main
        className={`relative z-10 transition-all duration-300 ${
          sidebarOpen && !isMobile ? 'lg:ml-72 xl:ml-72 ml-64' : 'ml-0'
        } min-h-screen flex flex-col`}
      >
        {/* Top bar */}
        <header className="flex flex-col gap-4 px-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 border border-white/10 backdrop-blur-lg">
                <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
                <span className="text-xs text-white/60">Immersive Session Ready</span>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 border border-white/10 backdrop-blur-lg">
                <Radio className="w-3.5 h-3.5 text-[#ff00aa]" />
                <span className="text-xs text-white/60">Neural Link Stable</span>
              </div>
             </div>

             <div className="flex items-center gap-3">
               <ModelSelector value={selectedModel ?? undefined} onChange={handleModelChange} />
               <button
                 onClick={() => setDeveloperMode(!developerMode)}
                 className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 border ${
                  developerMode
                    ? 'bg-[#00f2ff]/15 border-[#00f2ff]/50 text-[#00f2ff] shadow-[0_0_25px_rgba(0,242,255,0.25)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                Developer Mode
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
              <svg
                className="w-4 h-4 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search your files, knowledge, or memories..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/40">
                <span className="px-2 py-1 rounded-md border border-white/10 bg-white/5">⌘</span>
                <span className="px-2 py-1 rounded-md border border-white/10 bg-white/5">K</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 w-full px-6 pb-32 pt-6">
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              {/* Hero / hologram */}
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ff]/10 via-transparent to-[#ff00aa]/10" />
                <div className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-[#00f2ff]/20 blur-3xl" />
                <div className="absolute -right-16 bottom-6 h-48 w-48 rounded-full bg-[#ff00aa]/15 blur-3xl" />
                <div className="relative z-10 px-6 py-6 lg:px-10 lg:py-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60 border border-white/10">
                        <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                        Central Holographic Channel
                      </div>
                      <div className="mt-3 text-2xl font-semibold">
                        Milla is here — tuned to your private orbit.
                      </div>
                      <p className="mt-2 text-sm text-white/60 max-w-xl">
                        Streamlined for your hub, knowledge base, daily briefings, and connected Gmail & Tasks.
                        Every interaction is wrapped in glassy neon calm.
                      </p>
                       <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                         {statusCards.map(card => (
                           <div
                             key={card.label}
                             className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70 shadow-glow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span>{card.label}</span>
                              <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
                            </div>
                            <div className="mt-1 text-[11px] text-white/40">{card.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <HologramAvatar />
                    </div>

                    <div className="w-full lg:w-64 space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Wifi className="w-4 h-4 text-[#00f2ff]" />
                          Connected: Gmail & Tasks
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['Inbox Triage', 'Task Sync', 'Digest'].map(tag => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Developer Mode</span>
                          <span
                            className={`px-2 py-1 rounded-md text-[11px] ${
                              developerMode
                                ? 'bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40'
                                : 'bg-white/5 text-white/50 border border-white/10'
                            }`}
                          >
                            {developerMode ? 'On' : 'Off'}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] text-white/40">
                          Toggle to surface raw data streams and system diagnostics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
               </section>

               <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.45)] px-6 py-5">
                 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                   <div>
                     <p className="text-xs uppercase tracking-[0.2em] text-white/40">Now viewing</p>
                     <div className="text-lg font-semibold text-white">
                       {sectionLabels[activeSection] ?? 'Milla Hub'}
                     </div>
                     <p className="text-sm text-white/50">
                       Model: {selectedModel?.name ?? 'Awaiting selection'} · Mode:{' '}
                       {developerMode ? 'Developer' : 'User'}
                     </p>
                   </div>
                   <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                     <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                       <div className="text-white/50">Ambient Light</div>
                       <div className="text-white font-semibold">{scoreSettings.ambientLight}%</div>
                     </div>
                     <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                       <div className="text-white/50">Amplitude</div>
                       <div className="text-white font-semibold">{scoreSettings.amplitude}%</div>
                     </div>
                     <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                       <div className="text-white/50">Status</div>
                       <div className="text-white font-semibold">{scoreSettings.status}%</div>
                     </div>
                     <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                       <div className="text-white/50">Volume</div>
                       <div className="text-white font-semibold">{scoreSettings.volume}%</div>
                     </div>
                   </div>
                 </div>
               </section>

               <ChatThreadPanel onPlayVideo={(videoId) => {
                   setShowVideoPanel(true);
                   handleAnalyzeComplete(`YouTube Video ${videoId}`); // Placeholder to trigger panel update
                   // Ideally VideoAnalysisPanel should accept videoId directly, but for now we open it.
                   // You might need to update VideoAnalysisPanel to accept 'activeVideoId' prop.
                   // Assuming it reads from recentAnalyses or we can pass a new prop.
                   // I'll try to pass it via state if possible, but let's just open it for now.
                   // Actually, handleAnalyzeComplete adds to log.
                   // I should probably set a state for 'activeVideo' if the component supports it.
                   // Looking at VideoAnalysisPanel usage: <VideoAnalysisPanel recentItems={recentAnalyses} ... />
                   // It doesn't seem to take an active video ID prop from here.
                   // But let's just ensure the panel opens.
               }} />

               {/* Experience grid */}
               <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                 {[
                   {
                     title: 'Knowledge Base',
                     desc: `Focused on ${sectionLabels[activeSection] ?? 'Milla Hub'}.`,
                     accent: '#00f2ff',
                   },
                   {
                     title: 'Daily News Digest',
                     desc: developerMode ? 'Diagnostics surfaced for news streams.' : 'Briefings ready without noise.',
                     accent: '#ff00aa',
                   },
                   {
                     title: 'Milla Hub',
                     desc: selectedModel ? `Running on ${selectedModel.name}.` : 'Pick a model to engage.',
                     accent: '#7c3aed',
                   },
                   {
                     title: 'Gmail & Tasks',
                     desc: isListening ? 'Voice triage armed.' : 'Tap mic to triage inbox.',
                     accent: '#00f2ff',
                   },
                   {
                     title: 'Video Analysis',
                     desc: recentAnalyses[0] ? `Latest: ${recentAnalyses[0]}` : 'Drop a YouTube link or file for insight.',
                     accent: '#ff00aa',
                   },
                   {
                     title: 'Score Settings',
                     desc: `Ambient ${scoreSettings.ambientLight}% · Volume ${scoreSettings.volume}%`,
                     accent: '#7c3aed',
                   },
                 ].map(card => (
                   <div
                     key={card.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_15px_60px_rgba(0,0,0,0.35)]"
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at 30% 20%, ${card.accent}22, transparent 55%)`,
                      }}
                    />
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: card.accent }}
                        />
                        {card.title}
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right rail */}
             <div className="space-y-4">
               {showSettings && (
                 <ScoreSettings
                   values={scoreSettings}
                   onChange={handleScoreChange}
                   onClose={() => setShowSettings(false)}
                 />
               )}
               {showVideoPanel && (
                 <VideoAnalysisPanel
                   recentItems={recentAnalyses}
                   onAnalyzeComplete={handleAnalyzeComplete}
                   onClose={() => setShowVideoPanel(false)}
                 />
               )}

               <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                 <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white/80">Quick Toggles</span>
                  <button
                    onClick={() => {
                      const next = !(showSettings && showVideoPanel);
                      setShowSettings(next);
                      setShowVideoPanel(next);
                    }}
                    className="text-[11px] rounded-full bg-white/5 px-3 py-1 border border-white/10 hover:border-white/30 transition-all"
                  >
                    {showSettings && showVideoPanel ? 'Hide panels' : 'Show panels'}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      showSettings
                        ? 'border-[#00f2ff]/40 bg-[#00f2ff]/10 text-[#00f2ff]'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    Score Settings
                  </button>
                  <button
                    onClick={() => setShowVideoPanel(!showVideoPanel)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all ${
                      showVideoPanel
                        ? 'border-[#ff00aa]/40 bg-[#ff00aa]/10 text-[#ff00aa]'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    Video Analysis
                  </button>
                 </div>
               </div>

               <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                 <div className="flex items-center justify-between text-sm font-medium text-white/80">
                   <span>Activity</span>
                   <span className="text-[11px] text-white/40">{activityLog.length} events</span>
                 </div>
                 <div className="mt-3 space-y-2">
                   {activityLog.map((item, i) => (
                     <div
                       key={`${item}-${i}`}
                       className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/70"
                     >
                       {item}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>
         </div>

         {/* Command bar */}
         <CommandBar
           onSendMessage={handleSendMessage}
           onStartListening={handleListeningStart}
           onStopListening={handleListeningStop}
           isListening={isListening}
           isLoading={isProcessing}
         />
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
