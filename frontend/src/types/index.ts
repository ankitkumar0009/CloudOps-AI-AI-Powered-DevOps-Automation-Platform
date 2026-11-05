export type AppType = 'nodejs' | 'python' | 'java';

export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled_back' | 'canary_evaluating';

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface Project {
  id: string;
  name: string;
  repo_url: string;
  branch: string;
  app_type: AppType;
  port: number;
  dockerfile_path?: string;
  replicas: number;
  cpu_limit: string;
  memory_limit: string;
  environment: 'development' | 'staging' | 'production';
  deployment_strategy?: 'rolling' | 'blue_green' | 'canary';
  webhook_secret?: string;
  env_vars: Record<string, string>;
  created_at: string;
  updated_at: string;
  last_deployment_status?: DeploymentStatus;
  deployment_count?: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  duration?: string;
  details?: string;
}

export interface PipelineExecution {
  id: string;
  project_id: string;
  project_name: string;
  branch: string;
  commit_sha: string;
  commit_message: string;
  status: DeploymentStatus;
  stages: PipelineStage[];
  started_at: string;
  completed_at?: string;
  duration?: string;
  logs: string[];
}

export interface DeploymentRecord {
  id: string;
  project_id: string;
  project_name?: string;
  version: string;
  commit_sha: string;
  status: DeploymentStatus;
  strategy: 'rolling' | 'blue_green' | 'canary';
  canary_percentage: number;
  active_color: 'blue' | 'green';
  k8s_namespace: string;
  k8s_deployment_name?: string;
  target_revision: number;
  triggered_by: string;
  started_at: string;
  completed_at?: string;
  duration?: string;
  logs: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  digest: string;
  size_mb: number;
  created_at: string;
  app_type: AppType;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  optimization_tips?: string[];
  pushed_to_ecr: boolean;
  ecr_uri?: string;
}

export interface KubernetesPod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Error' | 'Completed';
  restarts: number;
  age: string;
  cpu_usage: string;
  memory_usage: string;
  node: string;
  ip: string;
  ready: string;
}

export interface KubernetesDeployment {
  name: string;
  namespace: string;
  desired_replicas: number;
  available_replicas: number;
  updated_replicas: number;
  image: string;
  status: 'Healthy' | 'Progressing' | 'Degraded';
  strategy?: string;
  active_color?: 'blue' | 'green';
  canary_weight?: number;
  age: string;
}

export interface AwsResource {
  id: string;
  name: string;
  type: 'EC2' | 'EKS' | 'ECR' | 'S3' | 'VPC' | 'IAM' | 'CloudWatch';
  region: string;
  status: 'active' | 'provisioning' | 'stopped' | 'failed';
  details: Record<string, any>;
  cost_est_per_mo?: number;
}

export interface TerraformModuleRun {
  action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy';
  status: 'idle' | 'running' | 'success' | 'failed';
  logs: string[];
  last_run?: string;
  resources_to_add: number;
  resources_to_change: number;
  resources_to_destroy: number;
}

export interface AiDiagnosisResult {
  id: string;
  context_type: 'docker_build' | 'k8s_pod' | 'terraform' | 'github_actions' | 'k8s_incident' | 'general';
  log_snippet: string;
  root_cause: string;
  possible_reasons: string[];
  recommended_solution: string;
  step_by_step_fix: string[];
  suggested_commands: string[];
  confidence_score: number;
  analyzed_at: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggested_commands?: string[];
  requires_approval?: boolean;
  command_pending?: string;
}

export interface RollbackRecord {
  id: string;
  deployment_id?: string;
  project_id: string;
  project_name: string;
  from_version: string;
  to_version: string;
  target_revision: number;
  status: 'success' | 'failed' | 'in_progress';
  triggered_by: string;
  timestamp: string;
  reason: string;
  k8s_command: string;
}

export interface Incident {
  id: string;
  service: string;
  environment: string;
  title: string;
  error_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'recovery_pending' | 'resolved';
  root_cause: string;
  log_snippet: string;
  metrics_snapshot: Record<string, any>;
  detected_at: string;
  resolved_at?: string;
  mttr_seconds?: number;
  recommendations?: AiRecommendation[];
}

export interface AiRecommendation {
  id: string;
  incident_id: string;
  root_cause_explanation: string;
  recommended_solution: string;
  action_type: string;
  action_payload: Record<string, any>;
  suggested_commands: string[];
  potential_risks: string;
  expected_outcome: string;
  confidence_score: number;
  created_at: string;
}

export interface RecoveryAction {
  id: string;
  incident_id: string;
  recommendation_id?: string;
  action_type: string;
  parameters: Record<string, any>;
  status: 'pending_approval' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed';
  requested_by: string;
  approved_by?: string;
  approval_expires_at?: string;
  execution_logs?: string;
  post_health_status: 'pending' | 'healthy' | 'degraded';
  created_at: string;
  executed_at?: string;
}

export interface SecurityScan {
  id: string;
  project_id?: string;
  scan_type: 'sonarqube' | 'pytest' | 'gitleaks' | 'trivy' | 'checkov' | 'owasp_zap';
  target: string;
  status: 'passed' | 'failed' | 'warning';
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  findings: Record<string, any>[];
  quality_gate: 'PASSED' | 'FAILED' | 'OVERRIDDEN';
  summary: string;
  scan_duration: string;
  created_at: string;
}

export interface DevSecOpsSummary {
  overall_status: 'PASSED' | 'FAILED' | 'WARNING';
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  secret_leaks_prevented: number;
  iac_misconfigurations: number;
  scans_completed: number;
  last_scan_time?: string;
  scans: SecurityScan[];
}

export interface GitHubCommit {
  sha: string;
  full_sha?: string;
  message: string;
  author: string;
  timestamp: string;
  url: string;
}

export interface AuditLog {
  id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export interface SystemOverview {
  total_projects: number;
  successful_deployments: number;
  failed_deployments: number;
  running_containers: number;
  active_k8s_pods: number;
  active_incidents?: number;
  security_score?: number;
  pipeline_success_rate: number;
  infrastructure_status: 'Healthy' | 'Degraded' | 'Offline';
  recent_activity: {
    id: string;
    type: 'deploy' | 'rollback' | 'build' | 'infra' | 'incident' | 'security';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'failed' | 'warning' | 'info';
  }[];
}
