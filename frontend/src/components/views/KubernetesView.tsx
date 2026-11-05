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
  Sliders,
  GitBranch,
  Split,
  ToggleLeft,
  ToggleRight,
  Zap
} from 'lucide-react';
import { KubernetesPod, KubernetesDeployment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';

interface KubernetesViewProps {
  pods: KubernetesPod[];
  deployments: KubernetesDeployment[];
  events: string[];
  onScaleDeployment: (name: string, replicas: number) => Promise<any>;
  onRefresh: () => void;
  onAddToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const KubernetesView: React.FC<KubernetesViewProps> = ({
  pods,
  deployments,
  events,
  onScaleDeployment,
  onRefresh,
  onAddToast,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [scalingName, setScalingName] = useState<string | null>(null);
  const [targetReplicas, setTargetReplicas] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'pods' | 'deployments' | 'strategies' | 'yaml'>('pods');
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [activeColor, setActiveColor] = useState<'blue' | 'green'>('green');
  const [canaryWeight, setCanaryWeight] = useState<number>(25);
  const [strategyProcessing, setStrategyProcessing] = useState(false);

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

  const handleSwitchBlueGreen = async (target: 'blue' | 'green') => {
    setStrategyProcessing(true);
    try {
      await api.switchBlueGreen('auth-service', target, 'production');
      setActiveColor(target);
      onAddToast?.('success', 'Blue-Green Router Switched', `100% of live production traffic switched to ${target.toUpperCase()} environment.`);
      onRefresh();
    } catch {
      onAddToast?.('error', 'Switch Failed', 'Unable to adjust router selector.');
    } finally {
      setStrategyProcessing(false);
    }
  };

  const handleAdjustCanary = async (weight: number) => {
    setStrategyProcessing(true);
    try {
      await api.adjustCanary('orders-api', weight, 'staging');
      setCanaryWeight(weight);
      onAddToast?.('success', 'Canary Traffic Adjusted', `Canary routing weight set to ${weight}%.`);
      onRefresh();
    } catch {
      onAddToast?.('error', 'Canary Adjustment Failed', 'Unable to adjust weight.');
    } finally {
      setStrategyProcessing(false);
    }
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
            Real-time pod lifecycle telemetry, declarative deployment scaling, and multi-strategy traffic routing.
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
          onClick={() => setActiveTab('strategies')}
          className={`text-xs font-semibold pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'strategies'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Deployment Strategies (Blue-Green / Canary)</span>
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
                  <th className="py-3 px-4">Replicas</th>
                  <th className="py-3 px-4">Strategy</th>
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
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-400">
                      {d.strategy || "RollingUpdate"}
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
                        <span>Scale</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Deployment Strategies (Blue-Green & Canary) */}
      {activeTab === 'strategies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blue-Green Deployment Card */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  Zero-Downtime Router
                </span>
                <h3 className="text-sm font-bold text-white mt-1">Blue-Green Deployment (auth-service)</h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                activeColor === 'green' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                Live: {activeColor}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains two identical production environments (Blue and Green). Traffic router instantly flips live service selector with zero connection drop.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border transition-all ${
                activeColor === 'blue' ? 'bg-blue-950/30 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="text-xs font-bold block uppercase font-mono">Blue Environment</span>
                <span className="text-[11px] block mt-1">auth-service:v1.7.9 (Stable)</span>
                <span className="text-[10px] font-mono block mt-2">{activeColor === 'blue' ? '● Serving 100% Traffic' : '○ Standby Idle'}</span>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                activeColor === 'green' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span className="text-xs font-bold block uppercase font-mono">Green Environment</span>
                <span className="text-[11px] block mt-1">auth-service:v1.8.0 (Active)</span>
                <span className="text-[10px] font-mono block mt-2">{activeColor === 'green' ? '● Serving 100% Traffic' : '○ Standby Idle'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">Router Action:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSwitchBlueGreen('blue')}
                  disabled={strategyProcessing || activeColor === 'blue'}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition disabled:opacity-40"
                >
                  Switch to Blue
                </button>
                <button
                  onClick={() => handleSwitchBlueGreen('green')}
                  disabled={strategyProcessing || activeColor === 'green'}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition disabled:opacity-40"
                >
                  Switch to Green
                </button>
              </div>
            </div>
          </div>

          {/* Canary Deployment Card */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Weighted Traffic Splitter
                </span>
                <h3 className="text-sm font-bold text-white mt-1">Canary Deployment (orders-api)</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Canary: {canaryWeight}%
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rolls out updates incrementally to a fraction of user traffic. Telemetry automatically monitors P99 latency and error rates before full promotion.
            </p>

            {/* Visual Traffic Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Primary Baseline: {100 - canaryWeight}%</span>
                <span className="text-amber-400 font-bold">Canary v3.1: {canaryWeight}%</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div style={{ width: `${100 - canaryWeight}%` }} className="bg-indigo-600 h-full transition-all" />
                <div style={{ width: `${canaryWeight}%` }} className="bg-amber-400 h-full transition-all" />
              </div>
            </div>

            {/* Quick Weight Adjust Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">Set Canary Split:</span>
              <div className="flex items-center gap-2">
                {[10, 25, 50, 100].map((w) => (
                  <button
                    key={w}
                    onClick={() => handleAdjustCanary(w)}
                    disabled={strategyProcessing}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                      canaryWeight === w
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {w === 100 ? '100% (Promote)' : `${w}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: YAML Manifest Generator */}
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
