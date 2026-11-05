import React from 'react';
import {
  Bell,
  Play,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Github
} from 'lucide-react';
import { SectionId } from './Sidebar';

interface HeaderProps {
  currentSection: SectionId;
  onDeployClick: () => void;
  onAiClick: () => void;
  systemStatus: 'Healthy' | 'Degraded' | 'Offline';
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onDeployClick,
  onAiClick,
  systemStatus,
}) => {
  const titles: Record<SectionId, { title: string; subtitle: string }> = {
    overview: { title: 'Platform Overview', subtitle: 'Real-time telemetry, cluster health, and pipeline analytics' },
    projects: { title: 'Project Management', subtitle: 'Manage repositories, branches, container limits and env vars' },
    pipelines: { title: 'CI/CD Pipelines', subtitle: 'GitHub Actions workflow executions and stage orchestration' },
    docker: { title: 'Automated Docker Builds', subtitle: 'Multi-runtime container image builder and vulnerability scanning' },
    kubernetes: { title: 'Kubernetes Workloads', subtitle: 'EKS pod status, deployments, replica scaling and events' },
    aws: { title: 'AWS Cloud Infrastructure', subtitle: 'EC2, EKS, ECR, S3, IAM OIDC and CloudWatch observability' },
    terraform: { title: 'Terraform Infrastructure as Code', subtitle: 'Declarative AWS provisioning with safety confirmation guardrails' },
    'ai-assistant': { title: 'Gemini AI DevOps Assistant', subtitle: 'Automated failure diagnosis, root cause analysis, and remediation' },
    monitoring: { title: 'Monitoring & Metrics', subtitle: 'Prometheus metrics, Grafana dashboards, and CloudWatch telemetry' },
    history: { title: 'Deployment History & Rollback', subtitle: 'Audit log of past releases with 1-click Kubernetes rollout undo' },
    settings: { title: 'Platform Settings', subtitle: 'Cloud credentials, Gemini API key, and cluster connection profiles' },
  };

  const current = titles[currentSection] || { title: 'DevOps Platform', subtitle: 'Automation dashboard' };

  return (
    <header className="h-16 bg-[#0d1322]/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex flex-col">
        <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* AWS Cluster Region Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded-md text-xs font-mono text-slate-300">
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span>aws:us-east-1</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400">eks-prod-cluster</span>
        </div>

        {/* System Health Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700/60 rounded-md text-xs">
          {systemStatus === 'Healthy' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className={systemStatus === 'Healthy' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
            {systemStatus}
          </span>
        </div>

        {/* AI Quick Button */}
        <button
          onClick={onAiClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 hover:border-indigo-500 text-xs font-medium text-indigo-300 hover:text-white transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Ask AI Assistant</span>
        </button>

        {/* Trigger Deployment Button */}
        <button
          onClick={onDeployClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/25 transition active:scale-95"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Deploy</span>
        </button>
      </div>
    </header>
  );
};

