#!/usr/bin/env node

/**
 * Kubernetes Cluster Metrics Agent
 *
 * Collects Kubernetes cluster metrics and sends them to MonitHQ.
 *
 * Installation:
 *   npm install @kubernetes/client-node
 *
 * Usage:
 *   node send-k8s-metrics.js <siteId> <apiToken> [namespace]
 *
 * Requirements:
 *   - kubectl configured with cluster access
 *   - KUBECONFIG environment variable set (or ~/.kube/config)
 */

const k8s = require('@kubernetes/client-node');

const SITE_ID = process.argv[2] || process.env.MONIT_SITE_ID;
const API_TOKEN = process.argv[3] || process.env.MONIT_API_TOKEN;
const NAMESPACE = process.argv[4] || process.env.K8S_NAMESPACE || 'default';
const API_URL = process.env.MONIT_API_URL || 'http://localhost:3000';

if (!SITE_ID || !API_TOKEN) {
  console.error('Usage: node send-k8s-metrics.js <siteId> <apiToken> [namespace]');
  process.exit(1);
}

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

async function getClusterMetrics() {
  try {
    // Get nodes
    const nodesResponse = await k8sApi.listNode();
    const nodes = nodesResponse.body.items;
    const nodeCount = nodes.length;
    const nodesReady = nodes.filter(node => {
      const condition = node.status.conditions.find(c => c.type === 'Ready');
      return condition && condition.status === 'True';
    }).length;
    const nodesNotReady = nodeCount - nodesReady;

    // Get pods
    const podsResponse = await k8sApi.listNamespacedPod(NAMESPACE);
    const pods = podsResponse.body.items;
    const podCount = pods.length;
    const podsRunning = pods.filter(p => p.status.phase === 'Running').length;
    const podsPending = pods.filter(p => p.status.phase === 'Pending').length;
    const podsFailed = pods.filter(p => p.status.phase === 'Failed').length;

    // Get deployments
    const deploymentsResponse = await appsApi.listNamespacedDeployment(NAMESPACE);
    const deploymentCount = deploymentsResponse.body.items.length;

    // Get services
    const servicesResponse = await k8sApi.listNamespacedService(NAMESPACE);
    const serviceCount = servicesResponse.body.items.length;

    // Get ingresses
    let ingressCount = 0;
    try {
      const ingressesResponse = await networkingApi.listNamespacedIngress(NAMESPACE);
      ingressCount = ingressesResponse.body.items.length;
    } catch (e) {
      // Ingress API might not be available
    }

    // Get PVCs
    const pvcsResponse = await k8sApi.listNamespacedPersistentVolumeClaim(NAMESPACE);
    const pvcCount = pvcsResponse.body.items.length;

    // Get events (warnings and errors)
    const eventsResponse = await k8sApi.listNamespacedEvent(NAMESPACE);
    const events = eventsResponse.body.items;
    const recentEvents = events
      .filter(e => {
        const eventTime = new Date(e.lastTimestamp || e.eventTime);
        const hourAgo = Date.now() - (60 * 60 * 1000);
        return eventTime.getTime() > hourAgo;
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastTimestamp || a.eventTime);
        const bTime = new Date(b.lastTimestamp || b.eventTime);
        return bTime - aTime;
      });

    const warningEvents = recentEvents
      .filter(e => e.type === 'Warning')
      .slice(0, 10)
      .map(e => `${e.involvedObject.name}: ${e.message}`);

    const errorEvents = recentEvents
      .filter(e => e.type === 'Error' || (e.reason && e.reason.toLowerCase().includes('error')))
      .slice(0, 10)
      .map(e => `${e.involvedObject.name}: ${e.message}`);

    // Determine health status
    let healthStatus = 'healthy';
    if (nodesNotReady > 0 || podsFailed > 0) {
      healthStatus = 'degraded';
    }
    if (nodesNotReady > nodeCount * 0.5 || podsFailed > podCount * 0.3) {
      healthStatus = 'critical';
    }

    // Get cluster context name
    const currentContext = kc.getCurrentContext();
    const clusterName = currentContext || 'default';

    const metrics = {
      clusterName,
      namespace: NAMESPACE,

      nodeCount,
      nodesReady,
      nodesNotReady,

      podCount,
      podsRunning,
      podsPending,
      podsFailed,

      healthStatus,

      deploymentCount,
      serviceCount,
      ingressCount,
      pvcCount,

      warningEvents: warningEvents.length > 0 ? warningEvents : null,
      errorEvents: errorEvents.length > 0 ? errorEvents : null,

      nodeReadyThreshold: 80.0,
      podRunningThreshold: 90.0,
    };

    return metrics;
  } catch (error) {
    console.error('Error collecting cluster metrics:', error.message);
    throw error;
  }
}

async function sendClusterMetrics(metrics) {
  try {
    const response = await fetch(`${API_URL}/api/sites/${SITE_ID}/infrastructure/clusters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send metrics');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error sending cluster metrics:', error.message);
    throw error;
  }
}

async function main() {
  console.log(`☸️  Collecting Kubernetes cluster metrics (namespace: ${NAMESPACE})...`);

  try {
    const metrics = await getClusterMetrics();

    console.log(`   Cluster: ${metrics.clusterName}`);
    console.log(`   Nodes: ${metrics.nodesReady}/${metrics.nodeCount} ready`);
    console.log(`   Pods: ${metrics.podsRunning}/${metrics.podCount} running`);

    console.log('📤 Sending to MonitHQ...');
    const result = await sendClusterMetrics(metrics);

    console.log(`✅ Cluster metrics sent successfully`);
    console.log(`   Health: ${result.clusterMetrics.healthStatus}`);
    console.log(`   Healthy: ${result.healthy}, Issues: ${result.issueCount}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
