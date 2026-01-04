import React, { useState } from 'react';
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
      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-cyber-pink transition-all duration-300"
    >
      <span>{title}</span>
      {isOpen ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
    {isOpen && (
      <div className="px-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
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
    className={`w-full text-left bg-transparent border-none shadow-none transition-all duration-300 py-3 px-4 rounded-xl flex items-center gap-3 text-sm backdrop-blur-sm ${
      isActive
        ? 'text-cyber-pink bg-gradient-to-r from-cyber-pink/20 to-cyber-pink/10 border-r-2 border-cyber-pink shadow-[0_0_15px_rgba(255,0,170,0.3)]'
        : 'text-white/70 hover:bg-nebula-indigo/40 hover:text-white hover:border-r-2 hover:border-neon-blue/50 hover:shadow-[0_0_10px_rgba(0,242,255,0.2)]'
    }`}
  >
    <span className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-cyber-pink' : ''}`}>{icon}</span>
    <span className="font-medium">{label}</span>
    {badge && (
      <span className="ml-auto text-xs bg-cyber-pink/20 text-cyber-pink px-2 py-1 rounded-lg font-semibold">
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
    core: false,
    creative: false,
    productivity: false,
    system: false,
    settings: false,
  });

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-48 bg-nebula-indigo/40 backdrop-blur-xl flex flex-col shrink-0 z-20 h-screen overflow-hidden border-r border-cyber-pink/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="px-5 py-6 border-b border-cyber-pink/20 bg-nebula-indigo/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink/40 to-neon-blue/40 backdrop-blur-xl border border-cyber-pink/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,170,0.3)]">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white glow-text-sm">
              Milla Rayne
            </h1>
            <p className="text-xs text-neon-blue/80 mt-0.5 font-medium">Devoted Companion</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <SidebarSection
          title="Core"
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
            label="Veo Video"
            onClick={() => {}}
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
          title="System & Data"
          isOpen={sectionsOpen.system}
          onToggle={() => toggleSection('system')}
        >
          <SidebarItem
            icon={<Database className="w-4 h-4" />}
            label="Knowledge Base"
            onClick={() => onShowKnowledgeBase?.()}
          />
          <SidebarItem
            icon={<Cpu className="w-4 h-4" />}
            label="Offline Models"
            onClick={() => {}}
          />
        </SidebarSection>

        <SidebarSection
          title="Settings"
          isOpen={sectionsOpen.settings}
          onToggle={() => toggleSection('settings')}
        >
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            label="All Settings"
            onClick={() => onShowSettings?.()}
          />
        </SidebarSection>
      </nav>
    </aside>
  );
};

export default Sidebar;
