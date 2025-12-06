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
  <div className="mb-1">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors"
    >
      <span>{title}</span>
      {isOpen ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
    >
      <div className="px-2 pb-1 space-y-0.5">{children}</div>
    </div>
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
    className={`w-full text-left bg-transparent border-none shadow-none transition-colors duration-200 py-2 px-4 rounded flex items-center gap-3 text-[13px] ${
      isActive
        ? 'text-cyan-400 bg-cyan-500/10 border-r-2 border-cyan-400'
        : 'text-white/70 hover:bg-white/5 hover:text-white hover:border-r-2 hover:border-magenta-400'
    }`}
  >
    <span className={`w-4 h-4 flex items-center justify-center ${isActive ? 'text-cyan-400' : ''}`}>{icon}</span>
    <span>{label}</span>
    {badge && (
      <span className="ml-auto text-xs bg-magenta-500/20 text-magenta-300 px-2 py-0.5 rounded-full">
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
    <aside className="w-40 bg-[#0f0f1a]/95 backdrop-blur-md flex flex-col shrink-0 z-20 h-screen overflow-hidden border-r border-white/5">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <h1 className="text-base font-semibold text-cyan-400">
          Milla Rayne
        </h1>
        <p className="text-[10px] text-slate-500 mt-0.5">Devoted Companion</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
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
            label="Voice Settings"
            onClick={() => onShowSettings?.()}
          />
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            label="Developer Options"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            label="Google Sign In"
            onClick={() => {
              const width = 600;
              const height = 700;
              const left = window.screen.width / 2 - width / 2;
              const top = window.screen.height / 2 - height / 2;
              window.open(
                '/api/auth/google',
                'Connect Google Services',
                `width=${width},height=${height},left=${left},top=${top}`
              );
            }}
          />
        </SidebarSection>
      </nav>
    </aside>
  );
};

export default Sidebar;
