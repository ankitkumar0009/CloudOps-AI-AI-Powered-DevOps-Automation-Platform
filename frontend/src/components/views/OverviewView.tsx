import React from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Box,
  Server,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  Play
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { SystemOverview } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface OverviewViewProps {
  overview: SystemOverview;
  onNavigate: (section: any) => void;
  onDeploy: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ overview, onNavigate, onDeploy }) => {
  const telemetryData = [
    { time: '10:00', cpu: 28, memory: 44, latency: 18 },
    { time: '11:00', cpu: 34, memory: 46, latency: 22 },
    { time: '12:00', cpu: 52, memory: 58, latency: 29 },
    { time: '13:00', cpu: 46, memory: 55, latency: 24 },
    { time: '14:00', cpu: 61, memory: 63, latency: 31 },
    { time: '15:00', cpu: 48, memory: 59, latency: 25 },
    { time: '16:00', cpu: 39, memory: 52, latency: 20 },
  ];

  const deploymentData = [
    { day: 'Mon', success: 6, failed: 0 },
    { day: 'Tue', success: 8, failed: 1 },
    { day: 'Wed', success: 5, failed: 0 },
    { day: 'Thu', success: 9, failed: 1 },
    { day: 'Fri', success: 7, failed: 0 },
    { day: 'Sat', success: 3, failed: 0 },
    { day: 'Sun', success: 2, failed: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Callout */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            EKS Production Cluster: Healthy
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Automated DevOps & Continuous Deployment
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Autonomous software delivery pipeline with Git source integration, automated container builds, AWS ECR publishing, Kubernetes orchestration, and Gemini-powered fault diagnosis.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-medium text-slate-200 transition shadow"
          >
            Diagnose Logs
          </button>
          <button
            onClick={onDeploy}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Deployment</span>
          </button>
        </div>

        {/* Ambient decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Active Projects"
          value={overview.total_projects}
          icon={Layers}
          iconColor="text-indigo-400"
          badge="4 Apps"
        />
        <StatCard
          title="Successful Deploys"
          value={overview.successful_deployments}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          change="+18%"
        />
        <StatCard
          title="Failed Deploys"
          value={overview.failed_deployments}
          icon={XCircle}
          iconColor="text-rose-400"
          change="-50%"
          isPositive={true}
        />
        <StatCard
          title="Running Containers"
          value={overview.running_containers}
          icon={Box}
          iconColor="text-cyan-400"
          badge="Docker"
        />
        <StatCard
          title="Kubernetes Pods"
          value={overview.active_k8s_pods}
          icon={Server}
          iconColor="text-purple-400"
          badge="EKS"
        />
        <StatCard
          title="Pipeline Success"
          value={`${overview.pipeline_success_rate}%`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          badge="OIDC"
        />
      </div>

      {/* Real-time Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Resource Telemetry */}
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Cluster Telemetry (CPU & Memory)
              </h3>
              <p className="text-xs text-slate-400">Live utilization across Amazon EKS worker nodes</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> CPU (%)
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Memory (%)
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" />
                <Area type="monotone" dataKey="memory" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#memGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Deployment Velocity */}
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Deployment Frequency & Reliability
              </h3>
              <p className="text-xs text-slate-400">Total automated pipelines executed by day</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              93.3% Success Rate
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deploymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="success" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Deployment Activity Feed */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Recent Deployment Activity</h3>
            <p className="text-xs text-slate-400">Audit trail of automated builds, deployments, and rollbacks</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>View Full Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {overview.recent_activity.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.status === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}
                >
                  {item.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : item.status === 'warning' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <Box className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white tracking-tight">{item.title}</div>
                  <div className="text-[11px] text-slate-400">{item.description}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                <StatusBadge status={item.status === 'warning' ? 'Rolled Back' : 'Success'} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
