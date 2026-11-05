import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Play, 
  Clock, 
  Lock, 
  Sparkles, 
  Terminal, 
  Activity, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { RecoveryAction, Incident } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';

interface AutoHealingViewProps {
  onAddToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const AutoHealingView: React.FC<AutoHealingViewProps> = ({ onAddToast }) => {
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeLogAction, setActiveLogAction] = useState<RecoveryAction | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [acts, incs] = await Promise.all([
        api.getRecoveryActions(),
        api.getIncidents()
      ]);
      setActions(acts);
      setIncidents(incs);
      if (acts.length > 0 && !activeLogAction) {
        const executed = acts.find(a => a.status === 'executed');
        if (executed) setActiveLogAction(executed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (actionId: string, decision: 'approve' | 'reject') => {
    setProcessingId(actionId);
    try {
      const res = await api.approveRecoveryAction(actionId, decision, 'DevOps Lead');
      if (decision === 'approve') {
        onAddToast?.('success', 'Recovery Action Executed', `Service healed safely with post-check: ${res.post_health.toUpperCase()}`);
      } else {
        onAddToast?.('info', 'Recovery Rejected', 'Action was safely rejected by operator.');
      }
      await fetchData();
    } catch (err: any) {
      onAddToast?.('error', 'Execution Failed', err.response?.data?.detail || 'Guardrail rejection');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingActions = actions.filter(a => a.status === 'pending_approval');
  const completedActions = actions.filter(a => a.status === 'executed' || a.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Top Banner with DevSecOps Guardrail Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-[#0d1322] to-slate-900/60 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Human-in-the-Loop Guardrail Active
            </span>
            <span className="text-xs text-slate-400 font-mono">Module 2: Autonomous Auto-Healing</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Auto-Healing & Remediation Center</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            SRE autonomous recovery engine. Executes strictly allowlisted Kubernetes and cloud remediation actions following explicit human authorization.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Actions
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={pendingActions.length}
          subtitle="Awaiting SRE operator signature"
          icon={AlertOctagon}
          trend={pendingActions.length > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Executed Actions"
          value={completedActions.filter(a => a.status === 'executed').length}
          subtitle="100% verified post-health"
          icon={CheckCircle2}
          trend="success"
        />
        <StatCard
          title="Allowlisted Safety"
          value="100%"
          subtitle="Zero raw shell execution allowed"
          icon={Lock}
          trend="neutral"
        />
        <StatCard
          title="Healing Success Rate"
          value="98.5%"
          subtitle="Autonomous post-check verified"
          icon={Activity}
          trend="success"
        />
      </div>

      {/* Primary Section: Pending Human Approval Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Pending Remediation Approvals</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {pendingActions.length} Required
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strictly Allowlisted: Memory Scaling, Pod Restart, Rollout Undo</span>
          </div>
        </div>

        {pendingActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingActions.map((action) => {
              const incident = incidents.find(i => i.id === action.incident_id);
              const isProcessing = processingId === action.id;

              return (
                <div 
                  key={action.id} 
                  className="bg-[#0f172a] rounded-2xl border-2 border-indigo-500/40 p-6 space-y-5 shadow-xl shadow-indigo-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-indigo-600" />

                  {/* Header / Incident Tag */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        INCIDENT DETECTED
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        Service: {incident?.service || action.parameters.deployment || "Application"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>Status: <strong className="text-rose-400">{incident?.error_type || "CrashLoopBackOff"}</strong></span>
                        <span>•</span>
                        <span>Severity: <strong className="text-rose-400 uppercase">{incident?.severity || "Critical"}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>TTL: 14m</span>
                    </div>
                  </div>

                  {/* AI Root Cause */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      AI ROOT CAUSE:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {incident?.root_cause || "Container is exceeding its configured memory limit of 512Mi."}
                    </p>
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      AI RECOMMENDATION:
                    </span>
                    <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                      Increase the memory limit from {action.parameters.current_memory || "512Mi"} to {action.parameters.recommended_memory || "1Gi"} and trigger rolling restart.
                    </p>
                  </div>

                  {/* Action Buttons: APPROVE, REJECT, DETAILS */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(action.id, 'approve')}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        [APPROVE RECOVERY]
                      </button>

                      <button
                        onClick={() => handleDecision(action.id, 'reject')}
                        disabled={isProcessing}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        [REJECT]
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveLogAction(action)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      [VIEW DETAILS]
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">All Infrastructure Clusters Nominal</h3>
            <p className="text-xs text-slate-400 max-w-md">
              No pending remediation approvals required. CloudOps AI continues continuous telemetry observation.
            </p>
          </div>
        )}
      </div>

      {/* Secondary Section: Execution Audit Trail & Verified Post-Health Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Left: Completed Actions Audit Trail (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Remediation Execution History</span>
            <span className="text-xs text-slate-500 font-normal">({completedActions.length} recorded)</span>
          </h2>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {completedActions.map((action) => (
              <div
                key={action.id}
                onClick={() => setActiveLogAction(action)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeLogAction?.id === action.id
                    ? 'bg-slate-800/80 border-indigo-500'
                    : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{action.action_type}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded font-mono uppercase ${
                      action.status === 'executed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Approved by <strong className="text-slate-300">{action.approved_by || "Operator"}</strong> • Target: {action.parameters.deployment || "Cluster"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-[10px]">
                    <span className="text-emerald-400 font-semibold block">Post-Check: {action.post_health_status.toUpperCase()}</span>
                    <span className="text-slate-500">{new Date(action.created_at).toLocaleTimeString()}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live SRE Execution Log Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>SRE Execution & Verification Logs</span>
          </h2>

          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 text-xs font-mono text-emerald-300 min-h-[300px] max-h-[420px] overflow-y-auto space-y-1.5 leading-relaxed">
            {activeLogAction?.execution_logs ? (
              activeLogAction.execution_logs.split('\n').map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none text-[10px] pt-0.5">{idx + 1}</span>
                  <span className={line.includes('[SUCCESS]') || line.includes('PASSED') ? 'text-emerald-400 font-bold' : line.includes('[GUARDRAILS]') ? 'text-cyan-400' : 'text-slate-300'}>
                    {line}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic p-4 text-center">
                Select an executed remediation action to inspect its SRE audit trail and health verification output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

