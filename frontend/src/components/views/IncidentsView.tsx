import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  Server, 
  Terminal, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { Incident, RecoveryAction } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';

interface IncidentsViewProps {
  onSelectAction?: (actionId: string) => void;
  onNavigateToHealing?: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ onNavigateToHealing }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    setLoading(true);
    try {
      const updated = await api.detectIncidents();
      setIncidents(updated);
      if (updated.length > 0) setSelectedIncident(updated[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const total = incidents.length;
  const activeCount = incidents.filter(i => i.status === 'active' || i.status === 'investigating' || i.status === 'recovery_pending').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;

  const filtered = incidents.filter(i => {
    if (activeTab === 'active') return i.status !== 'resolved';
    if (activeTab === 'resolved') return i.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-[#0d1322] to-slate-900/60 p-5 rounded-2xl border border-red-500/20 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              SRE Autonomic Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">Module 2: AI Incident Management</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Incident Detection & Diagnostics</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time anomaly scanner capturing CrashLoopBackOff, OOMKilled, and 5xx spikes. Powered by Google Gemini AI root cause reasoning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDetect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Scan Cluster Now
          </button>
          {onNavigateToHealing && (
            <button
              onClick={onNavigateToHealing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Auto-Healing Center
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Incidents"
          value={activeCount}
          subtitle={activeCount > 0 ? "Requires SRE attention" : "All clusters nominal"}
          icon={AlertTriangle}
          trend={activeCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Critical Severities"
          value={criticalCount}
          subtitle="Impacts production traffic"
          icon={ShieldAlert}
          trend={criticalCount > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Resolved via Auto-Healing"
          value={resolvedCount}
          subtitle="Automated post-checks passed"
          icon={CheckCircle2}
          trend="success"
        />
        <StatCard
          title="Mean Time To Recover (MTTR)"
          value="48s"
          subtitle="Gemini AI autonomous triage"
          icon={Clock}
          trend="neutral"
        />
      </div>

      {/* Main Layout: Incident Queue & Detailed Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incident Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({total})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'resolved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{filtered.length} incidents shown</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isCrit = inc.severity === 'critical';
              const isResolved = inc.status === 'resolved';

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/80'
                  }`}
                >
                  {isCrit && !isResolved && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  )}
                  {isResolved && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                        isCrit ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {inc.error_type}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{inc.service}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                      isResolved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-2 font-medium line-clamp-2">
                    {inc.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
                    <span className="font-mono text-[10px] text-slate-500">Namespace: {inc.environment}</span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(inc.detected_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Root Cause Analysis & Solution Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="bg-[#0f172a]/70 rounded-2xl border border-slate-800 p-6 space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{selectedIncident.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      {selectedIncident.environment}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedIncident.title}</h3>
                </div>

                {selectedIncident.status !== 'resolved' && onNavigateToHealing && (
                  <button
                    onClick={onNavigateToHealing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
                  >
                    <span>Remediate in Healing Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Gemini AI Root Cause Diagnostic Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide uppercase">Google Gemini AI Root Cause Analysis</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Confidence: 98%
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {selectedIncident.root_cause}
                </p>
              </div>

              {/* Real-time Telemetry Snapshot */}
              {selectedIncident.metrics_snapshot && Object.keys(selectedIncident.metrics_snapshot).length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Metrics Snapshot at Incident Trigger</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedIncident.metrics_snapshot).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">{k.replace('_', ' ')}</span>
                        <span className="text-slate-100 font-bold font-mono mt-0.5 block">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Crash Log Snippet */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  Captured Incident Crash Log
                </span>
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto leading-relaxed">
                  {selectedIncident.log_snippet || "No additional log output captured."}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-medium">Select an incident from the feed to view AI root cause diagnosis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

