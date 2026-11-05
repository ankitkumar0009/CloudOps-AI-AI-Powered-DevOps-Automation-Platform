import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = 'text-indigo-400',
  badge,
}) => {
  return (
    <div className="bg-[#080d1c]/65 backdrop-blur-md border border-slate-800/70 rounded-xl p-4 shadow-lg hover:border-indigo-500/40 transition-all hover:bg-[#080d1c]/80 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {badge}
          </span>
        )}
      </div>
      {change && (
        <div className="mt-2 flex items-center text-xs">
          <span className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {change}
          </span>
          <span className="text-slate-400 ml-1.5 text-[11px]">vs last 7 days</span>
        </div>
      )}
    </div>
  );
};

