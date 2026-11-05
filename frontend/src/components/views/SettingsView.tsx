import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Cloud,
  Server,
  Github,
  Check,
  Save,
  Lock
} from 'lucide-react';

interface SettingsViewProps {
  onSaveToast: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaveToast }) => {
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [awsRoleArn, setAwsRoleArn] = useState('arn:aws:iam::123456789012:role/GitHubActions-EKS-Deployer-Role');
  const [geminiApiKey, setGeminiApiKey] = useState('AIzaSyD-sample-gemini-api-key-configured');
  const [githubToken, setGithubToken] = useState('ghp_sample-devops-personal-access-token');
  const [k8sContext, setK8sContext] = useState<'eks' | 'minikube'>('eks');
  const [autoRollbackEnabled, setAutoRollbackEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    onSaveToast();
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          DevOps Platform Integration & Cloud Security Settings
        </h2>
        <p className="text-xs text-slate-400">
          Manage zero-trust IAM roles, AI API tokens, and Kubernetes cluster context.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AWS Cloud & IAM OIDC */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cloud className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">AWS Authentication & EKS Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target AWS Region</label>
              <input
                type="text"
                value={awsRegion}
                onChange={(e) => setAwsRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Deployment Cluster Context</label>
              <select
                value={k8sContext}
                onChange={(e) => setK8sContext(e.target.value as 'eks' | 'minikube')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="eks">Amazon EKS (Production Cluster)</option>
                <option value="minikube">Minikube / Kind (Local Development)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                AWS IAM Role ARN (GitHub OIDC Federated Identity)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={awsRoleArn}
                  onChange={(e) => setAwsRoleArn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
                />
                <Shield className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Never hardcode static AWS Access Keys. Uses temporary short-lived credentials via AWS STS OIDC Web Identity.
              </span>
            </div>
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Google Gemini API Configuration</h3>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-300 font-medium">Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Used by the backend dedicated AI agent service (`gemini_agent.py`) for real-time log diagnosis.
            </span>
          </div>
        </div>

        {/* Automated Rollback Policy */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">SRE Policy & Health Automation</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-white block">Automated Kubernetes Rollback Engine</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically execute `kubectl rollout undo` when CrashLoopBackOff or &gt;3 health check failures occur within 3 minutes of rollout.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRollbackEnabled}
              onChange={(e) => setAutoRollbackEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved' : 'Save Configurations'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

