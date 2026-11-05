import React from 'react';
import {
  LayoutDashboard,
  Layers,
  GitBranch,
  Box,
  Server,
  Cloud,
  FileCode2,
  Sparkles,
  Activity,
  History,
  Settings,
  ShieldCheck,
  Terminal
} from 'lucide-react';

export type SectionId =
  | 'overview'
  | 'projects'
  | 'pipelines'
  | 'docker'
  | 'kubernetes'
  | 'aws'
  | 'terraform'
  | 'ai-assistant'
  | 'monitoring'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  onOpenTerminal: () => void;
  isBackendConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  onOpenTerminal,
  isBackendConnected,
}) => {
  const menuItems: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Layers, badge: '4' },
    { id: 'pipelines', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'docker', label: 'Docker Images', icon: Box },
    { id: 'kubernetes', label: 'Kubernetes Clusters', icon: Server, badge: '9 pods' },
    { id: 'aws', label: 'AWS Infrastructure', icon: Cloud },
    { id: 'terraform', label: 'Terraform Automation', icon: FileCode2 },
    { id: 'ai-assistant', label: 'AI DevOps Assistant', icon: Sparkles, badge: 'Gemini' },
    { id: 'monitoring', label: 'Monitoring & Observability', icon: Activity },
    { id: 'history', label: 'Rollback & History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            CloudOps <span className="text-xs px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30 font-mono">AI</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">DevOps Automation v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Platform Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Terminal Quick Launcher & Health Badge */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onOpenTerminal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition shadow-inner font-mono"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Console</span>
        </button>

        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/60 rounded-md border border-slate-800 text-[11px]">
          <span className="text-slate-400">Backend API</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={isBackendConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isBackendConnected ? 'Connected' : 'Demo Mode'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

