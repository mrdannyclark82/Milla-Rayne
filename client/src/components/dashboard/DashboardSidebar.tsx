import { useState } from 'react';
import {
  Home,
  BookOpen,
  Newspaper,
  Mail,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Settings,
  Database,
  Cpu,
  Sparkles,
  Code,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

interface DashboardSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onClose: () => void;
  developerMode: boolean;
  onDeveloperModeChange: (mode: boolean) => void;
}

export function DashboardSidebar({
  isOpen,
  isMobile,
  activeSection,
  onSectionChange,
  onClose,
  developerMode,
  onDeveloperModeChange,
}: DashboardSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navItems: NavItem[] = [
    { id: 'hub', label: 'Milla Hub', icon: <Home className="w-4 h-4" /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'news', label: 'Daily News Digest', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'gmail', label: 'Gmail & Tasks', icon: <Mail className="w-4 h-4" />, badge: 'Connected' },
  ];

  const systemItems: NavItem[] = [
    { id: 'ide', label: 'IDE Sandbox', icon: <Code className="w-4 h-4" /> },
    { id: 'database', label: 'Data Storage', icon: <Database className="w-4 h-4" /> },
    { id: 'models', label: 'AI Models', icon: <Cpu className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isMobile ? 'w-72' : 'w-72'}`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c021a]/95 via-[#120428]/95 to-[#1a0033]/95 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.45)]" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2ff] to-[#ff00aa] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] bg-clip-text text-transparent">
                Milla Rayne
              </h1>
              <p className="text-xs text-white/40">Private Orbit</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-[11px] text-white/60">Connected</span>
            <span className="flex items-center gap-1 text-[11px] text-[#00f2ff]">
              <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Main Navigation */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('main')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
            >
              <span>Navigation</span>
              {expandedSections.includes('main') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.includes('main') && (
              <div className="mt-2 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      if (isMobile) onClose();
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/10 text-white border border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`transition-all duration-300 ${
                      activeSection === item.id ? 'text-[#00f2ff]' : 'group-hover:text-[#00f2ff]'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#ff00aa]/20 text-[#ff00aa] border border-[#ff00aa]/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* System Section */}
          <div>
            <button
              onClick={() => toggleSection('system')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider hover:text-white/70 transition-colors"
            >
              <span>System</span>
              {expandedSections.includes('system') ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {expandedSections.includes('system') && (
              <div className="mt-2 space-y-1">
                {systemItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      if (isMobile) onClose();
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/10 text-white border border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`transition-all duration-300 ${
                      activeSection === item.id ? 'text-[#00f2ff]' : 'group-hover:text-[#00f2ff]'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/60">Developer Mode</span>
            <button
              onClick={async () => {
                const nextMode = !developerMode;
                onDeveloperModeChange(nextMode);
                try {
                  await fetch('/api/developer-mode/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: nextMode }),
                  });
                } catch (e) {
                  console.error('Failed to toggle developer mode on backend:', e);
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                developerMode
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa]'
                  : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  developerMode ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
