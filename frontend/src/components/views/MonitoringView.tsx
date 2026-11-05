import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Server,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const MonitoringView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [showEmbeddedGrafana, setShowEmbeddedGrafana] = useState(false);

  const cpuData = [
    { time: '16:00', payment: 38, auth: 22, orders: 12 },
    { time: '16:10', payment: 45, auth: 25, orders: 18 },
    { time: '16:20', payment: 58, auth: 31, orders: 24 },
    { time: '16:30', payment: 42, auth: 27, orders: 65 },
    { time: '16:40', payment: 49, auth: 29, orders: 72 },
    { time: '16:50', payment: 39, auth: 24, orders: 15 },
    { time: '17:00', payment: 41, auth: 26, orders: 18 },
  ];

  const responseTimeData = [
    { time: '16:00', p95: 45, p99: 98, avg: 22 },
    { time: '16:10', p95: 52, p99: 110, avg: 24 },
    { time: '16:20', p95: 68, p99: 145, avg: 31 },
    { time: '16:30', p95: 85, p99: 190, avg: 42 },
    { time: '16:40', p95: 64, p99: 130, avg: 28 },
    { time: '16:50', p95: 48, p99: 102, avg: 23 },
    { time: '17:00', p95: 46, p99: 99, avg: 21 },
  ];

  const cloudWatchAlarms = [
    { name: 'HighMemory-EKS-Workers', metric: 'MemoryUtilization > 85%', state: 'OK', region: 'us-east-1' },
    { name: 'TargetResponseTime-ALB-5XX', metric: 'HTTPCode_Target_5XX_Count > 5', state: 'OK', region: 'us-east-1' },
    { name: 'PodCrashLoopBackOff-Alarm', metric: 'kube_pod_container_status_restarts_total > 3', state: 'ALARM', region: 'us-east-1' },
    { name: 'ECR-ImageScanVulnerabilities', metric: 'HIGH_CRITICAL_CVE_COUNT > 0', state: 'OK', region: 'us-east-1' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Prometheus, Grafana & Amazon CloudWatch Observability
          </h2>
          <p className="text-xs text-slate-400">
            Real-time metric scrape intervals, latency percentiles, and active CloudWatch alert rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
            {['15m', '1h', '6h', '24h'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === r ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowEmbeddedGrafana(!showEmbeddedGrafana)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <span>{showEmbeddedGrafana ? 'Hide Live Portal' : 'Preview Portal'}</span>
          </button>

          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-xs font-medium text-red-300 border border-red-500/40 transition flex items-center gap-1.5 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Prometheus (:9090)</span>
            <ExternalLink className="w-3 h-3 text-red-400" />
          </a>

          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-xs font-medium text-orange-300 border border-orange-500/40 transition flex items-center gap-1.5 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Open Grafana (:3001)</span>
            <ExternalLink className="w-3 h-3 text-orange-400" />
          </a>
        </div>
      </div>

      {showEmbeddedGrafana && (
        <div className="bg-[#181b1f] border border-orange-500/30 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#111217] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white font-semibold">Grafana Live Observability Portal</span>
              <span className="text-slate-500 font-mono text-[11px]">(http://localhost:3001)</span>
            </div>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>Full Screen / New Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe
            src="http://localhost:3001"
            title="Grafana Observability Portal"
            className="w-full h-[650px] border-none"
          />
        </div>
      )}

      {/* Top Metrics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Fleet Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">99.98%</div>
          <span className="text-[11px] text-slate-400">Past 30 days</span>
        </div>

        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Average P95 Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">46 ms</div>
          <span className="text-[11px] text-slate-400">Target &lt; 100ms</span>
        </div>

        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Container Restarts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">5 restarts</div>
          <span className="text-[11px] text-rose-400">orders-api (OOM)</span>
        </div>

        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Prometheus Targets</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">12 / 12 UP</div>
          <span className="text-[11px] text-emerald-400">Scrape interval: 15s</span>
        </div>
      </div>

      {/* Observability Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Microservice CPU Distribution */}
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Service CPU Allocation (% millicores)
              </h3>
              <p className="text-xs text-slate-400">Scraped from cAdvisor & Kube-State-Metrics</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-indigo-400">payment</span> |{' '}
              <span className="text-cyan-400">auth</span> |{' '}
              <span className="text-amber-400">orders</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="payment" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#pGrad)" />
                <Area type="monotone" dataKey="auth" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#aGrad)" />
                <Area type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} fillOpacity={0.2} fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Percentiles */}
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Response Latency (P99, P95 & Avg in ms)
              </h3>
              <p className="text-xs text-slate-400">Aggregated via Ingress Controller & ALB Access Logs</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-rose-400">P99</span> |{' '}
              <span className="text-cyan-400">P95</span> |{' '}
              <span className="text-emerald-400">Avg</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="p99" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CloudWatch Alarms Table */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          Amazon CloudWatch Infrastructure Alarms
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Alarm Name</th>
                <th className="py-3 px-4">Metric Condition</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4 text-right">Alarm State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {cloudWatchAlarms.map((a) => (
                <tr key={a.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-white">{a.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{a.metric}</td>
                  <td className="py-3 px-4 font-mono text-indigo-400">{a.region}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        a.state === 'OK'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {a.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

