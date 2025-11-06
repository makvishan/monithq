'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { adminAPI } from '@/lib/api';
import { 
  Globe, 
  Search, 
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminMonitoringPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMonitoring();
  }, [statusFilter, regionFilter]);

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (regionFilter !== 'all') filters.region = regionFilter;
      const data = await adminAPI.getMonitoring(filters);
      setSites(data.sites || []);
    } catch (err) {
      setError(err.message || 'Failed to load monitoring data');
      console.error('Error fetching monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter((site) => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (site.organization?.name && site.organization.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const stats = {
    total: sites.length,
    online: sites.filter(s => s.status === 'ONLINE').length,
    degraded: sites.filter(s => s.status === 'DEGRADED').length,
    offline: sites.filter(s => s.status === 'OFFLINE').length,
    avgUptime: sites.length > 0 ? (sites.reduce((acc, s) => acc + (s.uptime || 0), 0) / sites.length).toFixed(2) : 0,
    avgLatency: sites.filter(s => s.averageLatency > 0).length > 0 
      ? Math.round(sites.filter(s => s.averageLatency > 0).reduce((acc, s) => acc + s.averageLatency, 0) / sites.filter(s => s.averageLatency > 0).length)
      : 0,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold gradient-text">System Monitoring</h1>
              <p className="text-muted-foreground">Monitor all sites across the platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">Live Monitoring</span>
              </div>
            </div>
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
            <button onClick={fetchMonitoring} className="ml-auto text-sm text-red-500 hover:underline">
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Sites</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  <Globe className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Online</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.online}</p>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Degraded</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.degraded}</p>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Offline</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.offline}</p>
                  <XCircle className="w-8 h-8 text-red-500" />
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
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg Uptime</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.avgUptime}%</p>
                  <Zap className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg Latency</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.avgLatency}ms</p>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by site name, URL, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>

              {/* Region Filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-[140px]"
              >
                <option value="all">All Regions</option>
                <option value="US-East">US-East</option>
                <option value="US-West">US-West</option>
                <option value="EU-West">EU-West</option>
                <option value="EU-Central">EU-Central</option>
                <option value="Asia">Asia</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Sites Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Site Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">URL</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Owner</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Uptime</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Latency</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Last Check</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSites.map((site) => (
                      <tr key={site.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              site.status === 'online' ? 'bg-green-500' :
                              site.status === 'degraded' ? 'bg-yellow-500' :
                              site.status === 'maintenance' ? 'bg-blue-500' :
                              'bg-red-500'
                            }`}></span>
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                              site.status === 'online' ? 'bg-green-500/10 text-green-500' :
                              site.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-500' :
                              site.status === 'maintenance' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {site.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{site.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {site.url}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{site.owner}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${
                            site.uptime >= 99 ? 'text-green-500' :
                            site.uptime >= 95 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {site.uptime}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${
                            site.latency === 0 ? 'text-red-500' :
                            site.latency < 200 ? 'text-green-500' :
                            site.latency < 400 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {site.latency > 0 ? `${site.latency}ms` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{site.region}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{site.lastCheck}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {site.issues > 0 ? (
                              <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors inline-flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5" />
                                {site.issues} Issue{site.issues > 1 ? 's' : ''}
                              </button>
                            ) : (
                              <button
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
