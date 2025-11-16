'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const GRADE_COLORS = {
  A: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  B: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  D: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  F: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const SEVERITY_COLORS = {
  high: 'text-red-600',
  medium: 'text-orange-600',
  low: 'text-yellow-600',
};

export default function PerformanceMonitorCard({ siteId, initialCheck = null }) {
  const [loading, setLoading] = useState(false);
  const [currentCheck, setCurrentCheck] = useState(initialCheck);
  const [checkHistory, setCheckHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [trend, setTrend] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch performance check history on mount
  useEffect(() => {
    if (siteId) {
      fetchPerformanceHistory();
    }
  }, [siteId]);

  const fetchPerformanceHistory = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/performance?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch performance history');

      const data = await response.json();
      if (data.success) {
        setCheckHistory(data.checks || []);
        if (data.latest) {
          setCurrentCheck(data.latest);
          setStatistics(data.statistics);
          setTrend(data.trend);
        }
      }
    } catch (error) {
      console.error('Failed to fetch performance history:', error);
    }
  };

  const runPerformanceCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Performance check failed');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentCheck(data.check);
        setStatistics(data.statistics);
        setTrend(data.trend);

        // Refresh history
        await fetchPerformanceHistory();
      }
    } catch (error) {
      console.error('Performance check failed:', error);
      alert('Performance check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (kbps) => {
    if (!kbps) return '0 KB/s';
    if (kbps > 1024) {
      return (kbps / 1024).toFixed(2) + ' MB/s';
    }
    return kbps.toFixed(2) + ' KB/s';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return '➖';
    if (trend === 'improving') return '📈';
    if (trend === 'degrading') return '📉';
    return '➖';
  };

  const gradeColors = currentCheck?.grade ? GRADE_COLORS[currentCheck.grade] : GRADE_COLORS.C;

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Monitoring</h3>
            <p className="text-sm text-gray-500 mt-1">
              Track page load performance and web vitals
            </p>
          </div>
          <button
            onClick={runPerformanceCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Checking...' : 'Run Performance Check'}
          </button>
        </div>

        {/* Current Check Summary */}
        {currentCheck && (
          <>
            {/* Performance Score & Grade */}
            <div className="flex items-center gap-6">
              <div className={`flex-shrink-0 w-32 h-32 rounded-full ${gradeColors.bg} ${gradeColors.border} border-4 flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${gradeColors.text}`}>
                    {currentCheck.grade || 'N/A'}
                  </div>
                  <div className={`text-sm font-medium ${gradeColors.text} mt-1`}>
                    {currentCheck.performanceScore || 0}/100
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 font-medium">TTFB</div>
                  <div className="text-xl font-bold text-purple-900 mt-1">
                    {currentCheck.ttfb}ms
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 font-medium">Total Time</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {currentCheck.totalTime}ms
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 font-medium">Size</div>
                  <div className="text-xl font-bold text-green-900 mt-1">
                    {formatBytes(currentCheck.responseSize)}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600 font-medium">Resources</div>
                  <div className="text-xl font-bold text-orange-900 mt-1">
                    {currentCheck.resourceCount || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Performance Trend</div>
                    <div className="text-xs text-gray-500 mt-1">Based on last 10 checks</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">{getTrendIcon(trend.trend)}</div>
                    <div className="text-sm font-medium text-gray-700 capitalize mt-1">
                      {trend.trend}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Issues */}
            {currentCheck.issues && currentCheck.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Performance Issues ({currentCheck.issues.length})</h4>
                <div className="space-y-2">
                  {currentCheck.issues.map((issue, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="text-lg">⚠️</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium uppercase ${SEVERITY_COLORS[issue.severity]}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{issue.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {currentCheck.recommendations && currentCheck.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Recommendations ({currentCheck.recommendations.length})</h4>
                <div className="space-y-2">
                  {currentCheck.recommendations.slice(0, 5).map((rec, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="text-lg">💡</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{rec.title}</div>
                          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics Toggle */}
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Detailed Metrics
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">DNS Lookup</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {currentCheck.dnsTime || 0}ms
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">TCP Connection</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {currentCheck.tcpTime || 0}ms
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">TLS Handshake</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {currentCheck.tlsTime || 0}ms
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Download Time</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {currentCheck.downloadTime || 0}ms
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Transfer Speed</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {formatSpeed(currentCheck.transferSpeed)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Compression</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {currentCheck.compression ? '✓ Yes' : '✗ No'}
                        </div>
                      </div>
                      {currentCheck.estimatedFCP && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Est. FCP</div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {currentCheck.estimatedFCP}ms
                          </div>
                        </div>
                      )}
                      {currentCheck.estimatedLCP && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Est. LCP</div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {currentCheck.estimatedLCP}ms
                          </div>
                        </div>
                      )}
                      {currentCheck.redirectCount > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Redirects</div>
                          <div className="text-lg font-semibold text-gray-900 mt-1">
                            {currentCheck.redirectCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Check History */}
            {checkHistory.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Check History ({checkHistory.length})
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {checkHistory.map((check) => (
                        <div
                          key={check.id}
                          className="bg-gray-50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-lg ${GRADE_COLORS[check.grade]?.text || 'text-gray-600'}`}>
                                {check.grade || 'N/A'}
                              </span>
                              <div>
                                <div className="text-gray-900 font-medium">
                                  Score: {check.performanceScore || 0}/100
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {new Date(check.checkedAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-700">TTFB: {check.ttfb}ms</div>
                              <div className="text-gray-500 text-xs">Total: {check.totalTime}ms</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!currentCheck && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Performance Checks Yet</h4>
            <p className="text-gray-500 mb-4">Run your first performance check to analyze page load speed</p>
            <button
              onClick={runPerformanceCheck}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Performance Check
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
