import React, { useState, useEffect } from 'react';
import { Sidebar, SectionId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TerminalModal } from './components/layout/TerminalModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';

import { OverviewView } from './components/views/OverviewView';
import { ProjectsView } from './components/views/ProjectsView';
import { PipelinesView } from './components/views/PipelinesView';
import { DockerView } from './components/views/DockerView';
import { KubernetesView } from './components/views/KubernetesView';
import { AwsView } from './components/views/AwsView';
import { TerraformView } from './components/views/TerraformView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { MonitoringView } from './components/views/MonitoringView';
import { HistoryRollbackView } from './components/views/HistoryRollbackView';
import { SettingsView } from './components/views/SettingsView';

import { api } from './services/api';
import {
  Project,
  PipelineExecution,
  DockerImage,
  KubernetesPod,
  KubernetesDeployment,
  AwsResource,
  TerraformModuleRun,
  RollbackRecord,
  SystemOverview
} from './types';

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<SectionId>('overview');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Platform Data State
  const [overview, setOverview] = useState<SystemOverview>({
    total_projects: 4,
    successful_deployments: 28,
    failed_deployments: 2,
    running_containers: 14,
    active_k8s_pods: 9,
    pipeline_success_rate: 93.3,
    infrastructure_status: 'Healthy',
    recent_activity: []
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelines, setPipelines] = useState<PipelineExecution[]>([]);
  const [dockerImages, setDockerImages] = useState<DockerImage[]>([]);
  const [k8sPods, setK8sPods] = useState<KubernetesPod[]>([]);
  const [k8sDeployments, setK8sDeployments] = useState<KubernetesDeployment[]>([]);
  const [k8sEvents, setK8sEvents] = useState<string[]>([]);
  const [awsResources, setAwsResources] = useState<AwsResource[]>([]);
  const [terraformState, setTerraformState] = useState<TerraformModuleRun>({
    action: 'plan',
    status: 'success',
    resources_to_add: 8,
    resources_to_change: 2,
    resources_to_destroy: 0,
    logs: ['Terraform CLI ready.']
  });
  const [rollbacks, setRollbacks] = useState<RollbackRecord[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Loading
  useEffect(() => {
    const initData = async () => {
      try {
        const health = await api.checkBackendHealth();
        setIsBackendConnected(health.status !== 'demo_fallback');

        const [ov, prjs, pipes, imgs, k8s, aws, tf, rbs] = await Promise.all([
          api.getOverview(),
          api.getProjects(),
          api.getPipelines(),
          api.getDockerImages(),
          api.getKubernetesStatus(),
          api.getAwsResources(),
          api.getTerraformStatus(),
          api.getRollbacks(),
        ]);

        setOverview(ov);
        setProjects(prjs);
        setPipelines(pipes);
        setDockerImages(imgs);
        setK8sPods(k8s.pods);
        setK8sDeployments(k8s.deployments);
        setK8sEvents(k8s.events);
        setAwsResources(aws);
        setTerraformState(tf);
        setRollbacks(rbs);
      } catch (err) {
        console.error('Data initialization error:', err);
      }
    };

    initData();
  }, []);

  // Handlers
  const handleCreateProject = async (newProj: Partial<Project>) => {
    try {
      const created = await api.createProject(newProj);
      setProjects((prev) => [created, ...prev]);
      addToast('success', 'Project Connected', `${created.name} tracking branch "${created.branch}"`);
    } catch {
      const fallback: Project = {
        id: `proj-${Date.now()}`,
        name: newProj.name || 'new-service',
        repo_url: newProj.repo_url || 'https://github.com/org/service',
        branch: newProj.branch || 'main',
        app_type: newProj.app_type || 'nodejs',
        port: newProj.port || 3000,
        replicas: newProj.replicas || 2,
        cpu_limit: newProj.cpu_limit || '500m',
        memory_limit: newProj.memory_limit || '512Mi',
        environment: newProj.environment || 'production',
        env_vars: newProj.env_vars || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_deployment_status: 'success',
        deployment_count: 1
      };
      setProjects((prev) => [fallback, ...prev]);
      addToast('success', 'Project Connected (Local)', `${fallback.name} configured.`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
    } catch {}
    setProjects((prev) => prev.filter((p) => p.id !== id));
    addToast('info', 'Project Removed', 'Application deregistered from platform.');
  };

  const handleTriggerPipeline = async (projectId: string, branch = 'main') => {
    try {
      addToast('info', 'Pipeline Started', `Triggering GitHub Actions workflow for project ${projectId}...`);
      const pipe = await api.triggerPipeline(projectId, branch);
      setPipelines((prev) => [pipe, ...prev]);
      setCurrentSection('pipelines');
      addToast('success', 'Pipeline Dispatched', `Execution #${pipe.id} running on branch ${branch}`);
    } catch {
      addToast('error', 'Pipeline Error', 'Could not dispatch CI/CD workflow.');
    }
  };

  const handleBuildDockerImage = async (projectId: string, tag: string) => {
    addToast('info', 'Docker Build Initiated', `Building multi-stage container for ${projectId}:${tag}`);
    const res = await api.buildDockerImage(projectId, tag);
    if (res.image) {
      setDockerImages((prev) => [res.image!, ...prev]);
      addToast('success', 'Image Built Successfully', `Tagged ${projectId}:${tag} (${res.image!.size_mb} MB)`);
    }
    return res;
  };

  const handlePushToEcr = async (imageId: string, repoName: string) => {
    addToast('info', 'AWS ECR Push Started', `Authenticating with AWS STS OIDC and pushing ${repoName}...`);
    const res = await api.pushToEcr(imageId, repoName);
    setDockerImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, pushed_to_ecr: true, ecr_uri: res.ecr_uri } : img
      )
    );
    addToast('success', 'Image Published to AWS ECR', res.ecr_uri);
    return res;
  };

  const handleScaleDeployment = async (name: string, replicas: number) => {
    addToast('info', 'Kubernetes Scaling', `Scaling deployment ${name} to ${replicas} replicas...`);
    const res = await api.scaleDeployment(name, replicas);
    setK8sDeployments((prev) =>
      prev.map((d) => (d.name === name ? { ...d, desired_replicas: replicas, available_replicas: replicas } : d))
    );
    addToast('success', 'Deployment Scaled', res.message);
  };

  const handleExecuteTerraform = async (action: 'init' | 'validate' | 'plan' | 'apply' | 'destroy') => {
    addToast('info', `Terraform ${action.toUpperCase()}`, `Executing "terraform ${action}" on AWS infrastructure...`);
    const res = await api.executeTerraform(action);
    setTerraformState(res);
    addToast('success', `Terraform ${action.toUpperCase()} Finished`, `Exit code 0. Status: ${res.status}`);
    return res;
  };

  const handleTriggerRollback = async (projectId: string, deploymentName: string, targetRevision?: number) => {
    addToast('info', 'Triggering Rollback', `Invoking kubectl rollout undo deployment/${deploymentName}...`);
    const res = await api.triggerRollback(projectId, deploymentName, targetRevision);
    setRollbacks((prev) => [res, ...prev]);
    addToast('success', 'Rollback Succeeded', `Reverted ${deploymentName} to revision #${res.target_revision}`);
  };

  const handleRunTerminalCmd = async (cmd: string): Promise<string> => {
    if (cmd.startsWith('kubectl rollout undo')) {
      return 'deployment.apps/payment-gateway rolled back successfully to revision 3.\nPods terminating and rolling back.';
    }
    if (cmd.startsWith('terraform')) {
      return `Terraform v1.14.7\nCommand "${cmd}" completed with 0 errors.`;
    }
    return `[Engine] Command "${cmd}" executed successfully on cluster eks-prod-cluster.`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onDeployClick={() => handleTriggerPipeline(projects[0]?.id || 'proj-1', 'main')}
          onAiClick={() => setCurrentSection('ai-assistant')}
          systemStatus={overview.infrastructure_status}
        />

        {/* Dynamic Section View */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentSection === 'overview' && (
            <OverviewView
              overview={overview}
              onNavigate={setCurrentSection}
              onDeploy={() => handleTriggerPipeline(projects[0]?.id || 'proj-1', 'main')}
            />
          )}

          {currentSection === 'projects' && (
            <ProjectsView
              projects={projects}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onDeployProject={(id) => handleTriggerPipeline(id, 'main')}
              onNavigateToPipelines={() => setCurrentSection('pipelines')}
            />
          )}

          {currentSection === 'pipelines' && (
            <PipelinesView
              pipelines={pipelines}
              projects={projects}
              onTriggerPipeline={handleTriggerPipeline}
            />
          )}

          {currentSection === 'docker' && (
            <DockerView
              images={dockerImages}
              projects={projects}
              onBuildImage={handleBuildDockerImage}
              onPushToEcr={handlePushToEcr}
            />
          )}

          {currentSection === 'kubernetes' && (
            <KubernetesView
              pods={k8sPods}
              deployments={k8sDeployments}
              events={k8sEvents}
              onScaleDeployment={handleScaleDeployment}
              onRefresh={async () => {
                const k8s = await api.getKubernetesStatus();
                setK8sPods(k8s.pods);
                setK8sDeployments(k8s.deployments);
                setK8sEvents(k8s.events);
                addToast('info', 'Kubernetes Synchronized', 'Updated pods and events from cluster.');
              }}
            />
          )}

          {currentSection === 'aws' && <AwsView resources={awsResources} />}

          {currentSection === 'terraform' && (
            <TerraformView
              terraformState={terraformState}
              onExecute={handleExecuteTerraform}
            />
          )}

          {currentSection === 'ai-assistant' && (
            <AiAssistantView
              onDiagnose={api.diagnoseLog}
              onSendMessage={api.chatWithAi}
              onExecuteCommand={async (cmd) => {
                addToast('info', 'Command Approved & Executed', cmd);
                return handleRunTerminalCmd(cmd);
              }}
            />
          )}

          {currentSection === 'monitoring' && <MonitoringView />}

          {currentSection === 'history' && (
            <HistoryRollbackView
              rollbacks={rollbacks}
              projects={projects}
              onTriggerRollback={handleTriggerRollback}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              onSaveToast={() => addToast('success', 'Configurations Updated', 'Security and cluster settings saved.')}
            />
          )}
        </main>
      </div>

      {/* Interactive CLI Console Modal */}
      <TerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onRunCommand={handleRunTerminalCmd}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
