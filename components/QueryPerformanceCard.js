'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, Zap, Clock, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export default function QueryPerformanceCard({ siteId }) {
  const [loading, setLoading] = useState(false);
  const [queries, setQueries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [slowestQueries, setSlowestQueries] = useState([]);
  const [error, setError] = useState(null);
  const [expandedQuery, setExpandedQuery] = useState(null);
  const [filter, setFilter] = useState('all'); // all, slow

  const fetchQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const slowOnly = filter === 'slow' ? 'true' : 'false';
      const response = await fetch(`/api/sites/${siteId}/infrastructure/queries?hours=24&limit=100&slowOnly=${slowOnly}`);
      if (!response.ok) {
        throw new Error('Failed to fetch query performance');
      }
      const data = await response.json();
      setQueries(data.queries);
      setStatistics(data.statistics);
      setSlowestQueries(data.slowestQueries);
    } catch (err) {
      console.error('Error fetching query performance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [siteId, filter]);

  const formatTime = (ms) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  const getDatabaseIcon = (type) => {
    // You could customize icons per database type
    return Database;
  };

  const getPerformanceColor = (executionTime, threshold) => {
    if (executionTime >= threshold) return 'text-red-500';
    if (executionTime >= threshold * 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Query Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-background/50 border border-border">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('slow')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  filter === 'slow'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Slow Only
              </button>
            </div>

            <button
              onClick={fetchQueries}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
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
              <div className="text-xs text-muted-foreground mb-1">Total Queries</div>
              <div className="text-2xl font-bold text-foreground">{statistics.totalQueries}</div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-muted-foreground mb-1">Unique Queries</div>
              <div className="text-2xl font-bold text-blue-500">{statistics.uniqueQueries}</div>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Slow Queries</div>
              <div className="text-2xl font-bold text-red-500">{statistics.slowQueries}</div>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Avg Execution</div>
              <div className="text-2xl font-bold text-green-500">{formatTime(statistics.avgExecutionTime)}</div>
            </div>
          </div>
        )}

        {/* Database Type Breakdown */}
        {statistics && Object.keys(statistics.byDatabaseType).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">By Database Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(statistics.byDatabaseType).map(([type, data]) => (
                <div key={type} className="p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground uppercase">{type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Queries</div>
                      <div className="font-medium text-foreground">{data.count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Time</div>
                      <div className="font-medium text-foreground">{formatTime(data.avgExecutionTime)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Slow</div>
                      <div className="font-medium text-red-500">{data.slowQueries}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slowest Queries */}
        {slowestQueries.length > 0 && filter === 'all' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Top 5 Slowest Queries</h3>
            <div className="space-y-2">
              {slowestQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-foreground uppercase">{query.databaseType}</span>
                      {query.queryType && (
                        <span className="text-xs px-2 py-0.5 rounded bg-background/50 text-muted-foreground">
                          {query.queryType}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-red-500">{formatTime(query.executionTimeMs)}</span>
                  </div>
                  {query.queryText && (
                    <div className="text-xs font-mono text-muted-foreground bg-background/50 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                      {query.queryText.substring(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query List */}
        {queries.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground mb-3">
              {filter === 'slow' ? 'Slow Queries' : 'Recent Queries'}
            </h3>
            {queries.map((query, index) => {
              const isExpanded = expandedQuery === query.id;
              const DbIcon = getDatabaseIcon(query.databaseType);
              const timeColor = getPerformanceColor(query.executionTimeMs, query.slowQueryThreshold);

              return (
                <motion.div
                  key={query.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                    query.isSlowQuery
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-background/30 border-border'
                  }`}
                  onClick={() => setExpandedQuery(isExpanded ? null : query.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <DbIcon className={`w-4 h-4 ${query.isSlowQuery ? 'text-red-500' : 'text-primary'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground uppercase">{query.databaseType}</span>
                          {query.queryType && (
                            <span className="text-xs px-2 py-0.5 rounded bg-background/50 text-muted-foreground">
                              {query.queryType}
                            </span>
                          )}
                          {query.isSlowQuery && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-medium">
                              SLOW
                            </span>
                          )}
                        </div>
                        {query.databaseName && (
                          <div className="text-xs text-muted-foreground">Database: {query.databaseName}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-sm font-bold ${timeColor}`}>
                          {formatTime(query.executionTimeMs)}
                        </div>
                        {query.rowsAffected && (
                          <div className="text-xs text-muted-foreground">{query.rowsAffected} rows</div>
                        )}
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
                        className="mt-3 pt-3 border-t border-border"
                      >
                        {/* Query Text */}
                        {query.queryText && (
                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">Query</div>
                            <div className="text-xs font-mono text-foreground bg-background/50 p-3 rounded overflow-x-auto">
                              {query.queryText}
                            </div>
                          </div>
                        )}

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Execution Time</div>
                            <div className={`text-sm font-medium ${timeColor}`}>{formatTime(query.executionTimeMs)}</div>
                          </div>

                          {query.rowsAffected !== null && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Rows Affected</div>
                              <div className="text-sm font-medium text-foreground">{query.rowsAffected}</div>
                            </div>
                          )}

                          {query.rowsExamined !== null && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Rows Examined</div>
                              <div className="text-sm font-medium text-foreground">{query.rowsExamined}</div>
                            </div>
                          )}

                          {query.useIndex !== null && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Uses Index</div>
                              <div className={`text-sm font-medium ${query.useIndex ? 'text-green-500' : 'text-red-500'}`}>
                                {query.useIndex ? 'Yes' : 'No'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Aggregated Stats */}
                        {(query.avgExecutionMs || query.p95ExecutionMs) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-2 rounded bg-background/50">
                            {query.avgExecutionMs && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Avg</div>
                                <div className="text-sm font-medium text-foreground">{formatTime(query.avgExecutionMs)}</div>
                              </div>
                            )}
                            {query.p95ExecutionMs && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">P95</div>
                                <div className="text-sm font-medium text-foreground">{formatTime(query.p95ExecutionMs)}</div>
                              </div>
                            )}
                            {query.p99ExecutionMs && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">P99</div>
                                <div className="text-sm font-medium text-foreground">{formatTime(query.p99ExecutionMs)}</div>
                              </div>
                            )}
                            {query.maxExecutionMs && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Max</div>
                                <div className="text-sm font-medium text-foreground">{formatTime(query.maxExecutionMs)}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Issues */}
                        {query.issues && query.issues.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {query.issues.map((issue, idx) => (
                              <div key={idx} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium text-red-500">{issue.type.toUpperCase()}</div>
                                    <div className="text-xs text-muted-foreground">{issue.message}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Optimization Tips */}
                        {query.optimizationTips && Array.isArray(query.optimizationTips) && query.optimizationTips.length > 0 && (
                          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 mb-3">
                            <div className="text-xs font-medium text-blue-500 mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Optimization Tips
                            </div>
                            <ul className="space-y-0.5 ml-4">
                              {query.optimizationTips.map((tip, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground list-disc">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="text-xs text-muted-foreground flex items-center gap-4">
                          <span>Query Hash: {query.queryHash.substring(0, 8)}</span>
                          {query.endpoint && <span>Endpoint: {query.endpoint}</span>}
                          <span>Checked: {new Date(query.checkedAt).toLocaleString()}</span>
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
            <p className="text-muted-foreground">Loading query performance...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No query performance data available</p>
            <p className="text-sm text-muted-foreground/70">Click "Refresh" to fetch latest query metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
