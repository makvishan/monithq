'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import SiteEditModal from '@/components/SiteEditModal';
import SSLCertificateCard from '@/components/SSLCertificateCard';
import SecurityScoreCard from '@/components/SecurityScoreCard';
import RegionMapCard from '@/components/RegionMapCard';
import DnsMonitorCard from '@/components/DnsMonitorCard';
import PerformanceMonitorCard from '@/components/PerformanceMonitorCard';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { INCIDENT_SEVERITY, INCIDENT_SEVERITY_BG_CLASSES, INCIDENT_STATUS } from '@/lib/constants';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Edit,
  Trash2,
  Power,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Settings,
  BarChart3,
  Shield,
  X
} from 'lucide-react';

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [site, setSite] = useState(null);
  const [checks, setChecks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [uptimeTrend, setUptimeTrend] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState({
    summary: true,
    trend: true,
    distributions: true,
    timeline: true,
    checks: true,
    incidents: true,
  });
  const [checking, setChecking] = useState(false);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, monitoring, analytics, history


  // Move all fetch* useCallback definitions above fetchAllData
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, summary: true }));
      const response = await fetch(`/api/sites/${params.id}/summary`);
      const data = await response.json();
      if (response.ok && data.site) {
        setSummary(data.site);
        setSite({ id: data.site.id, name: data.site.name, url: data.site.url, status: data.site.status });
      } else {
        showSnackbar(data.error || 'Failed to load site summary', 'error');
        if (response.status === 404) router.push('/sites');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      showSnackbar('Failed to load site summary', 'error');
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, [params.id, router, showSnackbar]);

  const fetchUptimeTrend = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, trend: true }));
      const response = await fetch(`/api/sites/${params.id}/uptime-trend?period=${timeRange}`);
      const data = await response.json();
      if (response.ok) {
        setUptimeTrend(data);
      } else {
        console.error('Failed to load uptime trend:', data.error);
      }
    } catch (error) {
      console.error('Error fetching uptime trend:', error);
    } finally {
      setLoading(prev => ({ ...prev, trend: false }));
    }
  }, [params.id, timeRange]);

  const fetchDistributions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, distributions: true }));
      const response = await fetch(`/api/sites/${params.id}/distributions?limit=50`);
      const data = await response.json();
      if (response.ok) {
        setDistributions(data);
      } else {
        console.error('Failed to load distributions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching distributions:', error);
    } finally {
      setLoading(prev => ({ ...prev, distributions: false }));
    }
  }, [params.id]);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, timeline: true }));
      const period = timeRange === '24h' ? '24h' : '7d';
      const response = await fetch(`/api/sites/${params.id}/timeline?period=${period}`);
      const data = await response.json();
      if (response.ok) {
        setTimeline(data);
      } else {
        console.error('Failed to load timeline:', data.error);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(prev => ({ ...prev, timeline: false }));
    }
  }, [params.id, timeRange]);

  const fetchChecks = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, checks: true }));
      const response = await fetch(`/api/sites/${params.id}/checks?limit=50`);
      const data = await response.json();
      if (response.ok) {
        setChecks(data.checks || []);
      } else {
        console.error('Failed to load checks:', data.error);
      }
    } catch (error) {
      console.error('Error fetching checks:', error);
    } finally {
      setLoading(prev => ({ ...prev, checks: false }));
    }
  }, [params.id]);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, incidents: true }));
      const response = await fetch(`/api/incidents?siteId=${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setIncidents(data.incidents || []);
      } else {
        console.error('Failed to load incidents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, [params.id]);

  const fetchAllData = useCallback(async () => {
    // Fetch all 6 APIs in parallel
    await Promise.all([
      fetchSummary(),
      fetchUptimeTrend(),
      fetchDistributions(),
      fetchTimeline(),
      fetchChecks(),
      fetchIncidents(),
    ]);
  }, [fetchSummary, fetchUptimeTrend, fetchDistributions, fetchTimeline, fetchChecks, fetchIncidents]);

  useEffect(() => {
    if (params.id) {
      fetchAllData();
    }
  }, [params.id, fetchAllData]);

  // Fetch data when time range changes (only affects trend and timeline)
  useEffect(() => {
    if (params.id && summary) {
      fetchUptimeTrend();
      fetchTimeline();
    }
  }, [timeRange, fetchTimeline, fetchUptimeTrend, params.id, summary]);


  const handleCheckNow = async () => {
    setChecking(true);
    
    try {
      const response = await fetch(`/api/sites/${params.id}/check`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh all data after manual check
        await fetchAllData();
        
        const statusEmoji = data.check.status === 'ONLINE' ? '✅' : 
                           data.check.status === 'DEGRADED' ? '⚠️' : '❌';
        
        showSnackbar(`${statusEmoji} ${data.check.status} (${data.check.latency}ms)`, 'success');
      } else {
        showSnackbar(data.error || 'Failed to check site', 'error');
      }
    } catch (err) {
      showSnackbar(err.message || 'Failed to check site', 'error');
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'OFFLINE':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DEGRADED':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'OFFLINE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'DEGRADED':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatTimestamp = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (loading.summary) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainContent>
      </div>
    );
  }

  if (!site || !summary) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Site not found</p>
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <MainContent>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/sites')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(site.status)}
                <h1 className="text-3xl font-bold text-foreground">{site.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(site.status)}`}>
                  {site.status}
                </span>
              </div>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                {site.url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCheckNow}
                disabled={checking}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Check Now
                  </>
                )}
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all inline-flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-border">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'monitoring', label: 'Advanced Monitoring', icon: Shield },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'history', label: 'History & Incidents', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glow-success h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Current Uptime</p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold gradient-text mb-1">
                  {summary?.uptime?.toFixed(2) || '0.00'}%
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="h-full  glow-info">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-1">
                  {summary.lastCheck?.responseTime || 0}ms
                </p>
                <p className="text-xs text-muted-foreground">Last check</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="h-full  glow-warning">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Last Checked</p>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatTimestamp(summary.lastCheck?.checkedAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {summary.lastCheck?.status || 'Unknown'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="h-full  glow-ai">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Total Checks</p>
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-1">{summary?.totalChecks || 0}</p>
                <p className="text-xs text-muted-foreground">Active incidents: {summary?.activeIncidents || 0}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Health Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Quick Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Main Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    summary?.lastCheck?.status === 'up'
                      ? 'bg-green-100 text-green-600'
                      : summary?.lastCheck?.status === 'down'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {summary?.lastCheck?.status === 'up' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : summary?.lastCheck?.status === 'down' ? (
                      <XCircle className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Site Status</p>
                    <p className="font-semibold text-sm capitalize">
                      {summary?.lastCheck?.status || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* SSL Status */}
                {site?.url?.startsWith('https://') && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      summary?.sslCert?.daysRemaining > 30
                        ? 'bg-green-100 text-green-600'
                        : summary?.sslCert?.daysRemaining > 7
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      🔒
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SSL Certificate</p>
                      <p className="font-semibold text-sm">
                        {summary?.sslCert?.daysRemaining
                          ? `${summary.sslCert.daysRemaining} days left`
                          : 'Valid'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Response Performance */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    (summary?.lastCheck?.responseTime || 0) < 500
                      ? 'bg-green-100 text-green-600'
                      : (summary?.lastCheck?.responseTime || 0) < 1000
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    ⚡
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Performance</p>
                    <p className="font-semibold text-sm">
                      {(summary?.lastCheck?.responseTime || 0) < 500
                        ? 'Excellent'
                        : (summary?.lastCheck?.responseTime || 0) < 1000
                        ? 'Good'
                        : 'Needs Attention'
                      }
                    </p>
                  </div>
                </div>

                {/* Incident Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    (summary?.activeIncidents || 0) === 0
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {(summary?.activeIncidents || 0) === 0 ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Incidents</p>
                    <p className="font-semibold text-sm">
                      {(summary?.activeIncidents || 0) === 0
                        ? 'No Active Issues'
                        : `${summary.activeIncidents} Active`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity (Last 10 Checks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checks && checks.length > 0 ? (
                <div className="space-y-2">
                  {checks.slice(0, 10).map((check, index) => (
                    <div
                      key={check.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        check.status === 'up'
                          ? 'bg-green-500'
                          : check.status === 'down'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium capitalize">{check.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(check.checkedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Response: <span className="font-medium">{check.responseTime}ms</span>
                          </span>
                          {check.statusCode && (
                            <span className="text-xs text-muted-foreground">
                              Status: <span className="font-medium">{check.statusCode}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent checks available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Incidents Widget */}
        {incidents && incidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Recent Incidents
                  </CardTitle>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-sm text-primary hover:underline"
                  >
                    View All
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidents.slice(0, 5).map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              INCIDENT_SEVERITY_BG_CLASSES[incident.severity] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {incident.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              incident.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : incident.status === 'acknowledged'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {incident.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {incident.title || 'Site Down'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Started: {new Date(incident.startedAt).toLocaleString()}</span>
                        {incident.resolvedAt && (
                          <span>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Insights Widget */}
        {summary?.latestAIInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="mb-8"
          >
            <Card className="glow-ai">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  Latest AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {summary.latestAIInsight.content || summary.latestAIInsight}
                  </p>
                  {summary.latestAIInsight.createdAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Generated: {new Date(summary.latestAIInsight.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
          </>
        )}

        {/* Advanced Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <>
            {/* SSL Certificate Card & Security Score */}
            {site && site.url && site.url.startsWith('https://') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <SSLCertificateCard
                site={{
                  ...site,
                  ...summary
                }}
                onRefresh={fetchAllData}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <SecurityScoreCard
                siteId={site.id}
                initialScore={summary?.securityScore}
                initialGrade={summary?.securityGrade}
                lastChecked={summary?.lastSecurityCheck}
              />
            </motion.div>
          </div>
        )}

        {/* Security Score for non-HTTPS sites */}
        {site && site.url && !site.url.startsWith('https://') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mb-8"
          >
            <SecurityScoreCard
              siteId={site.id}
              initialScore={summary?.securityScore}
              initialGrade={summary?.securityGrade}
              lastChecked={summary?.lastSecurityCheck}
            />
          </motion.div>
        )}

        {/* Multi-Region Monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mb-8"
        >
          <RegionMapCard siteId={site?.id} />
        </motion.div>

        {/* DNS Monitoring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55 }}
          className="mb-8"
        >
          <DnsMonitorCard siteId={site?.id} />
        </motion.div>

            {/* Performance Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <PerformanceMonitorCard siteId={site?.id} />
            </motion.div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {/* Uptime Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Uptime Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.trend ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : uptimeTrend ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Period ({timeRange})</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground">
                        {uptimeTrend?.stats?.periodUptime?.toFixed(2) || '0.00'}%
                      </p>
                      <span className="text-xs text-muted-foreground">uptime</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg latency: {uptimeTrend?.stats?.avgResponseTime || 0}ms
                    </p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${uptimeTrend?.stats?.periodUptime || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Checks</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground">{uptimeTrend?.stats?.totalChecks || 0}</p>
                      <span className="text-xs text-muted-foreground">checks</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      In selected period
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Overall Status</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground">
                        {summary?.uptime?.toFixed(2) || '0.00'}%
                      </p>
                      <span className="text-xs text-muted-foreground">all time</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total checks: {summary?.totalChecks || 0}
                    </p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${summary?.uptime || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-border p-1 bg-card">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Response Time Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mb-8"
        >
          <Card className=" glow-info">
            <CardHeader>
              <CardTitle>Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.trend ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-80">
                  {uptimeTrend && uptimeTrend.trendData && uptimeTrend.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={uptimeTrend.trendData.map((point) => ({
                          time: point.time, // Already formatted by API
                          latency: point.avgResponseTime,
                          uptime: parseFloat(point.uptime),
                          checks: point.checksCount,
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                        <XAxis 
                          dataKey="time" 
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          className="text-xs fill-muted-foreground"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          formatter={(value, name) => {
                            if (name === 'latency') return [`${value}ms`, 'Avg Response Time'];
                            if (name === 'uptime') return [`${value}%`, 'Uptime'];
                            if (name === 'checks') return [value, 'Checks'];
                            return [value, name];
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="latency" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fill="url(#colorLatency)"
                          dot={{ fill: '#3b82f6', r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution & Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card className="h-full glow-success">
              <CardHeader>
                <CardTitle>Status Distribution (Last 50 Checks)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading.distributions ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-64">
                    {distributions && distributions.statusDistribution && distributions.statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributions.statusDistribution.map(item => ({
                              name: item.name,
                              value: item.value,
                              fill: item.name === 'Online' ? '#22c55e' : 
                                    item.name === 'Degraded' ? '#eab308' : '#ef4444'
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Response Time Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Card className="h-full glow-warning">
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loading.distributions ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-64">
                    {distributions && distributions.responseTimeDistribution && distributions.responseTimeDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={distributions.responseTimeDistribution}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-20" />
                          <XAxis 
                            dataKey="name" 
                            className="text-xs fill-muted-foreground"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            className="text-xs fill-muted-foreground"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value, name) => {
                              if (name === 'value') return [value, 'Checks'];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {distributions.responseTimeDistribution.map((entry, index) => {
                              const colors = {
                                'Fast (< 100ms)': '#22c55e',
                                'Normal (100-300ms)': '#3b82f6',
                                'Slow (300-1000ms)': '#eab308',
                                'Very Slow (> 1000ms)': '#ef4444',
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#888'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

          

            {/* Status Timeline Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="mb-8"
            >
              <Card className=" glow-ai">
                <CardHeader>
                  <CardTitle>24-Hour Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {checks.slice(0, 96).reverse().map((check, i) => {
                        const bgColor = check.status === 'ONLINE' ? 'bg-green-500' : 
                                       check.status === 'DEGRADED' ? 'bg-yellow-500' : 
                                       'bg-red-500';
                        return (
                          <div
                            key={check.id}
                            className={`flex-1 h-12 ${bgColor} rounded-sm hover:opacity-80 transition-opacity cursor-pointer`}
                            title={`${check.status} - ${check.responseTime}ms at ${formatTimestamp(check.checkedAt)}`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>24 hours ago</span>
                      <span>Now</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

        {/* Recent Checks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="mb-8"
        >
          <Card className=" glow-info">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Checks</CardTitle>
                <button className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Response Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Timestamp</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {checks.slice(0, 20).map((check) => (
                      <tr key={check.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(check.status)}
                            <span className={`text-sm font-medium ${
                              check.status === 'ONLINE' ? 'text-green-500' :
                              check.status === 'DEGRADED' ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {check.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${
                            check.responseTime < 1000 ? 'text-green-500' :
                            check.responseTime < 3000 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {check.responseTime}ms
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {check.statusCode || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(check.checkedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-red-500">
                            {check.errorMessage || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {checks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No checks recorded yet. Click &quot;Check Now&quot; to perform the first check.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}

        {/* History & Incidents Tab */}
        {activeTab === 'history' && (
          <>
            {/* Recent Incidents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glow-danger">
                <CardHeader>
                  <CardTitle>Incidents History</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.slice(0, 10).map((incident) => (
                    <div key={incident.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${INCIDENT_SEVERITY_BG_CLASSES[incident.severity] || INCIDENT_SEVERITY_BG_CLASSES[INCIDENT_SEVERITY.LOW]}`}>
                            {incident.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            incident.status === INCIDENT_STATUS.RESOLVED ? 'bg-green-500/10 text-green-500' :
                            'bg-orange-500/10 text-orange-500'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(incident.startTime)}
                        </span>
                      </div>
                      {incident.aiSummary && (
                        <p className="text-sm text-muted-foreground mb-2">{incident.aiSummary}</p>
                      )}
                      {incident.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {formatDuration(incident.duration)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No incidents recorded. Your site is running smoothly! 🎉
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}
      </MainContent>

      {/* Edit Site Modal */}
      {site && (
        <SiteEditModal
          site={site}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedSite) => {
            setSite(updatedSite);
          }}
        />
      )}
    </div>
  );
}
