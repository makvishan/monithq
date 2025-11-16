'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { INCIDENT_SEVERITY, INCIDENT_SEVERITY_BG_CLASSES, INCIDENT_SEVERITY_DISPLAY_NAMES } from '@/lib/constants';

export default function PublicStatusPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatusPage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatusPage, 30000);
    return () => clearInterval(interval);
  }, [params.slug]);

  const fetchStatusPage = async () => {
    try {
      const response = await fetch(`/api/status/${params.slug}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to load status page');
      }
    } catch (err) {
      setError('Failed to load status page');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const configs = {
      operational: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'All Systems Operational',
      },
      degraded_performance: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'Degraded Performance',
      },
      partial_outage: {
        icon: AlertCircle,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'Partial Outage',
      },
      major_outage: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'Major Outage',
      },
    };
    return configs[status] || configs.operational;
  };

  const getSiteStatusInfo = (status) => {
    const configs = {
      ONLINE: {
        icon: CheckCircle,
        color: 'text-green-600',
        text: 'Operational',
      },
      DEGRADED: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        text: 'Degraded',
      },
      OFFLINE: {
        icon: XCircle,
        color: 'text-red-600',
        text: 'Offline',
      },
      MAINTENANCE: {
        icon: AlertCircle,
        color: 'text-blue-600',
        text: 'Maintenance',
      },
    };
    return configs[status] || configs.ONLINE;
  };

  const getIncidentStatusColor = (status) => {
    const colors = {
      INVESTIGATING: 'bg-orange-100 text-orange-700',
      IDENTIFIED: 'bg-yellow-100 text-yellow-700',
      MONITORING: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.floor((end - start) / 1000 / 60); // minutes
    
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return `${Math.floor(diff / 1440)}d ${Math.floor((diff % 1440) / 60)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Page Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(data.overallStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {data.statusPage.logoUrl && (
            <img
              src={data.statusPage.logoUrl}
              alt="Logo"
              className="h-16 mx-auto mb-6"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {data.statusPage.title}
          </h1>
          {data.statusPage.description && (
            <p className="text-lg text-gray-600">
              {data.statusPage.description}
            </p>
          )}
        </div>

        {/* Overall Status */}
        <div className={`${statusInfo.bg} ${statusInfo.border} border-2 rounded-2xl p-8 mb-8`}>
          <div className="flex items-center justify-center gap-4">
            <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
            <h2 className={`text-2xl font-bold ${statusInfo.color}`}>
              {statusInfo.text}
            </h2>
          </div>
          {data.statusPage.showUptime && (
            <div className="text-center mt-4">
              <div className="text-3xl font-bold text-gray-900">
                {data.avgUptime.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Average Uptime</div>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Services
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {data.sites.map((site) => {
              const siteStatus = getSiteStatusInfo(site.status);
              const SiteIcon = siteStatus.icon;
              
              return (
                <div key={site.id} className="px-8 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{site.name}</h4>
                        {site.region && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {site.region}
                          </span>
                        )}
                      </div>
                      {data.statusPage.showUptime && (
                        <div className="text-sm text-gray-600">
                          Uptime: {site.uptime.toFixed(2)}% • 
                          Latency: {site.averageLatency}ms •
                          Last checked: {site.lastCheckedAt ? formatDate(site.lastCheckedAt) : 'Never'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <SiteIcon className={`w-5 h-5 ${siteStatus.color}`} />
                      <span className={`font-medium ${siteStatus.color}`}>
                        {siteStatus.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incidents */}
        {data.statusPage.showIncidents && data.incidents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Incidents
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {data.incidents.map((incident) => (
                <div key={incident.id} className="px-8 py-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {incident.site.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getIncidentStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${INCIDENT_SEVERITY_BG_CLASSES[incident.severity] || INCIDENT_SEVERITY_BG_CLASSES[INCIDENT_SEVERITY.LOW]}`}>
                          {INCIDENT_SEVERITY_DISPLAY_NAMES[incident.severity] || incident.severity}
                        </span>
                      </div>
                      
                      {incident.aiSummary && (
                        <p className="text-sm text-gray-600 mb-2">
                          {incident.aiSummary}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Started: {formatDate(incident.startTime)}
                        {incident.endTime && (
                          <> • Resolved: {formatDate(incident.endTime)}</>
                        )}
                        {' • Duration: '}{formatDuration(incident.startTime, incident.endTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {formatDate(data.lastUpdated)}
          <div className="mt-2">
            Powered by <span className="font-semibold text-blue-600">MonitHQ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
