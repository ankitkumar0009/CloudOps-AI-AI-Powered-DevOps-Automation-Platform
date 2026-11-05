import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['success', 'running', 'active', 'healthy', 'ready'].includes(norm)) {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (['failed', 'error', 'degraded', 'offline', 'rolled_back', 'crashloopbackoff'].includes(norm)) {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (['pending', 'provisioning', 'progressing', 'in_progress', 'idle'].includes(norm)) {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium font-mono rounded-md border ${padding} ${styles}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ['success', 'running', 'active', 'healthy'].includes(norm)
            ? 'bg-emerald-400 animate-pulse'
            : ['failed', 'error', 'crashloopbackoff'].includes(norm)
            ? 'bg-rose-400'
            : 'bg-amber-400'
        }`}
      />
      {status}
    </span>
  );
};
