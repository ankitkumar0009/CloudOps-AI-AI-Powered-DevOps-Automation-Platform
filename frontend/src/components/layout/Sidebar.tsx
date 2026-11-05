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
  Terminal,
  AlertTriangle,
  Zap,
  ShieldAlert
} from 'lucide-react';

export type SectionId =
  | 'overview'
  | 'projects'
  | 'pipelines'
  | 'docker'
  | 'kubernetes'
  | 'incidents'
  | 'auto-healing'
  | 'security'
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
  const menuItems: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Layers, badge: '4' },
    { id: 'pipelines', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'docker', label: 'Docker Images', icon: Box },
    { id: 'kubernetes', label: 'Kubernetes Clusters', icon: Server, badge: 'Strategies' },
    { id: 'incidents', label: 'AI Incident Manager', icon: AlertTriangle, badge: 'Live', badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
    { id: 'auto-healing', label: 'Auto-Healing Center', icon: Zap, badge: 'Approval', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { id: 'security', label: 'DevSecOps Security', icon: ShieldAlert, badge: 'Gates', badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
    { id: 'aws', label: 'AWS Infrastructure', icon: Cloud },
    { id: 'terraform', label: 'Terraform Automation', icon: FileCode2 },
    { id: 'ai-assistant', label: 'AI DevOps Assistant', icon: Sparkles, badge: 'Gemini' },
    { id: 'monitoring', label: 'Monitoring & Observability', icon: Activity },
    { id: 'history', label: 'Rollback & History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#080d1c]/80 backdrop-blur-2xl border-r border-slate-800/60 flex flex-col h-screen select-none shrink-0 shadow-2xl shadow-black/40 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            CloudOps <span className="text-xs px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30 font-mono">AI 2.0</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">DevOps & SRE Platform</span>
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
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeColor || (isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400')}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Terminal Quick Launcher */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onOpenTerminal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-mono group transition"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Interactive CLI</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ctrl+`</span>
        </button>
      </div>

      {/* Status Footer */}
      <div className="px-5 py-3 bg-[#080d1c]/90 backdrop-blur-md border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-mono text-slate-400">
            {isBackendConnected ? 'EKS Prod (us-east-1)' : 'Offline / Standby'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400 font-bold">v2.0</span>
      </div>
    </aside>
  );
};
