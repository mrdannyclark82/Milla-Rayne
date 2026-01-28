import { useState } from 'react';
import {
  MessageSquare,
  Code,
  Mic,
  Eye,
  Palette,
  Video,
  Sun,
  ClipboardList,
  Database,
  Cpu,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  Home,
  BookOpen,
  Newspaper,
  Mail,
} from 'lucide-react';

interface SidebarProps {
  activeView: 'chat' | 'sandbox' | 'studio';
  onViewChange: (view: 'chat' | 'sandbox' | 'studio') => void;
  onShowKnowledgeBase?: () => void;
  onShowYoutubeMemories?: () => void;
  onShowSettings?: () => void;
  onToggleSharedNotepad?: () => void;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  isOpen,
  onToggle,
}) => (
  <div className="mb-2">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-semibold text-white/40 uppercase tracking-widest hover:text-white/60 transition-all duration-300"
    >
      <span>{title}</span>
      {isOpen ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
    {isOpen && (
      <div className="px-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
        {children}
      </div>
    )}
  </div>
);

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  badge,
}) => (
  <button
    onClick={onClick}
    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/10 text-white border border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
        : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
    }`}
  >
    <span className={`transition-all duration-300 ${
      isActive ? 'text-[#00f2ff]' : 'group-hover:text-[#00f2ff]'
    }`}>
      {icon}
    </span>
    <span className="flex-1 text-left truncate">{label}</span>
    {badge && (
      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#ff00aa]/20 text-[#ff00aa] border border-[#ff00aa]/30">
        {badge}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onShowKnowledgeBase,
  onShowYoutubeMemories,
  onShowSettings,
  onToggleSharedNotepad,
}) => {
  const [sectionsOpen, setSectionsOpen] = useState({
    main: true,
    core: true,
    creative: false,
    productivity: false,
    system: false,
    settings: false,
  });

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-64 flex flex-col shrink-0 z-20 h-screen overflow-hidden relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c021a]/95 to-[#1a0033]/95 backdrop-blur-xl border-r border-white/10" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2ff] to-[#ff00aa] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] bg-clip-text text-transparent">
                Milla Rayne
              </h1>
              <p className="text-[10px] text-white/40">Your AI Companion</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Quick Access */}
          <SidebarSection
            title="Quick Access"
            isOpen={sectionsOpen.main}
            onToggle={() => toggleSection('main')}
          >
            <SidebarItem
              icon={<Home className="w-4 h-4" />}
              label="Milla Hub"
              isActive={activeView === 'chat'}
              onClick={() => onViewChange('chat')}
            />
            <SidebarItem
              icon={<BookOpen className="w-4 h-4" />}
              label="Knowledge Base"
              onClick={() => onShowKnowledgeBase?.()}
            />
            <SidebarItem
              icon={<Newspaper className="w-4 h-4" />}
              label="Daily News Digest"
              onClick={() => {}}
            />
            <SidebarItem
              icon={<Mail className="w-4 h-4" />}
              label="Gmail & Tasks"
              badge="Connected"
              onClick={() => {}}
            />
          </SidebarSection>

          {/* Core Features */}
          <SidebarSection
            title="Core Features"
            isOpen={sectionsOpen.core}
            onToggle={() => toggleSection('core')}
          >
            <SidebarItem
              icon={<MessageSquare className="w-4 h-4" />}
              label="Chat"
              isActive={activeView === 'chat'}
              onClick={() => onViewChange('chat')}
            />
            <SidebarItem
              icon={<Code className="w-4 h-4" />}
              label="Sandbox"
              isActive={activeView === 'sandbox'}
              onClick={() => onViewChange('sandbox')}
            />
            <SidebarItem
              icon={<Mic className="w-4 h-4" />}
              label="Voice Mode"
              onClick={() => {}}
            />
            <SidebarItem
              icon={<Eye className="w-4 h-4" />}
              label="Live Vision"
              onClick={() => {}}
            />
          </SidebarSection>

          <SidebarSection
            title="Creative Suite"
            isOpen={sectionsOpen.creative}
            onToggle={() => toggleSection('creative')}
          >
            <SidebarItem
              icon={<Palette className="w-4 h-4" />}
              label="Studio"
              isActive={activeView === 'studio'}
              onClick={() => onViewChange('studio')}
            />
            <SidebarItem
              icon={<Video className="w-4 h-4" />}
              label="Video Analysis"
              onClick={() => onShowYoutubeMemories?.()}
            />
          </SidebarSection>

          <SidebarSection
            title="Productivity"
            isOpen={sectionsOpen.productivity}
            onToggle={() => toggleSection('productivity')}
          >
            <SidebarItem
              icon={<FileText className="w-4 h-4" />}
              label="Shared Notepad"
              onClick={() => onToggleSharedNotepad?.()}
            />
            <SidebarItem
              icon={<Sun className="w-4 h-4" />}
              label="Morning Sync"
              onClick={() => {}}
            />
            <SidebarItem
              icon={<ClipboardList className="w-4 h-4" />}
              label="Task Manager"
              onClick={() => {}}
            />
          </SidebarSection>

          <SidebarSection
            title="System"
            isOpen={sectionsOpen.system}
            onToggle={() => toggleSection('system')}
          >
            <SidebarItem
              icon={<Database className="w-4 h-4" />}
              label="Data Storage"
              onClick={() => onShowKnowledgeBase?.()}
            />
            <SidebarItem
              icon={<Cpu className="w-4 h-4" />}
              label="AI Models"
              onClick={() => {}}
            />
            <SidebarItem
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              onClick={() => onShowSettings?.()}
            />
          </SidebarSection>
        </nav>

        {/* Footer - Developer Mode */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm">
            <span className="text-xs text-white/50">Dev Mode</span>
            <div className="relative w-10 h-5 rounded-full bg-white/20 cursor-pointer transition-all hover:bg-white/30">
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
