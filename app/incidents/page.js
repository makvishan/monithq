'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { incidentsAPI } from '@/lib/api';
import { formatDateTime, formatDuration, getStatusBadge } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import showToast from '@/lib/toast';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = statusFilter !== 'all' ? { status: statusFilter.toUpperCase() } : {};
      const data = await incidentsAPI.getAll(filters);
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.message || 'Failed to load incidents');
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await incidentsAPI.resolve(id, 'Manually resolved by user');
      showToast.success('Incident resolved successfully');
      await fetchIncidents(); // Refresh the list
    } catch (err) {
      showToast.error(err.message || 'Failed to resolve incident');
    }
  };

  const activeIncidents = incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'IDENTIFIED');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <MainContent>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Incidents</h1>
          <p className="text-muted-foreground">Track and manage all incidents across your sites</p>
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
            <button onClick={fetchIncidents} className="ml-auto text-sm text-red-500 hover:underline">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glow-danger">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Active Incidents</p>
                        <p className="text-3xl font-bold text-red-500">{activeIncidents.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg gradient-danger glow-danger flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
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
                        <p className="text-sm text-muted-foreground mb-1">Resolved Today</p>
                        <p className="text-3xl font-bold text-green-500">
                          {resolvedIncidents.filter(i => {
                            const today = new Date().setHours(0, 0, 0, 0);
                            const endTime = i.endTime ? new Date(i.endTime) : new Date();
                            return endTime.setHours(0, 0, 0, 0) === today;
                          }).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg gradient-success glow-success flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
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
                <Card className="glow-info">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Incidents</p>
                        <p className="text-3xl font-bold text-blue-500">{incidents.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg gradient-info glow-info flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Active Incidents */}
            {activeIncidents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">Active Incidents</h2>
                <div className="space-y-4">
                  {activeIncidents.map((incident, index) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="border-red-500/50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-2 h-2 rounded-full mt-2 ${getStatusBadge('offline')} animate-pulse`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground text-lg">{incident.site?.name || 'Unknown Site'}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Started: {formatDateTime(incident.startTime)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="px-3 py-1 rounded text-sm font-medium capitalize bg-yellow-500/10 text-yellow-500">
                                    {incident.status.toLowerCase()}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    incident.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                    incident.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                  }`}>
                                    {incident.severity.toLowerCase()} severity
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Duration: {formatDuration(Date.now() - new Date(incident.startTime).getTime())}
                              </p>
                              <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg mb-3">
                                <p className="text-sm text-foreground">
                                  🤖 <span className="font-semibold">AI Analysis:</span> {incident.aiSummary || 'Analyzing incident...'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleResolve(incident.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                              >
                                Mark as Resolved
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Incident History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Incident History</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Site</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Started</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Duration</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Severity</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">AI Summary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {incidents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                              No incidents found.
                            </td>
                          </tr>
                        ) : (
                          incidents.map((incident, index) => (
                            <motion.tr
                              key={incident.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(incident.status === 'RESOLVED' ? 'online' : 'offline')}`}></span>
                                  <span className="font-medium text-foreground">{incident.site?.name || 'Unknown Site'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                  incident.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                                  'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                  {incident.status.toLowerCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground">
                                  {formatDateTime(incident.startTime)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-foreground font-medium">
                                  {incident.endTime ? formatDuration(new Date(incident.endTime) - new Date(incident.startTime)) : 'Ongoing'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                  incident.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                  incident.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' :
                                  'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                  {incident.severity.toLowerCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-md">
                                <p className="text-sm text-muted-foreground truncate">
                                  {incident.aiSummary || 'N/A'}
                                </p>
                              </td>
                            </motion.tr>
                          ))
                        )}
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
