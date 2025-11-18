'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, MemoryStick, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export default function ServerMetricsCard({ siteId }) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/infrastructure/server?hours=24&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch server metrics');
      }
      const data = await response.json();
      setMetrics(data.metrics);
      setStatistics(data.statistics);
      setLatest(data.latest);
    } catch (err) {
      console.error('Error fetching server metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [siteId]);

  const getUsageColor = (percentage, threshold) => {
    if (percentage >= threshold) return 'text-red-500';
    if (percentage >= threshold * 0.8) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageBgColor = (percentage, threshold) => {
    if (percentage >= threshold) return 'bg-red-500';
    if (percentage >= threshold * 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatBytes = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const MetricCard = ({ icon: Icon, label, value, percentage, threshold, unit = '%' }) => {
    const colorClass = getUsageColor(percentage, threshold);
    const bgColorClass = getUsageBgColor(percentage, threshold);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border border-border bg-background/30"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colorClass}`} />
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          {percentage >= threshold && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>

        <div className="mb-2">
          <div className="text-3xl font-bold text-foreground mb-1">
            {percentage.toFixed(1)}{unit}
          </div>
          {value && (
            <div className="text-xs text-muted-foreground">{value}</div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${bgColorClass}`}
          />
        </div>

        {/* Threshold indicator */}
        <div className="mt-1 text-xs text-muted-foreground">
          Threshold: {threshold}%
        </div>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Server Metrics
          </CardTitle>
          <button
            onClick={fetchMetrics}
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

        {latest ? (
          <>
            {/* Health Status */}
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                latest.healthy
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {latest.healthy ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Server Healthy</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">{latest.issues?.length || 0} Issue(s) Detected</span>
                  </>
                )}
              </div>
            </div>

            {/* Issues */}
            {!latest.healthy && latest.issues && latest.issues.length > 0 && (
              <div className="mb-6 space-y-2">
                {latest.issues.map((issue, index) => (
                  <div key={index} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-red-500">{issue.type.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{issue.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Server Info */}
            {latest.hostname && (
              <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Hostname</div>
                    <div className="font-medium text-foreground">{latest.hostname}</div>
                  </div>
                  {latest.osType && (
                    <div>
                      <div className="text-muted-foreground mb-1">OS Type</div>
                      <div className="font-medium text-foreground">{latest.osType}</div>
                    </div>
                  )}
                  {latest.osVersion && (
                    <div>
                      <div className="text-muted-foreground mb-1">OS Version</div>
                      <div className="font-medium text-foreground">{latest.osVersion}</div>
                    </div>
                  )}
                  {latest.cpuCoreCount && (
                    <div>
                      <div className="text-muted-foreground mb-1">CPU Cores</div>
                      <div className="font-medium text-foreground">{latest.cpuCoreCount}</div>
                    </div>
                  )}
                  {latest.cpuLoadAverage !== null && (
                    <div>
                      <div className="text-muted-foreground mb-1">Load Average</div>
                      <div className="font-medium text-foreground">{latest.cpuLoadAverage.toFixed(2)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground mb-1">Last Check</div>
                    <div className="font-medium text-foreground">
                      {new Date(latest.checkedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricCard
                icon={Cpu}
                label="CPU Usage"
                percentage={latest.cpuUsagePercent}
                threshold={latest.cpuThreshold}
              />

              <MetricCard
                icon={MemoryStick}
                label="RAM Usage"
                value={`${formatBytes(latest.ramUsedMB)} / ${formatBytes(latest.ramTotalMB)}`}
                percentage={latest.ramUsagePercent}
                threshold={latest.ramThreshold}
              />

              <MetricCard
                icon={HardDrive}
                label="Disk Usage"
                value={`${latest.diskUsedGB.toFixed(2)} GB / ${latest.diskTotalGB.toFixed(2)} GB`}
                percentage={latest.diskUsagePercent}
                threshold={latest.diskThreshold}
              />
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-4">Last 24 Hours Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Avg CPU</div>
                    <div className="text-lg font-bold text-foreground">
                      {statistics.avgCpuUsage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Avg RAM</div>
                    <div className="text-lg font-bold text-foreground">
                      {statistics.avgRamUsage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Avg Disk</div>
                    <div className="text-lg font-bold text-foreground">
                      {statistics.avgDiskUsage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Peak CPU</div>
                    <div className="text-lg font-bold text-orange-500">
                      {statistics.maxCpuUsage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Peak RAM</div>
                    <div className="text-lg font-bold text-orange-500">
                      {statistics.maxRamUsage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Peak Disk</div>
                    <div className="text-lg font-bold text-orange-500">
                      {statistics.maxDiskUsage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading server metrics...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No server metrics available</p>
            <p className="text-sm text-muted-foreground/70">Click "Refresh" to fetch latest metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
