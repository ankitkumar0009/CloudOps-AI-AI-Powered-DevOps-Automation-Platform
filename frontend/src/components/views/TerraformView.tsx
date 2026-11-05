import React, { useState } from 'react';
import {
  FileCode2,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { TerraformModuleRun } from '../../types';
import { LogViewer } from '../common/LogViewer';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TerraformViewProps {
  terraformState: TerraformModuleRun;
  onExecute: (action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy') => Promise<any>;
}

export const TerraformView: React.FC<TerraformViewProps> = ({
  terraformState,
  onExecute,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'apply' | 'destroy' | null>(null);

  const modulesList = [
    { name: 'modules/vpc', desc: 'VPC, 2 Public & 2 Private Subnets, NAT Gateway, Internet Gateway, Route Tables' },
    { name: 'modules/ec2', desc: 'EC2 Bastion Host, t3.medium EKS node group instances, Security Groups' },
    { name: 'modules/ecr', desc: 'AWS ECR private container repository with AES256 encryption and lifecycle policies' },
    { name: 'modules/eks', desc: 'Amazon EKS Control Plane v1.29, Managed Node Groups, OIDC Provider endpoint' },
    { name: 'modules/iam', desc: 'GitHub Actions OIDC Trust Role, EKS Cluster IAM Roles, Worker Node IAM Policies' },
  ];

  const handleAction = async (action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy') => {
    if (action === 'apply' || action === 'destroy') {
      setConfirmAction(action);
      return;
    }
    await triggerExecution(action);
  };

  const triggerExecution = async (action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy') => {
    setIsRunning(true);
    try {
      await onExecute(action);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            Terraform Infrastructure Automation & Safety Controls
          </h2>
          <p className="text-xs text-slate-400">
            Declarative AWS provisioning engine with mandatory human-in-the-loop confirmation before state changes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={isRunning}
            onClick={() => handleAction('init')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition disabled:opacity-50"
          >
            terraform init
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleAction('validate')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition disabled:opacity-50"
          >
            terraform validate
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleAction('plan')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>terraform plan</span>
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleAction('apply')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-md shadow-emerald-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>terraform apply</span>
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleAction('destroy')}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white text-xs font-mono font-medium border border-rose-800/60 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>destroy</span>
          </button>
        </div>
      </div>

      {/* Plan Summary Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Resources to Add</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              +{terraformState.resources_to_add}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Resources to Modify</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              ~{terraformState.resources_to_change}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Resources to Destroy</span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              -{terraformState.resources_to_destroy}
            </div>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Terraform Execution Output Console */}
      <LogViewer
        logs={terraformState.logs}
        title="Terraform CLI Execution Stream"
        maxHeight="h-72"
        isStreaming={isRunning}
      />

      {/* Terraform Modules Architecture Directory */}
      <div className="bg-[#111827]/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-3">
          Provisioned Terraform Modular Components
        </h3>
        <div className="divide-y divide-slate-800/80">
          {modulesList.map((m) => (
            <div key={m.name} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-mono text-xs font-semibold text-indigo-400">{m.name}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                AWS Provider v5.38
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Confirmation Dialog for Apply / Destroy */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction === 'destroy' ? 'Confirm Destructive Infrastructure Teardown' : 'Confirm Terraform Infrastructure Apply'}
        description={
          confirmAction === 'destroy'
            ? 'WARNING: This operation will permanently destroy all AWS resources managed by this Terraform workspace including VPC, subnets, EKS clusters, and EC2 instances.'
            : 'Applying this Terraform plan will modify and provision real cloud infrastructure resources in AWS region us-east-1.'
        }
        commandPreview={confirmAction === 'destroy' ? 'terraform destroy -auto-approve=false' : 'terraform apply -auto-approve=false'}
        confirmWord={confirmAction === 'destroy' ? 'DESTROY' : undefined}
        isDestructive={confirmAction === 'destroy'}
        onConfirm={() => {
          const act = confirmAction;
          setConfirmAction(null);
          if (act) triggerExecution(act);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
