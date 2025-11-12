

'use client';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/Card';
import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Sparkles, RefreshCw } from 'lucide-react';
import showToast from '@/lib/toast';

export default function Page() {



  // History of all generated insights
  const [insightsHistory, setInsightsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial insights (history)
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights/ai');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch insights');
      // Only add to history if insights are present
      if (data.insights && data.insights.length > 0) {
        setInsightsHistory([{ date: new Date().toISOString(), insights: data.insights }]);
      } else {
        setInsightsHistory([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Generate new report and append to history
  const handleGenerateReport = async () => {
    showToast.info('Generating new AI report...');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights/ai', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');
      // Only add to history if insights are present
      if (data.insights && data.insights.length > 0) {
        setInsightsHistory(prev => [
          { date: new Date().toISOString(), insights: data.insights },
          ...prev
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 gradient-ai rounded-lg glow-ai">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">AI Insights</h1>
            </div>
            <p className="text-muted-foreground">
              Intelligent analysis and recommendations for your monitored sites
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 gradient-ai text-white rounded-lg font-medium hover:opacity-90 transition-all glow-ai inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Generate New Report
          </button>
        </div>

        {/* Overview Stats (use latest insights) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(() => {
            const latest = insightsHistory.length > 0 ? insightsHistory[0].insights : [];
            return <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glow-primary">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Insights</p>
                      <p className="text-4xl font-bold gradient-text">{latest.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">Generated this month</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="glow-primary">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Avg Confidence</p>
                      <p className="text-4xl font-bold gradient-text">
                        {latest.length > 0
                          ? (latest.reduce((acc, i) => acc + (i.confidenceScore || 0), 0) / latest.length * 100).toFixed(0)
                          : '0'}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">AI accuracy score</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Recommendations</p>
                      <p className="text-4xl font-bold text-foreground">
                        {latest.filter(i => i.category === 'recommendation').length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Action items available</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>;
          })()}
        </div>


        {/* AI Insights History */}
        <div className="space-y-10">
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Card><CardContent className="py-16 text-center">Loading AI insights...</CardContent></Card>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Card><CardContent className="py-16 text-center text-red-500">{error}</CardContent></Card>
            </motion.div>
          )}
          {!loading && !error && insightsHistory.length > 0 && insightsHistory.map((entry, entryIdx) => (
            <>
              {entry.insights.length > 0 && (
                <div key={entry.date}>
                  <div className="mb-4">
                    <span className="text-lg font-semibold gradient-text">Report generated {formatRelativeTime(entry.date)}</span>
                  </div>
                  <div className="space-y-6">
                    {entry.insights.map((insight, index) => {
                      const Icon = LucideIcons[insight.icon] || Sparkles;
                      const typeStyles = {
                        performance: {
                          gradient: 'gradient-info',
                          glow: 'glow-info',
                          barColor: 'from-blue-500 to-cyan-500',
                          badgeBg: 'bg-blue-500/10',
                          badgeText: 'text-blue-500'
                        },
                        alert: {
                          gradient: 'gradient-danger',
                          glow: 'glow-danger',
                          barColor: 'from-red-500 to-orange-500',
                          badgeBg: 'bg-red-500/10',
                          badgeText: 'text-red-500'
                        },
                        pattern: {
                          gradient: 'gradient-ai',
                          glow: 'glow-ai',
                          barColor: 'from-purple-500 to-pink-500',
                          badgeBg: 'bg-purple-500/10',
                          badgeText: 'text-purple-500'
                        },
                        recommendation: {
                          gradient: 'gradient-success',
                          glow: 'glow-success',
                          barColor: 'from-green-500 to-emerald-500',
                          badgeBg: 'bg-green-500/10',
                          badgeText: 'text-green-500'
                        },
                      };
                      const styles = typeStyles[insight.category] || typeStyles.performance;
                      return (
                        <motion.div
                          key={insight.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Card hover>
                            <CardHeader>
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg ${styles.gradient} ${styles.glow} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <CardTitle>{insight.title}</CardTitle>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${styles.badgeBg} ${styles.badgeText} capitalize whitespace-nowrap`}>
                                      {insight.category}
                                    </span>
                                  </div>
                                  <CardDescription>{formatRelativeTime(insight.generatedAt)}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-foreground mb-4 leading-relaxed">{insight.summary}</p>
                              {/* Confidence Indicator */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">AI Confidence</span>
                                  <span className="font-semibold text-foreground">
                                    {(insight.confidenceScore * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insight.confidenceScore * 100}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                    className={`h-full bg-gradient-to-r ${styles.barColor}`}
                                  />
                                </div>
                              </div>
                              {/* Action Button */}
                              {insight.category === 'recommendation' && (
                                <div className="mt-4 pt-4 border-t border-border">
                                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                    View Recommendation Details
                                  </button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ))}
          {!loading && !error && insightsHistory.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No insights yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Our AI is analyzing your sites. Check back soon for intelligent insights.
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate AI Report
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </MainContent>
    </div>
  );
}
