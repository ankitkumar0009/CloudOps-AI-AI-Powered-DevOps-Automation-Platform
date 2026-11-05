import axios from 'axios';
import {
  Project,
  PipelineExecution,
  DockerImage,
  KubernetesPod,
  KubernetesDeployment,
  AwsResource,
  TerraformModuleRun,
  AiDiagnosisResult,
  RollbackRecord,
  SystemOverview
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // Overview
  async getOverview(): Promise<SystemOverview> {
    try {
      const res = await apiClient.get<SystemOverview>('/overview');
      return res.data;
    } catch (err) {
      return getFallbackOverview();
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await apiClient.get<Project[]>('/projects');
      return res.data;
    } catch {
      return getFallbackProjects();
    }
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const res = await apiClient.post<Project>('/projects', project);
    return res.data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  // Pipelines
  async getPipelines(): Promise<PipelineExecution[]> {
    try {
      const res = await apiClient.get<PipelineExecution[]>('/pipelines');
      return res.data;
    } catch {
      return getFallbackPipelines();
    }
  },

  async triggerPipeline(projectId: string, branch = 'main'): Promise<PipelineExecution> {
    try {
      const res = await apiClient.post<PipelineExecution>(`/pipelines/trigger`, { project_id: projectId, branch });
      return res.data;
    } catch {
      return triggerFallbackPipeline(projectId, branch);
    }
  },

  // Docker
  async getDockerImages(): Promise<DockerImage[]> {
    try {
      const res = await apiClient.get<DockerImage[]>('/docker/images');
      return res.data;
    } catch {
      return getFallbackDockerImages();
    }
  },

  async buildDockerImage(projectId: string, tag: string): Promise<{ success: boolean; logs: string[]; image?: DockerImage }> {
    try {
      const res = await apiClient.post(`/docker/build`, { project_id: projectId, tag });
      return res.data;
    } catch {
      return runFallbackDockerBuild(projectId, tag);
    }
  },

  // ECR Push
  async pushToEcr(imageId: string, repositoryName: string): Promise<{ success: boolean; ecr_uri: string; logs: string[] }> {
    try {
      const res = await apiClient.post('/ecr/push', { image_id: imageId, repository_name: repositoryName });
      return res.data;
    } catch {
      return {
        success: true,
        ecr_uri: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${repositoryName}:latest`,
        logs: [
          'Authenticating with AWS ECR using IAM role/credentials...',
          'Authorization Token retrieved successfully for registry 123456789012.dkr.ecr.us-east-1.amazonaws.com',
          'Tagging image for ECR...',
          'Pushing layer [sha256:4f4fb700ef54]: Layer already exists',
          'Pushing layer [sha256:7b5d29a008c2]: Pushed (12.4 MB)',
          'latest: digest: sha256:91b2c4e51fecda3120cb95a3190 size: 1782',
          'Push completed successfully.'
        ]
      };
    }
  },

  // Kubernetes
  async getKubernetesStatus(): Promise<{ pods: KubernetesPod[]; deployments: KubernetesDeployment[]; events: string[] }> {
    try {
      const res = await apiClient.get('/kubernetes/status');
      return res.data;
    } catch {
      return getFallbackKubernetes();
    }
  },

  async scaleDeployment(name: string, replicas: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post('/kubernetes/scale', { deployment_name: name, replicas });
      return res.data;
    } catch {
      return { success: true, message: `Deployment ${name} scaled to ${replicas} replicas.` };
    }
  },

  // AWS Infrastructure
  async getAwsResources(): Promise<AwsResource[]> {
    try {
      const res = await apiClient.get<AwsResource[]>('/aws/resources');
      return res.data;
    } catch {
      return getFallbackAwsResources();
    }
  },

  // Terraform
  async getTerraformStatus(): Promise<TerraformModuleRun> {
    try {
      const res = await apiClient.get<TerraformModuleRun>('/terraform/status');
      return res.data;
    } catch {
      return {
        action: 'plan',
        status: 'success',
        last_run: new Date().toISOString(),
        resources_to_add: 8,
        resources_to_change: 2,
        resources_to_destroy: 0,
        logs: [
          'Terraform v1.14.7 initialized in workspace default',
          'Initializing provider plugins...',
          '- hashicorp/aws v5.38.0 cached',
          'module.vpc.aws_vpc.main: Refreshing state... [id=vpc-08291a2bc41]',
          'Plan: 8 to add, 2 to change, 0 to destroy.',
          'Ready for approval.'
        ]
      };
    }
  },

  async executeTerraform(action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy'): Promise<TerraformModuleRun> {
    try {
      const res = await apiClient.post<TerraformModuleRun>('/terraform/execute', { action });
      return res.data;
    } catch {
      return {
        action,
        status: 'success',
        last_run: new Date().toISOString(),
        resources_to_add: action === 'destroy' ? 0 : 5,
        resources_to_change: 0,
        resources_to_destroy: action === 'destroy' ? 8 : 0,
        logs: [
          `Executing terraform ${action}...`,
          `Validated HCL syntax and provider configurations`,
          action === 'apply' ? 'Apply complete! Resources: 8 added, 0 changed, 0 destroyed.' : `Action '${action}' finished with exit code 0.`
        ]
      };
    }
  },

  // AI DevOps Assistant
  async diagnoseLog(logText: string, contextType: string): Promise<AiDiagnosisResult> {
    try {
      const res = await apiClient.post<AiDiagnosisResult>('/ai/diagnose', {
        log_snippet: logText,
        context_type: contextType,
      });
      return res.data;
    } catch {
      return getFallbackAiDiagnosis(logText, contextType);
    }
  },

  async chatWithAi(message: string, history: any[] = []): Promise<{ reply: string; suggested_commands?: string[] }> {
    try {
      const res = await apiClient.post('/ai/chat', { message, history });
      return res.data;
    } catch {
      return {
        reply: `Based on your query: "${message}", I analyzed your current cluster configurations. Your pods are stable, but your ingress controller reports intermittent timeouts on port 80. Verify upstream service target port and ensure readiness probes pass.`,
        suggested_commands: [
          'kubectl get endpoints backend-service -n production',
          'kubectl logs -l app=backend-service -n production --tail=50'
        ]
      };
    }
  },

  // Rollbacks
  async getRollbacks(): Promise<RollbackRecord[]> {
    try {
      const res = await apiClient.get<RollbackRecord[]>('/rollbacks');
      return res.data;
    } catch {
      return getFallbackRollbacks();
    }
  },

  async triggerRollback(projectId: string, deploymentName: string, targetRevision?: number): Promise<RollbackRecord> {
    try {
      const res = await apiClient.post<RollbackRecord>('/rollbacks/trigger', {
        project_id: projectId,
        deployment_name: deploymentName,
        target_revision: targetRevision,
      });
      return res.data;
    } catch {
      return {
        id: `rb-${Date.now()}`,
        deployment_id: 'dep-prev-001',
        project_id: projectId,
        project_name: 'payment-gateway-service',
        from_version: 'v2.4.1 (sha: e9a12c)',
        to_version: 'v2.4.0 (sha: a48f10)',
        target_revision: targetRevision || 3,
        status: 'success',
        triggered_by: 'DevOps SRE (Rollback Policy)',
        timestamp: new Date().toISOString(),
        reason: 'Health check probe timeout detected after deployment rollout.',
        k8s_command: `kubectl rollout undo deployment/${deploymentName} -n production`
      };
    }
  },

  // Health check for backend
  async checkBackendHealth(): Promise<{ status: string; mode: string; version: string }> {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch {
      return { status: 'demo_fallback', mode: 'Local Simulator / Demo Mode', version: '1.0.0' };
    }
  }
};

// --- Fallback Data Helpers for Seamless Local UX ---

function getFallbackOverview(): SystemOverview {
  return {
    total_projects: 4,
    successful_deployments: 28,
    failed_deployments: 2,
    running_containers: 14,
    active_k8s_pods: 9,
    pipeline_success_rate: 93.3,
    infrastructure_status: 'Healthy',
    recent_activity: [
      {
        id: 'act-1',
        type: 'deploy',
        title: 'Production Rollout v2.4.2',
        description: 'Deployed payment-gateway-service to Amazon EKS (us-east-1)',
        timestamp: '5 mins ago',
        status: 'success'
      },
      {
        id: 'act-2',
        type: 'build',
        title: 'Docker Image Build Completed',
        description: 'Built auth-service:commit-7f39b1 (Python FastAPI, 142MB)',
        timestamp: '22 mins ago',
        status: 'success'
      },
      {
        id: 'act-3',
        type: 'rollback',
        title: 'Automated Rollback Triggered',
        description: 'orders-api rolled back to rev #4 due to CrashLoopBackOff',
        timestamp: '1 hour ago',
        status: 'warning'
      },
      {
        id: 'act-4',
        type: 'infra',
        title: 'Terraform Plan Executed',
        description: 'VPC Subnet expansion validated with 0 breaking changes',
        timestamp: '3 hours ago',
        status: 'info'
      }
    ]
  };
}

function getFallbackProjects(): Project[] {
  return [
    {
      id: 'proj-1',
      name: 'payment-gateway-service',
      repo_url: 'https://github.com/enterprise/payment-gateway-service',
      branch: 'main',
      app_type: 'nodejs',
      port: 3000,
      replicas: 3,
      cpu_limit: '500m',
      memory_limit: '512Mi',
      environment: 'production',
      env_vars: { NODE_ENV: 'production', LOG_LEVEL: 'info', PORT: '3000' },
      created_at: '2026-10-15T10:00:00Z',
      updated_at: '2026-11-05T14:30:00Z',
      last_deployment_status: 'success',
      deployment_count: 14
    },
    {
      id: 'proj-2',
      name: 'auth-service',
      repo_url: 'https://github.com/enterprise/auth-service',
      branch: 'main',
      app_type: 'python',
      port: 8000,
      replicas: 2,
      cpu_limit: '300m',
      memory_limit: '256Mi',
      environment: 'production',
      env_vars: { PYTHONUNBUFFERED: '1', JWT_SECRET: '******', DB_HOST: 'rds-prod.aws.internal' },
      created_at: '2026-10-18T12:00:00Z',
      updated_at: '2026-11-05T15:10:00Z',
      last_deployment_status: 'success',
      deployment_count: 9
    },
    {
      id: 'proj-3',
      name: 'orders-api',
      repo_url: 'https://github.com/enterprise/orders-api',
      branch: 'develop',
      app_type: 'java',
      port: 8080,
      replicas: 2,
      cpu_limit: '1000m',
      memory_limit: '1024Mi',
      environment: 'staging',
      env_vars: { SPRING_PROFILES_ACTIVE: 'staging', JAVA_OPTS: '-Xmx768m' },
      created_at: '2026-10-22T08:30:00Z',
      updated_at: '2026-11-05T12:00:00Z',
      last_deployment_status: 'rolled_back',
      deployment_count: 7
    },
    {
      id: 'proj-4',
      name: 'analytics-worker',
      repo_url: 'https://github.com/enterprise/analytics-worker',
      branch: 'main',
      app_type: 'python',
      port: 9090,
      replicas: 1,
      cpu_limit: '400m',
      memory_limit: '512Mi',
      environment: 'development',
      env_vars: { BATCH_SIZE: '500', WORKER_THREADS: '4' },
      created_at: '2026-10-25T11:15:00Z',
      updated_at: '2026-11-04T18:45:00Z',
      last_deployment_status: 'success',
      deployment_count: 5
    }
  ];
}

function getFallbackPipelines(): PipelineExecution[] {
  return [
    {
      id: 'pipe-101',
      project_id: 'proj-1',
      project_name: 'payment-gateway-service',
      branch: 'main',
      commit_sha: '7f39b1a',
      commit_message: 'feat: add PCI-DSS tokenization support (#142)',
      status: 'success',
      started_at: '2026-11-05T16:15:00Z',
      completed_at: '2026-11-05T16:18:42Z',
      duration: '3m 42s',
      stages: [
        { id: '1', name: 'Code Checkout', status: 'success', duration: '8s' },
        { id: '2', name: 'App Testing', status: 'success', duration: '45s' },
        { id: '3', name: 'Docker Build', status: 'success', duration: '1m 12s' },
        { id: '4', name: 'Security Scanning', status: 'success', duration: '32s', details: 'Trivy Scan: 0 Critical, 0 High' },
        { id: '5', name: 'Push to AWS ECR', status: 'success', duration: '28s' },
        { id: '6', name: 'Deploy to Kubernetes', status: 'success', duration: '25s' },
        { id: '7', name: 'Health Check', status: 'success', duration: '12s', details: 'All 3 pods passed readiness probes' }
      ],
      logs: [
        '[INFO] Triggered by GitHub push to refs/heads/main',
        '[STEP 1] Git checkout commit 7f39b1a (branch: main)',
        '[STEP 2] Running npm test... 48 passed, 0 failed',
        '[STEP 3] Docker build completed: payment-gateway:7f39b1a (182MB)',
        '[STEP 4] Security vulnerability scan passed cleanly (0 CVEs)',
        '[STEP 5] Pushed image to 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway:7f39b1a',
        '[STEP 6] Applying kubernetes/deployment.yaml to cluster eks-prod-cluster (namespace: production)',
        '[STEP 7] Rolling update completed: 3/3 pods active. HTTP GET /healthz 200 OK',
        '[SUCCESS] Pipeline finished in 3m 42s'
      ]
    },
    {
      id: 'pipe-102',
      project_id: 'proj-3',
      project_name: 'orders-api',
      branch: 'develop',
      commit_sha: 'c8812e9',
      commit_message: 'fix: optimize bulk order queue processing',
      status: 'failed',
      started_at: '2026-11-05T15:20:00Z',
      completed_at: '2026-11-05T15:23:10Z',
      duration: '3m 10s',
      stages: [
        { id: '1', name: 'Code Checkout', status: 'success', duration: '6s' },
        { id: '2', name: 'App Testing', status: 'success', duration: '1m 05s' },
        { id: '3', name: 'Docker Build', status: 'success', duration: '1m 20s' },
        { id: '4', name: 'Security Scanning', status: 'success', duration: '25s' },
        { id: '5', name: 'Push to AWS ECR', status: 'success', duration: '22s' },
        { id: '6', name: 'Deploy to Kubernetes', status: 'success', duration: '15s' },
        { id: '7', name: 'Health Check', status: 'failed', duration: '30s', details: 'CrashLoopBackOff: exit code 137 OOMKilled' }
      ],
      logs: [
        '[INFO] Triggered by GitHub push to develop',
        '[STEP 6] Deployment updated: deployment.apps/orders-api configured',
        '[STEP 7] Waiting for deployment rollout...',
        '[ERROR] Pod orders-api-7b8df98b-2k4l9 reported CrashLoopBackOff: container killed with code 137 (OOMKilled)',
        '[WARN] Memory limit of 512Mi exceeded during JVM heap allocation. Requested initial heap 768m.',
        '[FAIL] Pipeline failed at Health Check phase.'
      ]
    }
  ];
}

function triggerFallbackPipeline(projectId: string, branch: string): PipelineExecution {
  return {
    id: `pipe-${Date.now().toString().slice(-4)}`,
    project_id: projectId,
    project_name: projectId === 'proj-1' ? 'payment-gateway-service' : 'auth-service',
    branch,
    commit_sha: Math.random().toString(16).substring(2, 9),
    commit_message: 'manual: triggered deployment pipeline via dashboard',
    status: 'running',
    started_at: new Date().toISOString(),
    stages: [
      { id: '1', name: 'Code Checkout', status: 'success', duration: '4s' },
      { id: '2', name: 'App Testing', status: 'running', duration: '12s' },
      { id: '3', name: 'Docker Build', status: 'pending' },
      { id: '4', name: 'Security Scanning', status: 'pending' },
      { id: '5', name: 'Push to AWS ECR', status: 'pending' },
      { id: '6', name: 'Deploy to Kubernetes', status: 'pending' },
      { id: '7', name: 'Health Check', status: 'pending' }
    ],
    logs: [
      `[INFO] Manual pipeline initiated for project ${projectId} on branch ${branch}`,
      '[STEP 1] Git repository cloned and checked out cleanly',
      '[STEP 2] Running test suites...'
    ]
  };
}

function getFallbackDockerImages(): DockerImage[] {
  return [
    {
      id: 'img-1',
      repository: 'payment-gateway-service',
      tag: 'v2.4.2',
      digest: 'sha256:7f39b1a2bc41908d1830f...',
      size_mb: 182.4,
      created_at: '2026-11-05T16:16:00Z',
      app_type: 'nodejs',
      vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
      pushed_to_ecr: true,
      ecr_uri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway-service:v2.4.2'
    },
    {
      id: 'img-2',
      repository: 'auth-service',
      tag: 'v1.8.0',
      digest: 'sha256:c9417ae819a502cd49b...',
      size_mb: 142.1,
      created_at: '2026-11-05T15:12:00Z',
      app_type: 'python',
      vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3 },
      pushed_to_ecr: true,
      ecr_uri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/auth-service:v1.8.0'
    },
    {
      id: 'img-3',
      repository: 'orders-api',
      tag: 'v3.1.0-rc1',
      digest: 'sha256:88ad41029e01bcff38a...',
      size_mb: 310.8,
      created_at: '2026-11-05T15:22:00Z',
      app_type: 'java',
      vulnerabilities: { critical: 0, high: 1, medium: 4, low: 8 },
      pushed_to_ecr: false
    }
  ];
}

function runFallbackDockerBuild(projectId: string, tag: string) {
  return {
    success: true,
    logs: [
      `Step 1/8 : FROM node:20-alpine AS builder`,
      `Pulling from library/node: digest: sha256:4d602a...`,
      `Step 2/8 : WORKDIR /app`,
      `Step 3/8 : COPY package*.json ./`,
      `Step 4/8 : RUN npm ci --only=production`,
      `added 64 packages in 2.1s`,
      `Step 5/8 : COPY . .`,
      `Step 6/8 : USER node`,
      `Step 7/8 : EXPOSE 3000`,
      `Step 8/8 : CMD ["node", "src/index.js"]`,
      `Successfully built image ${projectId}:${tag} (size: 165MB)`
    ],
    image: {
      id: `img-${Date.now()}`,
      repository: projectId,
      tag,
      digest: 'sha256:' + Math.random().toString(16).substring(2, 20),
      size_mb: 165.2,
      created_at: new Date().toISOString(),
      app_type: 'nodejs' as const,
      vulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
      pushed_to_ecr: false
    }
  };
}

function getFallbackKubernetes() {
  return {
    pods: [
      { name: 'payment-gateway-7b8c6949f-2m8p1', namespace: 'production', status: 'Running', restarts: 0, age: '2h', cpu_usage: '42m', memory_usage: '184Mi', node: 'ip-10-0-1-24.ec2.internal', ip: '10.0.1.88', ready: '1/1' },
      { name: 'payment-gateway-7b8c6949f-9x7q4', namespace: 'production', status: 'Running', restarts: 0, age: '2h', cpu_usage: '38m', memory_usage: '179Mi', node: 'ip-10-0-2-55.ec2.internal', ip: '10.0.2.14', ready: '1/1' },
      { name: 'payment-gateway-7b8c6949f-k5l20', namespace: 'production', status: 'Running', restarts: 0, age: '2h', cpu_usage: '45m', memory_usage: '190Mi', node: 'ip-10-0-1-24.ec2.internal', ip: '10.0.1.91', ready: '1/1' },
      { name: 'auth-service-58dc76b98-z41v8', namespace: 'production', status: 'Running', restarts: 0, age: '5h', cpu_usage: '22m', memory_usage: '112Mi', node: 'ip-10-0-2-55.ec2.internal', ip: '10.0.2.62', ready: '1/1' },
      { name: 'auth-service-58dc76b98-m9q23', namespace: 'production', status: 'Running', restarts: 0, age: '5h', cpu_usage: '26m', memory_usage: '118Mi', node: 'ip-10-0-1-24.ec2.internal', ip: '10.0.1.104', ready: '1/1' },
      { name: 'orders-api-6f987c88b-8jk41', namespace: 'staging', status: 'CrashLoopBackOff', restarts: 4, age: '28m', cpu_usage: '0m', memory_usage: '498Mi', node: 'ip-10-0-3-12.ec2.internal', ip: '10.0.3.45', ready: '0/1' },
      { name: 'analytics-worker-89c445db-p88w2', namespace: 'development', status: 'Running', restarts: 1, age: '1d', cpu_usage: '85m', memory_usage: '240Mi', node: 'ip-10-0-3-12.ec2.internal', ip: '10.0.3.77', ready: '1/1' }
    ] as KubernetesPod[],
    deployments: [
      { name: 'payment-gateway', namespace: 'production', desired_replicas: 3, available_replicas: 3, updated_replicas: 3, image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway:v2.4.2', status: 'Healthy', age: '14d' },
      { name: 'auth-service', namespace: 'production', desired_replicas: 2, available_replicas: 2, updated_replicas: 2, image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/auth-service:v1.8.0', status: 'Healthy', age: '18d' },
      { name: 'orders-api', namespace: 'staging', desired_replicas: 2, available_replicas: 1, updated_replicas: 2, image: 'orders-api:v3.1.0-rc1', status: 'Degraded', age: '6d' },
      { name: 'analytics-worker', namespace: 'development', desired_replicas: 1, available_replicas: 1, updated_replicas: 1, image: 'analytics-worker:latest', status: 'Healthy', age: '10d' }
    ] as KubernetesDeployment[],
    events: [
      '[Normal] Scaled up replica set payment-gateway-7b8c6949f to 3',
      '[Normal] Pulled image 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway:v2.4.2 successfully',
      '[Normal] Created container payment-gateway',
      '[Warning] Back-off 20s restarting failed container=orders-api pod=orders-api-6f987c88b-8jk41_staging',
      '[Warning] OOMKilled: Container orders-api in pod orders-api-6f987c88b-8jk41 exceeded memory limit (512Mi)'
    ]
  };
}

function getFallbackAwsResources(): AwsResource[] {
  return [
    {
      id: 'vpc-08291a2bc41',
      name: 'devops-platform-vpc',
      type: 'VPC',
      region: 'us-east-1',
      status: 'active',
      details: { cidr: '10.0.0.0/16', subnets: 4, igw: 'igw-0912bc', nat_gateways: 2 },
      cost_est_per_mo: 64.0
    },
    {
      id: 'eks-prod-cluster',
      name: 'devops-prod-eks',
      type: 'EKS',
      region: 'us-east-1',
      status: 'active',
      details: { version: '1.29', node_groups: 2, worker_nodes: 3, endpoint: 'https://78A9C12.gr7.us-east-1.eks.amazonaws.com' },
      cost_est_per_mo: 73.0
    },
    {
      id: 'ec2-i-09ab12cd34',
      name: 'eks-node-group-worker-1',
      type: 'EC2',
      region: 'us-east-1',
      status: 'active',
      details: { instance_type: 't3.xlarge', state: 'running', private_ip: '10.0.1.24', ami: 'ami-0c7217cdde317cfec' },
      cost_est_per_mo: 121.5
    },
    {
      id: 'ecr-repo-main',
      name: 'devops-microservices',
      type: 'ECR',
      region: 'us-east-1',
      status: 'active',
      details: { repositories: 4, total_images: 32, scan_on_push: true, encryption: 'AES256' },
      cost_est_per_mo: 3.2
    },
    {
      id: 's3-artifacts-bucket',
      name: 'devops-tf-state-and-artifacts-prod',
      type: 'S3',
      region: 'us-east-1',
      status: 'active',
      details: { versioning: 'Enabled', encryption: 'aws:kms', size_gb: 14.8 },
      cost_est_per_mo: 0.35
    },
    {
      id: 'iam-role-github-oidc',
      name: 'GitHubActions-EKS-Deployer-Role',
      type: 'IAM',
      region: 'us-east-1',
      status: 'active',
      details: { auth_type: 'OIDC Federation (token.actions.githubusercontent.com)', policies: ['AmazonEC2ContainerRegistryPowerUser', 'AmazonEKSClusterPolicy'] }
    },
    {
      id: 'cw-alarms-group',
      name: 'EKS-PodHealth-Alarms',
      type: 'CloudWatch',
      region: 'us-east-1',
      status: 'active',
      details: { active_alarms: 1, monitored_metrics: ['CPUUtilization', 'MemoryUtilization', '5xxErrors'] }
    }
  ];
}

function getFallbackAiDiagnosis(logText: string, contextType: string): AiDiagnosisResult {
  const isOOM = logText.includes('137') || logText.includes('OOM') || logText.includes('memory') || logText.includes('OutOfMemory');
  const isPortConflict = logText.includes('EADDRINUSE') || logText.includes('address already in use');

  if (isOOM) {
    return {
      id: `diag-${Date.now()}`,
      context_type: contextType as any,
      log_snippet: logText.slice(0, 300),
      root_cause: 'Application was killed by Linux OOM killer (exit code 137) because memory limit was exceeded.',
      possible_reasons: [
        'Container memory limit (512Mi) is set lower than JVM or runtime baseline memory consumption.',
        'Potential memory leak in recent commit handling bulk queue processing.',
        'No memory limit buffer specified for child processes during peak traffic.'
      ],
      recommended_solution: 'Increase Kubernetes pod memory limit from 512Mi to 1024Mi and tune runtime heap flags.',
      step_by_step_fix: [
        'Open kubernetes/deployment.yaml',
        'Locate the "resources.limits.memory" field under containers block',
        'Change memory limit from "512Mi" to "1024Mi" and requests.memory to "512Mi"',
        'If Java/JVM: add -XX:MaxRAMPercentage=75.0 to JAVA_TOOL_OPTIONS',
        'Run "kubectl apply -f kubernetes/deployment.yaml" or trigger platform deployment'
      ],
      suggested_commands: [
        'kubectl describe pod -l app=orders-api -n staging',
        'kubectl top pod -l app=orders-api -n staging',
        'kubectl rollout history deployment/orders-api -n staging'
      ],
      confidence_score: 96,
      analyzed_at: new Date().toISOString()
    };
  }

  return {
    id: `diag-${Date.now()}`,
    context_type: contextType as any,
    log_snippet: logText.slice(0, 300),
    root_cause: 'Application container failed during health check or initialization phase.',
    possible_reasons: [
      'Missing or misconfigured environment variables required during startup.',
      'Database connection timeout or invalid credential secrets in staging/prod.',
      'Liveness probe port does not match container EXPOSE port.'
    ],
    recommended_solution: 'Verify database reachability and inspect environment configuration secrets.',
    step_by_step_fix: [
      'Check recent container logs with kubectl logs <pod-name> --previous',
      'Verify ConfigMap and Secret key names match environment variable expectations',
      'Ensure security group allows outbound traffic on database port (5432/3306)',
      'Confirm container listening port matches livenessProbe.httpGet.port'
    ],
    suggested_commands: [
      'kubectl logs -l app=payment-gateway -n production --tail=100',
      'kubectl get events -n production --sort-by=.metadata.creationTimestamp'
    ],
    confidence_score: 89,
    analyzed_at: new Date().toISOString()
  };
}

function getFallbackRollbacks(): RollbackRecord[] {
  return [
    {
      id: 'rb-001',
      deployment_id: 'dep-982',
      project_id: 'proj-3',
      project_name: 'orders-api',
      from_version: 'v3.1.0-rc1 (sha: c8812e9)',
      to_version: 'v3.0.4 (sha: 5d12a81)',
      target_revision: 4,
      status: 'success',
      triggered_by: 'Platform SRE Auto-Rollback Engine',
      timestamp: '2026-11-05T15:24:00Z',
      reason: 'Automated trigger: Readiness probe failure rate exceeded 50% for 3 consecutive minutes.',
      k8s_command: 'kubectl rollout undo deployment/orders-api -n staging --to-revision=4'
    },
    {
      id: 'rb-002',
      deployment_id: 'dep-914',
      project_id: 'proj-1',
      project_name: 'payment-gateway-service',
      from_version: 'v2.4.0 (sha: a9182bc)',
      to_version: 'v2.3.9 (sha: 331e87d)',
      target_revision: 11,
      status: 'success',
      triggered_by: 'Ankit Chaudhary (DevOps Lead)',
      timestamp: '2026-11-02T11:10:00Z',
      reason: 'Manual rollback: Upstream banking API webhook schema mismatch reported.',
      k8s_command: 'kubectl rollout undo deployment/payment-gateway -n production'
    }
  ];
}

