'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, RefreshCw, AlertCircle, CheckCircle2, Server, Box, Activity, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export default function ClusterMetricsCard({ siteId }) {
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [latestByCluster, setLatestByCluster] = useState({});
  const [error, setError] = useState(null);
  const [expandedCluster, setExpandedCluster] = useState(null);

  const fetchClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/infrastructure/clusters?hours=24&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch cluster metrics');
      }
      const data = await response.json();
      setClusters(data.clusters);
      setStatistics(data.statistics);
      setLatestByCluster(data.latestByCluster);
    } catch (err) {
      console.error('Error fetching cluster metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [siteId]);

  const getHealthStatusColor = (healthStatus) => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getHealthStatusBg = (healthStatus) => {
    switch (healthStatus) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-background/50 border-border';
    }
  };

  const MetricBadge = ({ label, value, color = 'text-foreground' }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Kubernetes Clusters
          </CardTitle>
          <button
            onClick={fetchClusters}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Total Clusters</div>
              <div className="text-2xl font-bold text-foreground">{statistics.totalClusters}</div>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Healthy</div>
              <div className="text-2xl font-bold text-green-500">{statistics.healthyClusters}</div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-xs text-muted-foreground mb-1">Degraded</div>
              <div className="text-2xl font-bold text-yellow-500">{statistics.degradedClusters}</div>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-500">{statistics.criticalClusters}</div>
            </div>
          </div>
        )}

        {/* Cluster List */}
        {Object.keys(latestByCluster).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(latestByCluster).map(([clusterName, cluster]) => {
              const isExpanded = expandedCluster === clusterName;
              const StatusIcon = cluster.healthStatus === 'healthy' ? CheckCircle2 : AlertCircle;

              return (
                <motion.div
                  key={clusterName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${getHealthStatusBg(cluster.healthStatus)} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => setExpandedCluster(isExpanded ? null : clusterName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className={`w-5 h-5 ${getHealthStatusColor(cluster.healthStatus)}`} />
                      <div>
                        <div className="font-medium text-foreground">{cluster.clusterName}</div>
                        {cluster.namespace && (
                          <div className="text-xs text-muted-foreground">Namespace: {cluster.namespace}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{cluster.nodesReady}/{cluster.nodeCount} Nodes</div>
                        <div className="text-xs text-muted-foreground">{cluster.podsRunning}/{cluster.podCount} Pods</div>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cluster.healthStatus === 'healthy' ? 'bg-green-500/20 text-green-500' :
                        cluster.healthStatus === 'degraded' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {cluster.healthStatus}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        {/* Node & Pod Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-background/50">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              Nodes Ready
                            </div>
                            <div className="text-lg font-bold text-foreground">{cluster.nodesReady}/{cluster.nodeCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {((cluster.nodesReady / cluster.nodeCount) * 100).toFixed(1)}%
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-background/50">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Box className="w-3 h-3" />
                              Pods Running
                            </div>
                            <div className="text-lg font-bold text-foreground">{cluster.podsRunning}/{cluster.podCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {((cluster.podsRunning / cluster.podCount) * 100).toFixed(1)}%
                            </div>
                          </div>

                          {cluster.podsPending > 0 && (
                            <div className="p-3 rounded-lg bg-yellow-500/10">
                              <div className="text-xs text-muted-foreground mb-1">Pods Pending</div>
                              <div className="text-lg font-bold text-yellow-500">{cluster.podsPending}</div>
                            </div>
                          )}

                          {cluster.podsFailed > 0 && (
                            <div className="p-3 rounded-lg bg-red-500/10">
                              <div className="text-xs text-muted-foreground mb-1">Pods Failed</div>
                              <div className="text-lg font-bold text-red-500">{cluster.podsFailed}</div>
                            </div>
                          )}
                        </div>

                        {/* Resource Utilization */}
                        {(cluster.cpuRequestPercent || cluster.memRequestPercent) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {cluster.cpuRequestPercent !== null && (
                              <div className="p-3 rounded-lg bg-background/50">
                                <div className="text-xs text-muted-foreground mb-1">CPU Requests</div>
                                <div className="text-lg font-bold text-foreground">{cluster.cpuRequestPercent.toFixed(1)}%</div>
                              </div>
                            )}

                            {cluster.cpuLimitPercent !== null && (
                              <div className="p-3 rounded-lg bg-background/50">
                                <div className="text-xs text-muted-foreground mb-1">CPU Limits</div>
                                <div className="text-lg font-bold text-foreground">{cluster.cpuLimitPercent.toFixed(1)}%</div>
                              </div>
                            )}

                            {cluster.memRequestPercent !== null && (
                              <div className="p-3 rounded-lg bg-background/50">
                                <div className="text-xs text-muted-foreground mb-1">Memory Requests</div>
                                <div className="text-lg font-bold text-foreground">{cluster.memRequestPercent.toFixed(1)}%</div>
                              </div>
                            )}

                            {cluster.memLimitPercent !== null && (
                              <div className="p-3 rounded-lg bg-background/50">
                                <div className="text-xs text-muted-foreground mb-1">Memory Limits</div>
                                <div className="text-lg font-bold text-foreground">{cluster.memLimitPercent.toFixed(1)}%</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Workload Counts */}
                        {(cluster.deploymentCount || cluster.serviceCount || cluster.ingressCount || cluster.pvcCount) && (
                          <div className="p-3 rounded-lg bg-background/50 mb-4">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Workloads</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {cluster.deploymentCount !== null && (
                                <MetricBadge label="Deployments" value={cluster.deploymentCount} />
                              )}
                              {cluster.serviceCount !== null && (
                                <MetricBadge label="Services" value={cluster.serviceCount} />
                              )}
                              {cluster.ingressCount !== null && (
                                <MetricBadge label="Ingresses" value={cluster.ingressCount} />
                              )}
                              {cluster.pvcCount !== null && (
                                <MetricBadge label="PVCs" value={cluster.pvcCount} />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Issues */}
                        {cluster.issues && cluster.issues.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {cluster.issues.map((issue, index) => (
                              <div key={index} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium text-red-500">{issue.type.toUpperCase()}</div>
                                    <div className="text-xs text-muted-foreground">{issue.message}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Events */}
                        {cluster.errorEvents && Array.isArray(cluster.errorEvents) && cluster.errorEvents.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                            <div className="text-xs font-medium text-red-500 mb-2">Recent Error Events</div>
                            <div className="space-y-1">
                              {cluster.errorEvents.slice(0, 5).map((event, index) => (
                                <div key={index} className="text-xs text-muted-foreground">• {event}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cluster.warningEvents && Array.isArray(cluster.warningEvents) && cluster.warningEvents.length > 0 && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
                            <div className="text-xs font-medium text-yellow-500 mb-2">Recent Warning Events</div>
                            <div className="space-y-1">
                              {cluster.warningEvents.slice(0, 5).map((event, index) => (
                                <div key={index} className="text-xs text-muted-foreground">• {event}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Last Checked */}
                        <div className="text-xs text-muted-foreground">
                          Last checked: {new Date(cluster.checkedAt).toLocaleString()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading cluster metrics...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No cluster metrics available</p>
            <p className="text-sm text-muted-foreground/70">Click "Refresh" to fetch latest cluster status</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
