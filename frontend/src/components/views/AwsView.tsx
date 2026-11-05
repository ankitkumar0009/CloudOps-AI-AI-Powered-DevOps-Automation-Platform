import React from 'react';
import {
  Cloud,
  Server,
  Box,
  HardDrive,
  Shield,
  Activity,
  Network,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { AwsResource } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface AwsViewProps {
  resources: AwsResource[];
}

export const AwsView: React.FC<AwsViewProps> = ({ resources }) => {
  const totalCost = resources.reduce((acc, curr) => acc + (curr.cost_est_per_mo || 0), 0);

  const getIcon = (type: string) => {
    switch (type) {
      case 'EC2': return Server;
      case 'EKS': return Server;
      case 'ECR': return Box;
      case 'S3': return HardDrive;
      case 'IAM': return Shield;
      case 'CloudWatch': return Activity;
      case 'VPC': return Network;
      default: return Cloud;
    }
  };

  return (
    <div className="space-y-6">
      {/* AWS Cloud Infrastructure Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Cloud className="w-4 h-4 text-amber-400" />
            AWS Cloud Infrastructure & Resource Topology
          </h2>
          <p className="text-xs text-slate-400">
            Monitored AWS resources provisioned for the containerized application fleet in us-east-1.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Est. Fleet Cost: </span>
            <span className="font-bold text-emerald-400">${totalCost.toFixed(2)}/mo</span>
          </div>

          <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs font-mono text-indigo-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Auth: GitHub OIDC</span>
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((res) => {
          const Icon = getIcon(res.type);
          return (
            <div
              key={res.id}
              className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-tight">{res.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{res.id}</span>
                    </div>
                  </div>
                  <StatusBadge status={res.status} size="sm" />
                </div>

                <div className="space-y-1.5 py-3 border-y border-slate-800/80 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Service:</span>
                    <span className="text-white font-semibold">{res.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Region:</span>
                    <span className="text-indigo-400">{res.region}</span>
                  </div>

                  {Object.entries(res.details || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between truncate">
                      <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                      <span className="text-slate-300 truncate max-w-[150px]">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {res.cost_est_per_mo !== undefined && (
                <div className="pt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Monthly Burn:</span>
                  <span className="font-bold text-emerald-400">${res.cost_est_per_mo.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

