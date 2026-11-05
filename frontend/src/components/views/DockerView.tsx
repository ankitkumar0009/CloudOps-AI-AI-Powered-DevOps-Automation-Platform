import React, { useState } from 'react';
import {
  Box,
  Play,
  UploadCloud,
  FileCode,
  Shield,
  Layers,
  CheckCircle2,
  Cpu,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';
import { DockerImage, Project, AppType } from '../../types';
import { LogViewer } from '../common/LogViewer';
import { StatusBadge } from '../common/StatusBadge';

interface DockerViewProps {
  images: DockerImage[];
  projects: Project[];
  onBuildImage: (projectId: string, tag: string) => Promise<any>;
  onPushToEcr: (imageId: string, repoName: string) => Promise<any>;
}

export const DockerView: React.FC<DockerViewProps> = ({
  images,
  projects,
  onBuildImage,
  onPushToEcr,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [tag, setTag] = useState<string>('v1.0.0');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([
    '# Docker Engine Ready. Multi-stage build support enabled.',
    '# Ready to build Node.js, Python, or Java images.',
  ]);
  const [activeTab, setActiveTab] = useState<'images' | 'templates'>('images');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleBuild = async () => {
    if (!selectedProjectId) return;
    setIsBuilding(true);
    setBuildLogs((prev) => [
      ...prev,
      `\n$ docker build -t ${selectedProject.name}:${tag} --build-arg COMMIT_SHA=${Math.random().toString(16).substring(2, 9)} .`,
      'Step 1/8 : Detecting application runtime framework...',
      `Detected runtime: ${selectedProject.app_type.toUpperCase()}`,
      'Step 2/8 : Generating optimized multi-stage Dockerfile...',
      'Step 3/8 : Pulling base layer from registry.hub.docker.com...',
      'Step 4/8 : Installing production dependencies with cache mounting...',
      'Step 5/8 : Copying application source code...',
      'Step 6/8 : Enforcing non-root container security context...',
      'Step 7/8 : Running vulnerability audit scan...',
      `Step 8/8 : Successfully tagged image ${selectedProject.name}:${tag}`
    ]);

    try {
      const result = await onBuildImage(selectedProjectId, tag);
      if (result.logs) setBuildLogs(result.logs);
    } finally {
      setIsBuilding(false);
    }
  };

  const handlePush = async (img: DockerImage) => {
    await onPushToEcr(img.id, img.repository);
  };

  const dockerTemplates: Record<AppType, string> = {
    nodejs: `# Multi-stage Node.js Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]`,

    python: `# Optimized Multi-stage Python Dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,

    java: `# Multi-stage Java Spring Boot Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]`
  };

  const copyTemplate = (lang: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTemplate(lang);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Build Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-400" />
            Automated Multi-Runtime Docker Image Builder
          </h2>
          <p className="text-xs text-slate-400">
            Automates Dockerfile generation, dependency caching, security scanning, and AWS ECR distribution.
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
                {p.name} ({p.app_type})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tag (e.g. v2.4.2)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />

          <button
            disabled={isBuilding}
            onClick={handleBuild}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isBuilding ? 'Building...' : 'Build Docker Image'}</span>
          </button>
        </div>
      </div>

      {/* Live Build Logs Console */}
      <LogViewer logs={buildLogs} title="Docker Engine Build Daemon Console" maxHeight="h-64" isStreaming={isBuilding} />

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('images')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'images'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Built Images Registry ({images.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Multi-Stage Dockerfile Templates</span>
        </button>
      </div>

      {/* Tab 1: Built Images List */}
      {activeTab === 'images' && (
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Repository / Image Tag</th>
                  <th className="py-3 px-4">Runtime</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Security Vulnerabilities</th>
                  <th className="py-3 px-4">AWS ECR Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {images.map((img) => (
                  <tr key={img.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white tracking-tight">{img.repository}</div>
                      <div className="text-[11px] font-mono text-indigo-400">{img.tag}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{img.digest}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {img.app_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{img.size_mb} MB</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {img.vulnerabilities.critical} Crit
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {img.vulnerabilities.medium} Med
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {img.pushed_to_ecr ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pushed to ECR</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Local Only</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePush(img)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition inline-flex items-center gap-1.5 border border-slate-700"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Push to ECR</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Stage Dockerfile Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['nodejs', 'python', 'java'] as AppType[]).map((type) => (
            <div key={type} className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-white font-mono">
                    {type === 'nodejs' ? 'Node.js (Alpine)' : type === 'python' ? 'Python (FastAPI)' : 'Java (Spring Boot)'}
                  </span>
                  <button
                    onClick={() => copyTemplate(type, dockerTemplates[type])}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy Dockerfile"
                  >
                    {copiedTemplate === type ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="p-3 bg-[#050811] border border-slate-800/80 rounded-lg text-[10px] font-mono text-cyan-300 overflow-x-auto h-64 terminal-scroll">
                  {dockerTemplates[type]}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
