import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Cpu,
  HardDrive,
  Copy,
  Check,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileCode,
  Sliders
} from 'lucide-react';
import { KubernetesPod, KubernetesDeployment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface KubernetesViewProps {
  pods: KubernetesPod[];
  deployments: KubernetesDeployment[];
  events: string[];
  onScaleDeployment: (name: string, replicas: number) => Promise<any>;
  onRefresh: () => void;
}

export const KubernetesView: React.FC<KubernetesViewProps> = ({
  pods,
  deployments,
  events,
  onScaleDeployment,
  onRefresh,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [scalingName, setScalingName] = useState<string | null>(null);
  const [targetReplicas, setTargetReplicas] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'pods' | 'deployments' | 'yaml'>('pods');
  const [copiedYaml, setCopiedYaml] = useState(false);

  const filteredPods = selectedNamespace === 'all'
    ? pods
    : pods.filter((p) => p.namespace === selectedNamespace);

  const filteredDeployments = selectedNamespace === 'all'
    ? deployments
    : deployments.filter((d) => d.namespace === selectedNamespace);

  const sampleK8sYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  namespace: production
  labels:
    app: payment-gateway
    env: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
    spec:
      containers:
      - name: payment-gateway
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway:v2.4.2
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "200m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: payment-gateway-svc
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: payment-gateway
  ports:
  - port: 80
    targetPort: 3000`;

  const handleScaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scalingName) return;
    await onScaleDeployment(scalingName, targetReplicas);
    setScalingName(null);
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(sampleK8sYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Kubernetes Top Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Amazon EKS & Local Minikube Orchestration
          </h2>
          <p className="text-xs text-slate-400">
            Real-time pod lifecycle telemetry, declarative deployment scaling, and cluster event streaming.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Namespaces</option>
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="development">development</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Cluster State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pods')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'pods'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Active Pods ({filteredPods.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('deployments')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'deployments'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Deployments ({filteredDeployments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('yaml')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'yaml'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Kubernetes Manifest Spec (YAML)</span>
        </button>
      </div>

      {/* Tab 1: Pods */}
      {activeTab === 'pods' && (
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pod Name</th>
                  <th className="py-3 px-4">Namespace</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ready</th>
                  <th className="py-3 px-4">Restarts</th>
                  <th className="py-3 px-4">CPU Usage</th>
                  <th className="py-3 px-4">Memory</th>
                  <th className="py-3 px-4">Worker Node IP</th>
                  <th className="py-3 px-4">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredPods.map((pod) => (
                  <tr key={pod.name} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-white">{pod.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{pod.namespace}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={pod.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{pod.ready}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={pod.restarts > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {pod.restarts}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{pod.cpu_usage}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{pod.memory_usage}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{pod.node}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{pod.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Deployments */}
      {activeTab === 'deployments' && (
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Deployment</th>
                  <th className="py-3 px-4">Namespace</th>
                  <th className="py-3 px-4">Replicas (Avail/Desired)</th>
                  <th className="py-3 px-4">Container Image</th>
                  <th className="py-3 px-4">Health Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredDeployments.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white tracking-tight">{d.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{d.namespace}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-bold">{d.available_replicas}</span> / {d.desired_replicas}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">{d.image}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setScalingName(d.name);
                          setTargetReplicas(d.desired_replicas);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition inline-flex items-center gap-1.5 border border-slate-700"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Scale Replicas</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: YAML Manifest Generator */}
      {activeTab === 'yaml' && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200">
              Generated Production Manifest (Deployment & Service)
            </span>
            <button
              onClick={copyYaml}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
            >
              {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedYaml ? 'Copied' : 'Copy YAML'}</span>
            </button>
          </div>
          <pre className="p-4 bg-[#050811] border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto h-80 terminal-scroll">
            {sampleK8sYaml}
          </pre>
        </div>
      )}

      {/* Kubernetes Cluster Events Feed */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Kubernetes Cluster Events Log
        </h3>
        <div className="space-y-2 font-mono text-xs">
          {events.map((evt, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border ${
                evt.includes('Warning') || evt.includes('OOM')
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              {evt}
            </div>
          ))}
        </div>
      </div>

      {/* Scale Replicas Modal */}
      {scalingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-sm w-full p-6 text-slate-200 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Scale Deployment: {scalingName}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Updates Kubernetes desired replica count using declarative rollout.
            </p>

            <form onSubmit={handleScaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Replicas</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetReplicas}
                  onChange={(e) => setTargetReplicas(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScalingName(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition"
                >
                  Apply Scaling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

