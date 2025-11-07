'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import SiteStatusCard from '@/components/SiteStatusCard';
import ChartCard from '@/components/ChartCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { formatDuration, formatDateTime, getStatusBadge } from '@/lib/utils';
import { TrendingUp, Activity, Globe, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, sitesData, incidentsData, chartsData] = await Promise.all([
        fetch('/api/dashboard/stats?timeRange=24h', {
          credentials: 'include',
        }).then(res => res.json()),
        fetch('/api/dashboard/sites?limit=4', {
          credentials: 'include',
        }).then(res => res.json()),
        fetch('/api/dashboard/incidents?limit=5&status=INVESTIGATING', {
          credentials: 'include',
        }).then(res => res.json()),
        fetch('/api/dashboard/charts?days=7', {
          credentials: 'include',
        }).then(res => res.json()),
      ]);
      setStats(statsData.stats || {});
      setSites(sitesData.sites || []);
      setIncidents(incidentsData.incidents || []);
      setChartData(chartsData.chartData || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSites = stats?.totalSites || 0;
  const onlineSites = stats?.onlineSites || 0;
  const avgUptime = stats?.avgUptime || 0;
  const activeIncidents = stats?.activeIncidents || 0;
  const recentIncidents = incidents; // API already returns limited results

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your websites at a glance</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
            <button onClick={fetchDashboardData} className="ml-auto text-sm text-red-500 hover:underline">
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glow-info">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Sites</p>
                    <p className="text-3xl font-bold gradient-text">{totalSites}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg gradient-info glow-info flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="glow-success">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sites Online</p>
                    <p className="text-3xl font-bold text-green-500">{onlineSites}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg gradient-success glow-success flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="glow-success">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Uptime</p>
                    <p className="text-3xl font-bold text-green-500">{avgUptime}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg gradient-success glow-success flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="glow-danger">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Incidents</p>
                    <p className="text-3xl font-bold text-red-500">
                      {activeIncidents}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg gradient-danger glow-danger flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ChartCard
              title="Uptime Trend"
              description="Last 7 days"
              data={chartData}
              dataKey="uptime"
              type="area"
              color="#10b981"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ChartCard
              title="Response Time"
              description="Last 7 days (avg ms)"
              data={chartData}
              dataKey="responseTime"
              type="line"
              color="#6366f1"
            />
          </motion.div>
        </div>

        {/* Site Status Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text mb-4">Monitored Sites</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sites.map((site, index) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <SiteStatusCard site={site} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="gradient-border glow-ai">
            <CardHeader>
              <CardTitle className="gradient-text">Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start gap-4 p-4 rounded-lg border gradient-border hover:glass-gradient transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${getStatusBadge(incident.status === 'resolved' ? 'online' : 'offline')}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{incident.site?.name || 'Unknown Site'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(incident.startTime)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          incident.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Duration: {incident.endTime ? formatDuration(incident.duration) : 'Ongoing'}
                      </p>
                      <p className="text-sm text-foreground glass-gradient p-3 rounded border gradient-border">
                        🤖 AI Summary: {incident.aiSummary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}
      </MainContent>
    </div>
  );
}
