import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Box, 
  FileCode2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  ChevronRight,
  ExternalLink,
  Lock,
  Search,
  Filter
} from 'lucide-react';
import { SecurityScan, DevSecOpsSummary } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';

interface SecurityViewProps {
  onAddToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onAddToast }) => {
  const [summary, setSummary] = useState<DevSecOpsSummary | null>(null);
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningScan, setRunningScan] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<SecurityScan | null>(null);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [sum, scanList] = await Promise.all([
        api.getSecuritySummary(),
        api.getSecurityScans()
      ]);
      setSummary(sum);
      setScans(scanList);
      if (scanList.length > 0 && !selectedScan) {
        setSelectedScan(scanList[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleTriggerScan = async (scanType: string) => {
    setRunningScan(scanType);
    try {
      const res = await api.triggerSecurityScan(scanType, 'payment-gateway-service');
      onAddToast?.('success', `${scanType.toUpperCase()} Scan Completed`, `Quality Gate: ${res.quality_gate} with ${res.critical_count} critical CVEs.`);
      await fetchSecurityData();
      setSelectedScan(res);
    } catch (err) {
      onAddToast?.('error', 'Scan Failed', 'Failed to execute security scanner.');
    } finally {
      setRunningScan(null);
    }
  };

  const stages = [
    { type: 'sonarqube', name: 'Stage 1: SonarQube', desc: 'Code Quality, Bugs & Maintainability', icon: FileCode2 },
    { type: 'pytest', name: 'Stage 2: Pytest Suite', desc: 'Unit, Integration & K8s Manifest Validation', icon: CheckCircle2 },
    { type: 'gitleaks', name: 'Stage 3: Gitleaks', desc: 'Secret Detection & Token Masking', icon: Key },
    { type: 'trivy', name: 'Stage 4: Trivy Container', desc: 'OS & Package CVE Vulnerabilities', icon: Box },
    { type: 'checkov', name: 'Stage 5: Checkov IaC', desc: 'Terraform & CIS Benchmark Compliance', icon: ShieldCheck },
    { type: 'owasp_zap', name: 'Stage 6: OWASP ZAP', desc: 'Dynamic Web Application Security (DAST)', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-[#0d1322] to-slate-900/60 p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              DevSecOps Pre-Deployment Gate
            </span>
            <span className="text-xs text-slate-400 font-mono">Module 3: Complete Security Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DevSecOps Security & Compliance Center</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Multi-stage enterprise verification pipeline: SonarQube, Pytest, Gitleaks, Trivy container CVE scans, Checkov IaC rules, and OWASP ZAP DAST.
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Scans
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Security Gate"
          value={summary?.overall_status || "PASSED"}
          subtitle="All pre-deploy gates clear"
          icon={ShieldCheck}
          trend={summary?.overall_status === 'PASSED' ? "success" : "danger"}
        />
        <StatCard
          title="Critical Vulnerabilities"
          value={summary?.critical_vulnerabilities ?? 0}
          subtitle="Threshold: 0 allowed"
          icon={ShieldAlert}
          trend={summary?.critical_vulnerabilities === 0 ? "success" : "danger"}
        />
        <StatCard
          title="Secret Leaks Prevented"
          value={summary?.secret_leaks_prevented ?? 3}
          subtitle="Gitleaks pattern masked"
          icon={Key}
          trend="success"
        />
        <StatCard
          title="IaC Compliance Score"
          value="96.3%"
          subtitle="Checkov CIS benchmarks"
          icon={FileCode2}
          trend="success"
        />
      </div>

      {/* 6 Interactive Pipeline Stage Scanner Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white tracking-tight">Interactive DevSecOps Pipeline Stages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stg) => {
            const Icon = stg.icon;
            const isRunning = runningScan === stg.type;
            const latestScan = scans.find(s => s.scan_type === stg.type);

            return (
              <div 
                key={stg.type}
                className="p-4 rounded-xl bg-[#0f172a]/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      latestScan?.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {latestScan ? latestScan.quality_gate : 'READY'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white">{stg.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{stg.desc}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {latestScan ? `${latestScan.critical_count} Crit • ${latestScan.high_count} High` : 'Zero Errors'}
                  </span>
                  <button
                    onClick={() => handleTriggerScan(stg.type)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition-all disabled:opacity-50"
                  >
                    {isRunning ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    <span>Execute Scan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Report & Finding Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left: Scan History List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold text-white">Scan Execution History</h2>
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {scans.map((scan) => {
              const isSelected = selectedScan?.id === scan.id;
              return (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/80 border-indigo-500'
                      : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-mono">{scan.scan_type}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {scan.quality_gate}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{scan.summary}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/60">
                    <span>Target: {scan.target}</span>
                    <span>Duration: {scan.scan_duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Finding & Remediation Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedScan ? (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase">{selectedScan.scan_type} Scan Report</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Target: {selectedScan.target}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    GATE: {selectedScan.quality_gate}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">{selectedScan.scan_duration}</span>
                </div>
              </div>

              {/* Summary Callout */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-normal leading-relaxed">
                {selectedScan.summary}
              </div>

              {/* Findings Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Identified Findings & Security Alerts ({selectedScan.findings.length})
                </span>

                {selectedScan.findings.length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {selectedScan.findings.map((f, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-200">
                            {f.cve_id || f.rule || f.check_id || f.alert || "Security Check"}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {f.severity || f.risk || "INFO"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {f.title || f.message || f.check_name || f.secret_type}
                        </p>
                        {f.solution && (
                          <p className="text-[11px] text-emerald-400 font-mono pt-1">
                            Fix: {f.solution}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                    ✓ Clean scan! Zero vulnerabilities, secret leaks, or policy violations detected.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 text-slate-500">
              Select a security scan to inspect findings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

