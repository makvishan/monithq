'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { sitesAPI, incidentsAPI } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const [sites, setSites] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sitesData, incidentsData] = await Promise.all([
        sitesAPI.getAll(),
        incidentsAPI.getAll(),
      ]);

      setSites(sitesData.sites || []);
      setIncidents(incidentsData.incidents || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate uptime trend (last 7 days)
  const getUptimeTrend = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayIncidents = incidents.filter(inc => {
        const incidentDate = new Date(inc.startTime);
        return incidentDate.toDateString() === date.toDateString();
      });

      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        uptime: sites.length > 0 ? ((sites.length - dayIncidents.length) / sites.length * 100).toFixed(1) : 100,
        incidents: dayIncidents.length,
      });
    }
    return days;
  };

  // Calculate incident frequency by severity
  const getIncidentsBySeverity = () => {
    const severity = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    incidents.forEach(inc => {
      severity[inc.severity]++;
    });

    return [
      { name: 'High', value: severity.HIGH, color: '#ef4444' },
      { name: 'Medium', value: severity.MEDIUM, color: '#f59e0b' },
      { name: 'Low', value: severity.LOW, color: '#3b82f6' },
    ];
  };

  // Calculate average response time
  const getResponseTimes = () => {
    return sites.map(site => ({
      name: site.name.length > 15 ? site.name.substring(0, 15) + '...' : site.name,
      latency: site.averageLatency || 0,
    })).sort((a, b) => b.latency - a.latency).slice(0, 10);
  };

  // Calculate incident resolution time
  const getResolutionTimes = () => {
    const resolved = incidents.filter(inc => inc.status === 'RESOLVED' && inc.duration);
    if (resolved.length === 0) return [];

    return resolved.slice(0, 10).map(inc => ({
      site: inc.site?.name?.substring(0, 15) || 'Unknown',
      minutes: Math.round(inc.duration / 60000),
    }));
  };

  const uptimeTrend = getUptimeTrend();
  const incidentsBySeverity = getIncidentsBySeverity();
  const responseTimes = getResponseTimes();
  const resolutionTimes = getResolutionTimes();

  // Stats
  const avgUptime = sites.length > 0 
    ? (sites.reduce((acc, site) => acc + (site.uptime || 0), 0) / sites.length).toFixed(2)
    : 0;
  const avgLatency = sites.length > 0
    ? Math.round(sites.reduce((acc, site) => acc + (site.averageLatency || 0), 0) / sites.length)
    : 0;
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED').length;
  const resolvedRate = totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights and performance metrics
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
            <button onClick={fetchData} className="ml-auto text-sm text-red-500 hover:underline">
              Retry
            </button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="gradient-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Uptime</p>
                        <p className="text-3xl font-bold text-green-500">{avgUptime}%</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="gradient-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Latency</p>
                        <p className="text-3xl font-bold text-blue-500">{avgLatency}ms</p>
                      </div>
                      <Activity className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="gradient-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Incidents</p>
                        <p className="text-3xl font-bold text-yellow-500">{totalIncidents}</p>
                      </div>
                      <AlertCircle className="w-12 h-12 text-yellow-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="gradient-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Resolution Rate</p>
                        <p className="text-3xl font-bold text-purple-500">{resolvedRate}%</p>
                      </div>
                      <Clock className="w-12 h-12 text-purple-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Uptime Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="gradient-border">
                  <CardHeader>
                    <CardTitle>Uptime Trend (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={uptimeTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="day" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Incidents by Severity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="gradient-border">
                  <CardHeader>
                    <CardTitle>Incidents by Severity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incidentsBySeverity}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incidentsBySeverity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Times */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="gradient-border">
                  <CardHeader>
                    <CardTitle>Average Response Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={responseTimes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="latency" fill="#3b82f6" name="Latency (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Resolution Times */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="gradient-border">
                  <CardHeader>
                    <CardTitle>Incident Resolution Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resolutionTimes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resolutionTimes}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="site" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="minutes" fill="#10b981" name="Minutes" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No resolved incidents yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </MainContent>
    </div>
  );
}
