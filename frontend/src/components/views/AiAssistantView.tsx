import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Terminal,
  Bot,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { AiDiagnosisResult, AiChatMessage } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AiAssistantViewProps {
  onDiagnose: (logText: string, contextType: string) => Promise<AiDiagnosisResult>;
  onSendMessage: (msg: string, history: any[]) => Promise<{ reply: string; suggested_commands?: string[] }>;
  onExecuteCommand: (cmd: string) => Promise<string>;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  onDiagnose,
  onSendMessage,
  onExecuteCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnose' | 'chat'>('diagnose');

  // Diagnosis State
  const [logInput, setLogInput] = useState<string>(
    'CrashLoopBackOff: Container orders-api in pod orders-api-6f987c88b-8jk41 repeatedly restarting.\n' +
    'Exit code: 137 (OOMKilled)\n' +
    'Termination reason: Error: container exceeded memory limit of 512Mi during JVM heap allocation.'
  );
  const [contextType, setContextType] = useState<string>('k8s_pod');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResult | null>(null);

  // Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Hello! I am your AI DevOps Assistant powered by Google Gemini. I can diagnose failed deployments, analyze Kubernetes crashes, optimize Dockerfiles, or write Terraform configurations for you.',
      timestamp: 'Just now',
      suggested_commands: [
        'kubectl get pods --all-namespaces',
        'kubectl top nodes'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  // Command Approval Modal Guardrail
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const sampleFailureSnippets = [
    {
      label: 'Kubernetes CrashLoopBackOff (OOM)',
      context: 'k8s_pod',
      log: 'CrashLoopBackOff: Container orders-api repeatedly restarting with exit code 137 (OOMKilled). Memory limit 512Mi exceeded during JVM heap allocation.'
    },
    {
      label: 'Docker Multi-Stage Build Failure',
      context: 'docker_build',
      log: 'Step 4/8 : RUN npm ci\nnpm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path /app/package-lock.json\nnpm ERR! errno -2\nnpm ERR! enoent ENOENT: no such file or directory, open \'/app/package-lock.json\''
    },
    {
      label: 'Terraform State Lock & VPC Conflict',
      context: 'terraform',
      log: 'Error: Error creating VPC: VpcLimitExceeded: The maximum number of VPCs has been reached in us-east-1.\nstatus code: 400, request id: req-98124b10'
    },
    {
      label: 'GitHub Actions OIDC AWS Auth Error',
      context: 'github_actions',
      log: 'Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity on resource arn:aws:iam::123456789012:role/GitHubActions-EKS-Deployer-Role'
    }
  ];

  const handleRunDiagnosis = async () => {
    if (!logInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await onDiagnose(logInput, contextType);
      setDiagnosis(res);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await onSendMessage(currentInput, messages);
      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_commands: res.suggested_commands,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsChatSending(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Google Gemini AI DevOps Diagnosis & Copilot
          </h2>
          <p className="text-xs text-slate-400">
            Real-time root cause analysis, automated remediation plans, and validated technical advice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('diagnose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'diagnose'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Log Failure Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            DevOps Chat Assistant
          </button>
        </div>
      </div>

      {/* Tab 1: Log Diagnosis */}
      {activeTab === 'diagnose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form & Presets */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Deployment / Failure Log Snippet
                </label>
                <textarea
                  rows={6}
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  placeholder="Paste error logs from Docker, Kubernetes, Terraform, or GitHub Actions..."
                  className="w-full px-3 py-2.5 bg-[#050811] border border-slate-700/80 rounded-lg text-xs font-mono text-cyan-300 leading-relaxed focus:outline-none focus:border-indigo-500 terminal-scroll"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Log Source Category</label>
                <select
                  value={contextType}
                  onChange={(e) => setContextType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="k8s_pod">Kubernetes Pod / Container</option>
                  <option value="docker_build">Docker Image Build</option>
                  <option value="terraform">Terraform HCL / Provider</option>
                  <option value="github_actions">GitHub Actions Workflow</option>
                  <option value="general">Application General Exception</option>
                </select>
              </div>

              <button
                disabled={isAnalyzing}
                onClick={handleRunDiagnosis}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing with Gemini API...' : 'Diagnose with Gemini AI'}</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="bg-[#111827]/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Quick Failure Scenarios (Load Sample)
              </span>
              <div className="space-y-1.5">
                {sampleFailureSnippets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLogInput(preset.log);
                      setContextType(preset.context);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition flex items-center justify-between"
                  >
                    <span>{preset.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis Result */}
          <div className="lg:col-span-7">
            {diagnosis ? (
              <div className="bg-[#111827]/90 border border-indigo-500/30 rounded-xl p-6 space-y-5 shadow-xl animate-fade-in">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Root Cause Diagnosis</h3>
                      <span className="text-[10px] font-mono text-slate-400">Context: {diagnosis.context_type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {diagnosis.confidence_score}% Confidence
                  </span>
                </div>

                {/* Root Cause Card */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-xs font-semibold text-indigo-400 block mb-1">Identified Root Cause:</span>
                  <p className="text-xs text-white leading-relaxed">{diagnosis.root_cause}</p>
                </div>

                {/* Possible Contributing Reasons */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Possible Reasons:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {diagnosis.possible_reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Fix */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Recommended Solution
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {diagnosis.recommended_solution}
                  </p>

                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Step-by-step fix:</span>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                      {diagnosis.step_by_step_fix.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Suggested Remediation Commands (With Safety Approval Guardrail) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Suggested Remediation Commands (Requires User Approval)
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Human-in-the-Loop
                    </span>
                  </div>

                  <div className="space-y-2">
                    {diagnosis.suggested_commands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#050811] border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <span className="text-cyan-300 truncate">{cmd}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyCommand(cmd)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="Copy Command"
                          >
                            {copiedCmd === cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setPendingCommand(cmd)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition shadow flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Validate & Run</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[380px] bg-[#111827]/40 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-500/40" />
                <div className="text-xs font-semibold text-slate-400">No Analysis Generated Yet</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Paste deployment or container logs on the left and click "Diagnose with Gemini AI" to identify the root cause and remediation steps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Interactive DevOps Chat */}
      {activeTab === 'chat' && (
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl flex flex-col h-[600px] shadow-sm overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 terminal-scroll">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-3.5 rounded-xl ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Suggested commands chips */}
                  {m.suggested_commands && m.suggested_commands.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 block">Suggested Commands:</span>
                      {m.suggested_commands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/40 border border-slate-800 font-mono text-[11px]"
                        >
                          <span className="text-cyan-300 truncate">{cmd}</span>
                          <button
                            onClick={() => setPendingCommand(cmd)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] shrink-0"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-slate-400 mt-1.5 text-right font-mono">
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 bg-[#0b0f19] border-t border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about Docker, Kubernetes, AWS EKS, Terraform, or CI/CD pipelines..."
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              disabled={isChatSending || !chatInput.trim()}
              type="submit"
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Safety Confirmation Dialog for AI Commands (Human-in-the-Loop) */}
      <ConfirmDialog
        isOpen={pendingCommand !== null}
        title="Approve AI-Generated Command Execution"
        description="DevOps Policy Requirement: AI-suggested commands must be explicitly inspected and approved by a human engineer before execution on the cluster."
        commandPreview={pendingCommand || ''}
        isDestructive={pendingCommand?.includes('delete') || pendingCommand?.includes('destroy')}
        onConfirm={async () => {
          const cmd = pendingCommand;
          setPendingCommand(null);
          if (cmd) {
            await onExecuteCommand(cmd);
          }
        }}
        onCancel={() => setPendingCommand(null)}
      />
    </div>
  );
};
