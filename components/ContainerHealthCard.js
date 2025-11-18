'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Cpu, MemoryStick, Activity, RotateCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export default function ContainerHealthCard({ siteId }) {
  const [loading, setLoading] = useState(false);
  const [containers, setContainers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [latestByContainer, setLatestByContainer] = useState({});
  const [error, setError] = useState(null);
  const [expandedContainer, setExpandedContainer] = useState(null);

  const fetchContainers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/infrastructure/containers?hours=24&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch container health');
      }
      const data = await response.json();
      setContainers(data.containers);
      setStatistics(data.statistics);
      setLatestByContainer(data.latestByContainer);
    } catch (err) {
      console.error('Error fetching container health:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, [siteId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'stopped':
        return 'text-gray-500';
      case 'paused':
        return 'text-yellow-500';
      case 'restarting':
        return 'text-orange-500';
      case 'dead':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/10 border-green-500/20';
      case 'stopped':
        return 'bg-gray-500/10 border-gray-500/20';
      case 'paused':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'restarting':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'dead':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-background/50 border-border';
    }
  };

  const getHealthStatusColor = (healthStatus) => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-500';
      case 'unhealthy':
        return 'text-red-500';
      case 'starting':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (mb) => {
    if (!mb) return 'N/A';
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Container className="w-5 h-5 text-primary" />
            Container Health
          </CardTitle>
          <button
            onClick={fetchContainers}
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
              <div className="text-xs text-muted-foreground mb-1">Total Containers</div>
              <div className="text-2xl font-bold text-foreground">{statistics.totalContainers}</div>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Running</div>
              <div className="text-2xl font-bold text-green-500">{statistics.runningContainers}</div>
            </div>

            <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
              <div className="text-xs text-muted-foreground mb-1">Stopped</div>
              <div className="text-2xl font-bold text-gray-500">{statistics.stoppedContainers}</div>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Unhealthy</div>
              <div className="text-2xl font-bold text-red-500">{statistics.unhealthyContainers}</div>
            </div>
          </div>
        )}

        {/* Container List */}
        {Object.keys(latestByContainer).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(latestByContainer).map(([containerName, container]) => {
              const isExpanded = expandedContainer === containerName;
              const StatusIcon = container.status === 'running' ? CheckCircle2 :
                                 container.status === 'stopped' ? XCircle : AlertCircle;

              return (
                <motion.div
                  key={containerName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${getStatusBg(container.status)} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => setExpandedContainer(isExpanded ? null : containerName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(container.status)}`} />
                      <div>
                        <div className="font-medium text-foreground">{container.containerName}</div>
                        <div className="text-xs text-muted-foreground">{container.imageName}{container.imageTag ? `:${container.imageTag}` : ''}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        container.status === 'running' ? 'bg-green-500/20 text-green-500' :
                        container.status === 'stopped' ? 'bg-gray-500/20 text-gray-500' :
                        'bg-orange-500/20 text-orange-500'
                      }`}>
                        {container.status}
                      </div>

                      {container.healthStatus && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          container.healthStatus === 'healthy' ? 'bg-green-500/20 text-green-500' :
                          container.healthStatus === 'unhealthy' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {container.healthStatus}
                        </div>
                      )}
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {/* Container ID */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Container ID</div>
                            <div className="text-sm font-mono text-foreground">{container.containerId.substring(0, 12)}</div>
                          </div>

                          {/* Uptime */}
                          {container.uptime !== null && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                              <div className="text-sm font-medium text-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatUptime(container.uptime)}
                              </div>
                            </div>
                          )}

                          {/* Restart Count */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Restarts</div>
                            <div className="text-sm font-medium text-foreground flex items-center gap-1">
                              <RotateCw className="w-3 h-3" />
                              {container.restartCount}
                            </div>
                          </div>

                          {/* Exit Code */}
                          {container.exitCode !== null && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Exit Code</div>
                              <div className="text-sm font-medium text-foreground">{container.exitCode}</div>
                            </div>
                          )}
                        </div>

                        {/* Resource Usage */}
                        {(container.cpuUsagePercent !== null || container.memoryUsedMB !== null) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {container.cpuUsagePercent !== null && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <Cpu className="w-3 h-3" />
                                  CPU Usage
                                </div>
                                <div className="text-sm font-medium text-foreground">{container.cpuUsagePercent.toFixed(1)}%</div>
                              </div>
                            )}

                            {container.memoryUsedMB !== null && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <MemoryStick className="w-3 h-3" />
                                  Memory
                                </div>
                                <div className="text-sm font-medium text-foreground">
                                  {formatBytes(container.memoryUsedMB)}
                                  {container.memoryLimitMB && ` / ${formatBytes(container.memoryLimitMB)}`}
                                </div>
                              </div>
                            )}

                            {container.networkRxMB !== null && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Network RX
                                </div>
                                <div className="text-sm font-medium text-foreground">{formatBytes(container.networkRxMB)}</div>
                              </div>
                            )}

                            {container.networkTxMB !== null && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Network TX
                                </div>
                                <div className="text-sm font-medium text-foreground">{formatBytes(container.networkTxMB)}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Issues */}
                        {container.issues && container.issues.length > 0 && (
                          <div className="space-y-2">
                            {container.issues.map((issue, index) => (
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

                        {/* Last Checked */}
                        <div className="mt-3 text-xs text-muted-foreground">
                          Last checked: {new Date(container.checkedAt).toLocaleString()}
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
            <p className="text-muted-foreground">Loading container health...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Container className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No container health data available</p>
            <p className="text-sm text-muted-foreground/70">Click "Refresh" to fetch latest container status</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
