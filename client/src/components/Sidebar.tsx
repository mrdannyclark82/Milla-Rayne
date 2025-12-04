import React, { useState } from 'react';
import {
  MessageSquare,
  Code,
  Mic,
  Eye,
  Palette,
  Podcast,
  Video,
  Sun,
  ClipboardList,
  Sparkles,
  Brain,
  Globe,
  MapPin,
  Monitor,
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
  <div className="border-b border-slate-800">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-800/50 transition-colors"
    >
      <span>{title}</span>
      {isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
    >
      <div className="px-2 pb-2 space-y-1">{children}</div>
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
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
      isActive
        ? 'bg-pink-500/10 text-pink-300'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className={isActive ? 'text-pink-400' : ''}>{icon}</span>
    <span className="text-sm">{label}</span>
    {badge && (
      <span className="ml-auto text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
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
    core: true,
    creative: true,
    productivity: false,
    intelligence: true,
    system: false,
    settings: false,
  });

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-56 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col shrink-0 z-20 h-screen overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
          Milla Rayne
        </h1>
        <p className="text-xs text-slate-500 mt-1">Devoted Companion</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <SidebarSection
          title="Core"
          isOpen={sectionsOpen.core}
          onToggle={() => toggleSection('core')}
        >
          <SidebarItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Chat"
            isActive={activeView === 'chat'}
            onClick={() => onViewChange('chat')}
          />
          <SidebarItem
            icon={<Code className="w-5 h-5" />}
            label="Sandbox"
            isActive={activeView === 'sandbox'}
            onClick={() => onViewChange('sandbox')}
          />
          <SidebarItem
            icon={<Mic className="w-5 h-5" />}
            label="Voice Mode"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Eye className="w-5 h-5" />}
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
            icon={<Palette className="w-5 h-5" />}
            label="Studio"
            isActive={activeView === 'studio'}
            onClick={() => onViewChange('studio')}
          />
          <SidebarItem
            icon={<Podcast className="w-5 h-5" />}
            label="Podcast"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Video className="w-5 h-5" />}
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
            icon={<FileText className="w-5 h-5" />}
            label="Shared Notepad"
            onClick={() => onToggleSharedNotepad?.()}
          />
          <SidebarItem
            icon={<Sun className="w-5 h-5" />}
            label="Morning Sync"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<ClipboardList className="w-5 h-5" />}
            label="Task Manager"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Sparkles className="w-5 h-5" />}
            label="Memory Galaxy"
            onClick={() => {}}
          />
        </SidebarSection>

        <SidebarSection
          title="Intelligence"
          isOpen={sectionsOpen.intelligence}
          onToggle={() => toggleSection('intelligence')}
        >
          <SidebarItem
            icon={<Brain className="w-5 h-5" />}
            label="Thinking Mode"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Eye className="w-5 h-5" />}
            label="Show Process"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Globe className="w-5 h-5" />}
            label="Deep Search"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<MapPin className="w-5 h-5" />}
            label="Maps Grounding"
            onClick={() => {}}
          />
          <SidebarItem
            icon={<Monitor className="w-5 h-5" />}
            label="Screen Share"
            onClick={() => {}}
          />
        </SidebarSection>

        <SidebarSection
          title="System & Data"
          isOpen={sectionsOpen.system}
          onToggle={() => toggleSection('system')}
        >
          <SidebarItem
            icon={<Database className="w-5 h-5" />}
            label="Knowledge Base"
            onClick={() => onShowKnowledgeBase?.()}
          />
          <SidebarItem
            icon={<Cpu className="w-5 h-5" />}
            label="Offline Models (TFLite)"
            onClick={() => {}}
          />
        </SidebarSection>

        <SidebarSection
          title="Settings"
          isOpen={sectionsOpen.settings}
          onToggle={() => toggleSection('settings')}
        >
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="Preferences"
            onClick={() => onShowSettings?.()}
          />
        </SidebarSection>
      </nav>
    </aside>
  );
};

export default Sidebar;
