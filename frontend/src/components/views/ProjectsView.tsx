import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Github,
  GitBranch,
  Play,
  Trash2,
  ExternalLink,
  Cpu,
  HardDrive,
  Settings2,
  Box,
  Check
} from 'lucide-react';
import { Project, AppType } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface ProjectsViewProps {
  projects: Project[];
  onCreateProject: (project: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onDeployProject: (projectId: string) => void;
  onNavigateToPipelines: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onCreateProject,
  onDeleteProject,
  onDeployProject,
  onNavigateToPipelines,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [appType, setAppType] = useState<AppType>('nodejs');
  const [port, setPort] = useState(3000);
  const [replicas, setReplicas] = useState(2);
  const [cpuLimit, setCpuLimit] = useState('500m');
  const [memoryLimit, setMemoryLimit] = useState('512Mi');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('production');
  const [envVarsRaw, setEnvVarsRaw] = useState('NODE_ENV=production\nLOG_LEVEL=info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !repoUrl) return;

    const envVars: Record<string, string> = {};
    envVarsRaw.split('\n').forEach((line) => {
      const [k, ...v] = line.split('=');
      if (k && v.length) envVars[k.trim()] = v.join('=').trim();
    });

    onCreateProject({
      name,
      repo_url: repoUrl,
      branch,
      app_type: appType,
      port,
      replicas,
      cpu_limit: cpuLimit,
      memory_limit: memoryLimit,
      environment,
      env_vars: envVars,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_deployment_status: 'success',
      deployment_count: 1,
    });

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setRepoUrl('');
    setBranch('main');
    setAppType('nodejs');
    setPort(3000);
    setReplicas(2);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Connected Applications & Repositories
          </h2>
          <p className="text-xs text-slate-400">
            Configure Git source tracking, automated Dockerfile detection, and Kubernetes resource specs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Connect GitHub Repo</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div>
              {/* Project Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">{project.name}</h3>
                    <StatusBadge status={project.last_deployment_status || 'Success'} size="sm" />
                  </div>
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 mt-1 transition font-mono truncate max-w-xs"
                  >
                    <Github className="w-3 h-3 shrink-0" />
                    <span className="truncate">{project.repo_url.replace('https://github.com/', '')}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </div>

                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {project.app_type}
                </span>
              </div>

              {/* Meta Specifications */}
              <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-mono text-white text-[11px]">{project.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Replicas:</span>
                  <span className="font-mono text-white text-[11px]">{project.replicas} pods</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-slate-400">CPU Limit:</span>
                  <span className="font-mono text-white text-[11px]">{project.cpu_limit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Memory:</span>
                  <span className="font-mono text-white text-[11px]">{project.memory_limit}</span>
                </div>
              </div>

              {/* Environment Variables summary */}
              <div className="text-[11px] text-slate-400 mb-4">
                <span className="font-medium text-slate-300">Target Port:</span> {project.port} |{' '}
                <span className="font-medium text-slate-300">Env:</span>{' '}
                <span className="capitalize text-indigo-300">{project.environment}</span> ({Object.keys(project.env_vars || {}).length} vars)
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                {project.deployment_count || 1} deployments total
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 border border-slate-800 transition"
                  title="Delete Application"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeployProject(project.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow transition flex items-center gap-1.5 active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Build & Deploy</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connect GitHub Repository Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Github className="w-5 h-5 text-indigo-400" />
              Connect GitHub Repository
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter source code repository details to automate Dockerization and Kubernetes rollout.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. payment-service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/org/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Branch</label>
                  <input
                    type="text"
                    required
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Runtime Type</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as AppType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="nodejs">Node.js</option>
                    <option value="python">Python FastAPI/Flask</option>
                    <option value="java">Java Spring Boot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pod Replicas</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={replicas}
                    onChange={(e) => setReplicas(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">CPU Limit</label>
                  <input
                    type="text"
                    value={cpuLimit}
                    onChange={(e) => setCpuLimit(e.target.value)}
                    placeholder="500m"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Memory Limit</label>
                  <input
                    type="text"
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(e.target.value)}
                    placeholder="512Mi"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Environment Variables (KEY=VALUE per line)</label>
                <textarea
                  rows={3}
                  value={envVarsRaw}
                  onChange={(e) => setEnvVarsRaw(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition"
                >
                  Save & Initialize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

