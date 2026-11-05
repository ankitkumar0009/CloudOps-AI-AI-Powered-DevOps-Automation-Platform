import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Clock
} from 'lucide-react';
import { RollbackRecord, Project } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface HistoryRollbackViewProps {
  rollbacks: RollbackRecord[];
  projects: Project[];
  onTriggerRollback: (projectId: string, deploymentName: string, targetRevision?: number) => Promise<any>;
}

export const HistoryRollbackView: React.FC<HistoryRollbackViewProps> = ({
  rollbacks,
  projects,
  onTriggerRollback,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [targetRevision, setTargetRevision] = useState<number>(1);
  const [confirmRollback, setConfirmRollback] = useState<{ projectId: string; deploymentName: string; revision: number } | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const deploymentHistoryRecords = [
    {
      id: 'dep-1004',
      project: 'payment-gateway-service',
      version: 'v2.4.2',
      sha: '7f39b1a',
      status: 'success',
      author: 'Ankit Chaudhary',
      deployedAt: '5 mins ago',
      revision: 4,
      canRollback: true
    },
    {
      id: 'dep-1003',
      project: 'orders-api',
      version: 'v3.1.0-rc1',
      sha: 'c8812e9',
      status: 'rolled_back',
      author: 'GitHub Actions',
      deployedAt: '1 hour ago',
      revision: 5,
      canRollback: false
    },
    {
      id: 'dep-1002',
      project: 'auth-service',
      version: 'v1.8.0',
      sha: 'c9417ae',
      status: 'success',
      author: 'DevOps Lead',
      deployedAt: '5 hours ago',
      revision: 2,
      canRollback: true
    },
    {
      id: 'dep-1001',
      project: 'payment-gateway-service',
      version: 'v2.4.1',
      sha: 'e9a12cf',
      status: 'success',
      author: 'Ankit Chaudhary',
      deployedAt: '1 day ago',
      revision: 3,
      canRollback: true
    }
  ];

  const handleRollbackClick = (proj: string, rev: number) => {
    const matched = projects.find((p) => p.name === proj) || projects[0];
    setConfirmRollback({
      projectId: matched.id,
      deploymentName: matched.name,
      revision: rev
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Automated Rollback Engine & Deployment History
          </h2>
          <p className="text-xs text-slate-400">
            Automated failure detection and instant 1-click Kubernetes rollout undo across fleet services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleRollbackClick(selectedProject.name, 1)}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 flex items-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback Selected App</span>
          </button>
        </div>
      </div>

      {/* Deployment History Table */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">Recent Deployment Releases</h3>
          <span className="text-xs font-mono text-slate-400">Managed via Kubernetes Deployments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Release ID / Project</th>
                <th className="py-3 px-4">Image Tag / Commit SHA</th>
                <th className="py-3 px-4">K8s Revision</th>
                <th className="py-3 px-4">Triggered By</th>
                <th className="py-3 px-4">Deployed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {deploymentHistoryRecords.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white tracking-tight">{d.project}</div>
                    <div className="text-[10px] font-mono text-slate-500">{d.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-indigo-400 text-xs">{d.version}</div>
                    <div className="text-[10px] font-mono text-slate-500">{d.sha}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-300">rev #{d.revision}</td>
                  <td className="py-3 px-4 text-slate-300">{d.author}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{d.deployedAt}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {d.canRollback && (
                      <button
                        onClick={() => handleRollbackClick(d.project, d.revision - 1)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 border border-slate-700 transition text-[11px] font-mono inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-rose-400" />
                        <span>Rollback to rev #{d.revision - 1}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Rollback Audit Log */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          Rollback Audit Log & Incident Records
        </h3>

        <div className="divide-y divide-slate-800/80">
          {rollbacks.map((rb) => (
            <div key={rb.id} className="py-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white tracking-tight">{rb.project_name}</span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-xs font-mono text-rose-400">{rb.from_version}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-mono text-emerald-400">{rb.to_version}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400">{rb.timestamp}</span>
                  <StatusBadge status="Success" size="sm" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rb.reason}</p>

              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-400">
                <span className="text-indigo-400">Triggered by:</span>
                <span>{rb.triggered_by}</span>
                <span>|</span>
                <span className="text-cyan-400">Executed:</span>
                <span className="text-slate-300 truncate">{rb.k8s_command}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rollback Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmRollback !== null}
        title="Confirm Kubernetes Deployment Rollback"
        description={`Are you sure you want to revert deployment "${confirmRollback?.deploymentName}" to revision #${confirmRollback?.revision}? This will immediately invoke kubectl rollout undo and drain non-matching pods.`}
        commandPreview={`kubectl rollout undo deployment/${confirmRollback?.deploymentName} --to-revision=${confirmRollback?.revision} -n production`}
        isDestructive={false}
        onConfirm={async () => {
          if (!confirmRollback) return;
          await onTriggerRollback(confirmRollback.projectId, confirmRollback.deploymentName, confirmRollback.revision);
          setConfirmRollback(null);
        }}
        onCancel={() => setConfirmRollback(null)}
      />
    </div>
  );
};

