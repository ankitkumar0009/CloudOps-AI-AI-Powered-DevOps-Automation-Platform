import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { PipelineExecution, Project } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { LogViewer } from '../common/LogViewer';

interface PipelinesViewProps {
  pipelines: PipelineExecution[];
  projects: Project[];
  onTriggerPipeline: (projectId: string, branch: string) => void;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  pipelines,
  projects,
  onTriggerPipeline,
}) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [targetBranch, setTargetBranch] = useState<string>('main');

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0];

  const handleRunPipeline = () => {
    if (!selectedProjectId) return;
    onTriggerPipeline(selectedProjectId, targetBranch);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            GitHub Actions CI/CD Orchestration
          </h2>
          <p className="text-xs text-slate-400">
            End-to-end automated deployment pipeline with GitHub OIDC authentication for AWS ECR and EKS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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

          <input
            type="text"
            placeholder="branch (main)"
            value={targetBranch}
            onChange={(e) => setTargetBranch(e.target.value)}
            className="w-28 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={handleRunPipeline}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Pipeline</span>
          </button>
        </div>
      </div>

      {/* Selected Pipeline Visual Pipeline Stage Graph */}
      {selectedPipeline && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-white tracking-tight">
                  {selectedPipeline.project_name}
                </span>
                <span className="text-xs font-mono text-indigo-400">
                  #{selectedPipeline.id}
                </span>
                <StatusBadge status={selectedPipeline.status} />
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                <span>commit: {selectedPipeline.commit_sha}</span>
                <span>•</span>
                <span>branch: {selectedPipeline.branch}</span>
                <span>•</span>
                <span>duration: {selectedPipeline.duration || 'Running...'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Trigger: {selectedPipeline.commit_message}
              </span>
            </div>
          </div>

          {/* Flowchart / Stage Progression */}
          <div className="relative overflow-x-auto py-2">
            <div className="flex items-center min-w-[760px] justify-between relative">
              {selectedPipeline.stages.map((stage, idx) => {
                const isSuccess = stage.status === 'success';
                const isFailed = stage.status === 'failed';
                const isRunning = stage.status === 'running';

                return (
                  <React.Fragment key={stage.id}>
                    <div className="flex flex-col items-center text-center relative group z-10">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          isSuccess
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                            : isFailed
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10'
                            : isRunning
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 animate-pulse'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isFailed ? (
                          <XCircle className="w-5 h-5" />
                        ) : isRunning ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                        ) : (
                          <span className="text-xs font-mono font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-200 mt-2 tracking-tight">
                        {stage.name}
                      </span>
                      {stage.duration && (
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {stage.duration}
                        </span>
                      )}
                      {stage.details && (
                        <span className="text-[9px] text-slate-400 max-w-[120px] truncate mt-0.5">
                          {stage.details}
                        </span>
                      )}
                    </div>

                    {idx < selectedPipeline.stages.length - 1 && (
                      <div className="flex-1 h-0.5 bg-slate-800 mx-2 relative -top-4">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isSuccess ? 'bg-emerald-500/60' : isFailed ? 'bg-rose-500/40' : 'bg-slate-800'
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Real-time Logs Viewer */}
          <LogViewer
            logs={selectedPipeline.logs}
            title={`Workflow Logs: ${selectedPipeline.project_name} (${selectedPipeline.commit_sha})`}
            maxHeight="h-72"
            isStreaming={selectedPipeline.status === 'running'}
          />
        </div>
      )}

      {/* Historical Pipeline Runs List */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3">All Pipeline Executions</h3>
        <div className="divide-y divide-slate-800/80">
          {pipelines.map((pipe) => (
            <div
              key={pipe.id}
              onClick={() => setSelectedPipelineId(pipe.id)}
              className={`py-3.5 px-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition ${
                pipe.id === selectedPipeline?.id
                  ? 'bg-indigo-600/10 border border-indigo-500/30'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{pipe.project_name}</span>
                    <span className="text-[11px] font-mono text-slate-400">({pipe.commit_sha})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-md">{pipe.commit_message}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">{pipe.duration || 'Running'}</span>
                <StatusBadge status={pipe.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

