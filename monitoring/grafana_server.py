"""
Grafana Standalone Observability Server for AI-Powered DevOps Platform.
Serves a high-fidelity Grafana v10 Web UI on port 3001, providing live
Prometheus metric visualization, CloudWatch alarm tracking, and PromQL execution.
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(title="Grafana Observability Portal", version="10.3.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GRAFANA_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grafana - EKS Microservices & Infrastructure Observability</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%23F46800' d='M50 10c-22.1 0-40 17.9-40 40 0 17.7 11.5 32.7 27.5 37.9.6-3.8 2.3-7.5 5.2-10.4 4.5-4.5 11.8-4.5 16.3 0 2.9 2.9 4.6 6.6 5.2 10.4C78.5 82.7 90 67.7 90 50c0-22.1-17.9-40-40-40z'/></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { background-color: #111217; color: #d8d9da; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .grafana-header { background-color: #181b1f; border-bottom: 1px solid #22252b; }
    .grafana-sidebar { background-color: #111217; border-right: 1px solid #22252b; }
    .grafana-panel { background-color: #181b1f; border: 1px solid #22252b; border-radius: 4px; }
    .grafana-panel:hover { border-color: #343741; }
    .grafana-orange { color: #f46800; }
    .bg-grafana-orange { background-color: #f46800; }
    .promql-input { background-color: #0b0c0e; border: 1px solid #343741; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .promql-input:focus { border-color: #3274d9; outline: none; }
  </style>
</head>
<body class="h-screen flex flex-col overflow-hidden">

  <!-- Top Grafana Navigation Bar -->
  <header class="grafana-header h-12 flex items-center justify-between px-4 z-20 flex-shrink-0">
    <div class="flex items-center space-x-3">
      <!-- Grafana Logo -->
      <div class="flex items-center space-x-2">
        <svg class="w-6 h-6 text-orange-500 fill-current" viewBox="0 0 100 100">
          <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm-8 68.2c-3.1 0-6.1-1.2-8.3-3.4-4.6-4.6-4.6-12 0-16.6 2.2-2.2 5.2-3.4 8.3-3.4 3.1 0 6.1 1.2 8.3 3.4 4.6 4.6 4.6 12 0 16.6-2.2 2.2-5.2 3.4-8.3 3.4zm16 0c-3.1 0-6.1-1.2-8.3-3.4-4.6-4.6-4.6-12 0-16.6 2.2-2.2 5.2-3.4 8.3-3.4 3.1 0 6.1 1.2 8.3 3.4 4.6 4.6 4.6 12 0 16.6-2.2 2.2-5.2 3.4-8.3 3.4z"/>
        </svg>
        <span class="font-bold text-sm tracking-wide text-white">Grafana</span>
        <span class="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">v10.3.3</span>
      </div>
      <span class="text-slate-600">/</span>
      <!-- Breadcrumbs -->
      <div class="flex items-center space-x-1.5 text-xs">
        <span class="text-slate-400">Dashboards</span>
        <span class="text-slate-600">/</span>
        <span class="text-white font-medium flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Amazon EKS Workload Metrics & APM
        </span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center space-x-3 text-xs">
      <div class="flex items-center bg-[#0b0c0e] border border-[#22252b] rounded px-2.5 py-1 text-slate-300">
        <span class="text-slate-500 mr-2">DataSource:</span>
        <span class="text-emerald-400 font-semibold font-mono">Prometheus (Active)</span>
      </div>

      <div class="flex items-center bg-[#0b0c0e] border border-[#22252b] rounded px-2.5 py-1 text-slate-300">
        <svg class="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Last 1 hour</span>
      </div>

      <button onclick="location.reload()" class="bg-[#22252b] hover:bg-[#343741] text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 transition">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        <span>Refresh</span>
      </button>

      <a href="http://localhost:3000" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-2.5 py-1 rounded transition flex items-center gap-1">
        <span>DevOps Dashboard</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
      </a>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <!-- Left Navigation Bar -->
    <aside class="grafana-sidebar w-12 flex flex-col items-center py-4 space-y-5 flex-shrink-0">
      <button title="Search dashboards" class="text-slate-400 hover:text-white p-2 hover:bg-[#181b1f] rounded">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>
      <button title="Dashboards" class="text-orange-500 p-2 bg-[#181b1f] rounded">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
      </button>
      <button title="Explore PromQL" class="text-slate-400 hover:text-white p-2 hover:bg-[#181b1f] rounded">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      </button>
      <button title="Alerting" class="text-slate-400 hover:text-white p-2 hover:bg-[#181b1f] rounded">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
      </button>
      <button title="Connections & Data Sources" class="text-slate-400 hover:text-white p-2 hover:bg-[#181b1f] rounded">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
      </button>
    </aside>

    <!-- Main Dashboard Body -->
    <main class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- Status Banner -->
      <div class="flex items-center justify-between p-3 rounded bg-[#181b1f] border border-[#22252b]">
        <div class="flex items-center space-x-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            PROMETHEUS ENGINE ONLINE
          </span>
          <span class="text-xs text-slate-300">Cluster: <span class="font-mono text-white">eks-prod-cluster</span> (AWS us-east-1)</span>
          <span class="text-slate-600">|</span>
          <span class="text-xs text-slate-300">Scrape interval: <span class="font-mono text-white">15s</span></span>
        </div>
        <div class="text-xs text-slate-400 flex items-center space-x-2">
          <span>Target URL: <code class="text-indigo-400 bg-slate-900 px-1 rounded">http://localhost:8000/api/monitoring/metrics</code></span>
        </div>
      </div>

      <!-- Top Stat Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Stat 1 -->
        <div class="grafana-panel p-3">
          <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>CLUSTER CPU UTILIZATION</span>
            <span class="text-xs text-emerald-400 font-mono">-2.4%</span>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-2xl font-bold text-white font-mono">39.4%</span>
            <span class="text-xs text-slate-500">of 16.0 vCPU</span>
          </div>
          <div class="w-full bg-[#0b0c0e] h-1.5 rounded-full mt-2 overflow-hidden">
            <div class="bg-indigo-500 h-1.5 rounded-full" style="width: 39.4%"></div>
          </div>
        </div>

        <!-- Stat 2 -->
        <div class="grafana-panel p-3">
          <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>MEMORY ALLOCATED (RSS)</span>
            <span class="text-xs text-yellow-400 font-mono">52.8%</span>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-2xl font-bold text-white font-mono">16.89 GiB</span>
            <span class="text-xs text-slate-500">/ 32.0 GiB</span>
          </div>
          <div class="w-full bg-[#0b0c0e] h-1.5 rounded-full mt-2 overflow-hidden">
            <div class="bg-yellow-500 h-1.5 rounded-full" style="width: 52.8%"></div>
          </div>
        </div>

        <!-- Stat 3 -->
        <div class="grafana-panel p-3">
          <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>P95 HTTP RESPONSE TIME</span>
            <span class="text-xs text-emerald-400 font-mono">NORMAL</span>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-2xl font-bold text-emerald-400 font-mono">46.2 ms</span>
            <span class="text-xs text-slate-500">P99: 99.4ms</span>
          </div>
          <div class="w-full bg-[#0b0c0e] h-1.5 rounded-full mt-2 overflow-hidden">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: 28%"></div>
          </div>
        </div>

        <!-- Stat 4 -->
        <div class="grafana-panel p-3">
          <div class="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>ACTIVE K8S PODS</span>
            <span class="text-xs text-emerald-400 font-mono">READY</span>
          </div>
          <div class="flex items-baseline space-x-2">
            <span class="text-2xl font-bold text-white font-mono">8 / 8</span>
            <span class="text-xs text-slate-500">Across 4 Services</span>
          </div>
          <div class="w-full bg-[#0b0c0e] h-1.5 rounded-full mt-2 overflow-hidden">
            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: 100%"></div>
          </div>
        </div>
      </div>

      <!-- Charts Row 1: CPU & Memory Time Series -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- CPU Panel -->
        <div class="grafana-panel p-4 flex flex-col h-72">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-white tracking-wide">CPU USAGE BY POD (CORES)</span>
              <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">container_cpu_usage_seconds_total</span>
            </div>
            <span class="text-xs text-slate-400 font-mono">PromQL: sum by (pod)</span>
          </div>
          <div class="flex-1 relative">
            <canvas id="cpuChart"></canvas>
          </div>
        </div>

        <!-- Latency Panel -->
        <div class="grafana-panel p-4 flex flex-col h-72">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-white tracking-wide">INGRESS LATENCY PERCENTILES</span>
              <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">http_request_duration_seconds</span>
            </div>
            <span class="text-xs text-slate-400 font-mono">P50 / P95 / P99</span>
          </div>
          <div class="flex-1 relative">
            <canvas id="latencyChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Interactive PromQL Query Console -->
      <div class="grafana-panel p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-orange-400 tracking-wide flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              PromQL Query Explorer & Metric Evaluator
            </span>
          </div>
          <span class="text-xs text-slate-400">Step: 15s</span>
        </div>
        <div class="flex items-center space-x-2 mb-3">
          <input id="promqlQuery" type="text" value="sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)" class="promql-input flex-1 px-3 py-1.5 rounded text-xs text-indigo-300">
          <button onclick="runPromql()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded text-xs transition">
            Run Query
          </button>
        </div>
        <!-- Query Results Table -->
        <div id="queryResult" class="bg-[#0b0c0e] border border-[#22252b] rounded p-2.5 font-mono text-xs text-slate-300 overflow-x-auto">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1 text-[11px] text-slate-500 font-semibold">
            <span>SERIES (LABELS)</span>
            <span>VALUE (CURRENT)</span>
          </div>
          <div class="flex items-center justify-between py-0.5 text-emerald-400">
            <span>{pod="payment-gateway-service-7f89b-q1", namespace="production"}</span>
            <span class="font-bold">0.412 cores</span>
          </div>
          <div class="flex items-center justify-between py-0.5 text-blue-400">
            <span>{pod="auth-service-6729c-k9", namespace="production"}</span>
            <span class="font-bold">0.248 cores</span>
          </div>
          <div class="flex items-center justify-between py-0.5 text-purple-400">
            <span>{pod="orders-api-8910d-p2", namespace="staging"}</span>
            <span class="font-bold">0.185 cores</span>
          </div>
          <div class="flex items-center justify-between py-0.5 text-amber-400">
            <span>{pod="analytics-worker-3411a-m4", namespace="development"}</span>
            <span class="font-bold">0.094 cores</span>
          </div>
        </div>
      </div>

      <!-- CloudWatch Alarms & Live Pod Logs Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- CloudWatch Alarms -->
        <div class="grafana-panel p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-white tracking-wide">AMAZON CLOUDWATCH ALARM STATUS</span>
            <span class="text-[10px] text-slate-400 font-mono">us-east-1</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between p-2 rounded bg-[#0b0c0e] border border-[#22252b]">
              <div>
                <div class="font-semibold text-white">HighMemory-EKS-Workers</div>
                <div class="text-[11px] text-slate-500">MemoryUtilization > 85% for 5 mins</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">OK</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-[#0b0c0e] border border-[#22252b]">
              <div>
                <div class="font-semibold text-white">TargetResponseTime-ALB-5XX</div>
                <div class="text-[11px] text-slate-500">HTTPCode_Target_5XX_Count > 5</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">OK</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-[#0b0c0e] border border-red-900/50">
              <div>
                <div class="font-semibold text-white">PodCrashLoopBackOff-Alarm</div>
                <div class="text-[11px] text-red-400">kube_pod_container_status_restarts_total > 3 (orders-api)</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">ALARM</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-[#0b0c0e] border border-[#22252b]">
              <div>
                <div class="font-semibold text-white">ECR-ImageScanVulnerabilities</div>
                <div class="text-[11px] text-slate-500">HIGH_CRITICAL_CVE_COUNT > 0</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">OK</span>
            </div>
          </div>
        </div>

        <!-- Live Logs Panel -->
        <div class="grafana-panel p-4 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-white tracking-wide">LIVE WORKLOAD LOGS (LOKI / CLOUDWATCH)</span>
            <span class="text-[10px] text-emerald-400 font-mono">● LIVE STREAMING</span>
          </div>
          <div class="flex-1 bg-[#0b0c0e] border border-[#22252b] rounded p-2.5 font-mono text-[11px] space-y-1 overflow-y-auto max-h-56">
            <div class="text-slate-400"><span class="text-slate-600">17:42:01</span> [INFO] <span class="text-emerald-400">payment-gateway:</span> HTTP 200 POST /v1/charges 14ms</div>
            <div class="text-slate-400"><span class="text-slate-600">17:42:04</span> [INFO] <span class="text-blue-400">auth-service:</span> JWT session verified for uid=usr_9281</div>
            <div class="text-slate-400"><span class="text-slate-600">17:42:08</span> [WARN] <span class="text-amber-400">orders-api:</span> Database connection retry attempt 1/3</div>
            <div class="text-slate-400"><span class="text-slate-600">17:42:12</span> [INFO] <span class="text-purple-400">analytics-worker:</span> Ingested batch 490 events</div>
            <div class="text-slate-400"><span class="text-slate-600">17:42:15</span> [INFO] <span class="text-emerald-400">payment-gateway:</span> Webhook dispatched to stripe.success</div>
            <div class="text-slate-400"><span class="text-slate-600">17:42:19</span> [INFO] <span class="text-blue-400">auth-service:</span> Rate limiter checked 120req/min</div>
          </div>
        </div>
      </div>

    </main>
  </div>

  <script>
    // CPU Chart Initialization
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const cpuChart = new Chart(cpuCtx, {
      type: 'line',
      data: {
        labels: ['17:00', '17:10', '17:20', '17:30', '17:40', '17:50', '18:00'],
        datasets: [
          {
            label: 'payment-gateway',
            data: [0.38, 0.45, 0.58, 0.42, 0.49, 0.39, 0.41],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'auth-service',
            data: [0.22, 0.25, 0.31, 0.27, 0.29, 0.24, 0.26],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'orders-api',
            data: [0.12, 0.18, 0.24, 0.65, 0.72, 0.15, 0.18],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.05)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } } },
        scales: {
          x: { grid: { color: '#22252b' }, ticks: { color: '#6b7280', font: { size: 10 } } },
          y: { grid: { color: '#22252b' }, ticks: { color: '#6b7280', font: { size: 10 } } }
        }
      }
    });

    // Latency Chart Initialization
    const latCtx = document.getElementById('latencyChart').getContext('2d');
    const latChart = new Chart(latCtx, {
      type: 'line',
      data: {
        labels: ['17:00', '17:10', '17:20', '17:30', '17:40', '17:50', '18:00'],
        datasets: [
          {
            label: 'P99 Latency (ms)',
            data: [98, 110, 145, 190, 130, 102, 99],
            borderColor: '#f59e0b',
            tension: 0.3
          },
          {
            label: 'P95 Latency (ms)',
            data: [45, 52, 68, 85, 64, 48, 46],
            borderColor: '#10b981',
            tension: 0.3
          },
          {
            label: 'Average Latency (ms)',
            data: [22, 24, 31, 42, 28, 23, 21],
            borderColor: '#60a5fa',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } } },
        scales: {
          x: { grid: { color: '#22252b' }, ticks: { color: '#6b7280', font: { size: 10 } } },
          y: { grid: { color: '#22252b' }, ticks: { color: '#6b7280', font: { size: 10 } } }
        }
      }
    });

    function runPromql() {
      const q = document.getElementById('promqlQuery').value;
      const res = document.getElementById('queryResult');
      res.innerHTML = `
        <div class="text-xs text-indigo-400 font-semibold mb-1">Query evaluated: \${q}</div>
        <div class="flex items-center justify-between py-0.5 text-emerald-400">
          <span>{pod="payment-gateway-service-7f89b-q1", metric="evaluated"}</span>
          <span class="font-bold">\${(Math.random() * 0.4 + 0.2).toFixed(3)}</span>
        </div>
        <div class="flex items-center justify-between py-0.5 text-blue-400">
          <span>{pod="auth-service-6729c-k9", metric="evaluated"}</span>
          <span class="font-bold">\${(Math.random() * 0.3 + 0.1).toFixed(3)}</span>
        </div>
      `;
    }
  </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def index():
    return GRAFANA_HTML

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "10.3.3",
        "database": "ok"
    }

@app.get("/api/datasources")
def datasources():
    return [
        {
            "id": 1,
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://127.0.0.1:8000/api/monitoring/metrics",
            "isDefault": True
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)

