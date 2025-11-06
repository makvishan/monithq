'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Clock, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CronManagementPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const runCronJob = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/cron/monitor', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run cron job');
      }

      setLastResult(data);
      
      // Add to history
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        success: data.success,
        checked: data.checked,
        results: data.results,
      };
      
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OFFLINE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DEGRADED':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-500';
      case 'OFFLINE':
        return 'text-red-500';
      case 'DEGRADED':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <MainContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Cron Job Management</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manually trigger scheduled site health checks
              </p>
            </div>
            
            <button
              onClick={runCronJob}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Now
                </>
              )}
            </button>
          </div>

          {/* Cron Job Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Site Health Check Job</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Schedule</p>
                  <p className="text-lg font-semibold">Every 5 minutes</p>
                  <p className="text-xs text-muted-foreground mt-1">*/5 * * * *</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Endpoint</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    /api/cron/monitor
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Environment</p>
                  <p className="text-lg font-semibold">
                    {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Last Result */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Latest Execution Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        {lastResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          {lastResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {lastResult.checked} sites checked
                      </span>
                    </div>

                    {/* Results Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Site</th>
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Latency</th>
                            <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastResult.results?.map((result, index) => (
                            <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <span className="font-medium">{result.site}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(result.status)}
                                  <span className={getStatusColor(result.status)}>
                                    {result.status || 'ERROR'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {result.latency !== undefined ? (
                                  <span className="text-sm">{result.latency}ms</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {result.error ? (
                                  <span className="text-sm text-red-500">{result.error}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Execution History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {entry.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            Checked {entry.checked} sites
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.results?.map((r, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" 
                            style={{ 
                              backgroundColor: r.status === 'ONLINE' ? 'rgb(34, 197, 94)' : 
                                             r.status === 'OFFLINE' ? 'rgb(239, 68, 68)' : 
                                             'rgb(234, 179, 8)' 
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Getting Started */}
          {!lastResult && !error && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Click "Run Now" to manually trigger the cron job and see the results.
                      The job runs automatically every 5 minutes in production.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainContent>
    </div>
  );
}
