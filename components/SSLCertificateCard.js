'use client';

import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SSLCertificateCard({ site, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [sslInfo, setSSLInfo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleCheckSSL = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${site.id}/ssl/check`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        if (!data.isHttps) {
          toast.error('This site does not use HTTPS');
        } else {
          setSSLInfo(data.sslInfo);
          toast.success('SSL certificate checked successfully');
          if (onRefresh) onRefresh();
        }
      } else {
        toast.error(data.error || 'Failed to check SSL certificate');
      }
    } catch (error) {
      console.error('Error checking SSL:', error);
      toast.error('Failed to check SSL certificate');
    } finally {
      setLoading(false);
    }
  };

  const getSSLStatusColor = (daysRemaining) => {
    if (!daysRemaining && daysRemaining !== 0) return 'text-gray-500';
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining < 7) return 'text-red-500';
    if (daysRemaining < 14) return 'text-orange-500';
    if (daysRemaining < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSSLBadgeColor = (daysRemaining) => {
    if (!daysRemaining && daysRemaining !== 0) return 'bg-gray-100 text-gray-700';
    if (daysRemaining < 0) return 'bg-red-100 text-red-700';
    if (daysRemaining < 7) return 'bg-red-100 text-red-700';
    if (daysRemaining < 14) return 'bg-orange-100 text-orange-700';
    if (daysRemaining < 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getSSLIcon = (daysRemaining) => {
    if (!daysRemaining && daysRemaining !== 0) return Shield;
    if (daysRemaining < 0 || daysRemaining < 7) return ShieldAlert;
    if (daysRemaining < 30) return ShieldAlert;
    return ShieldCheck;
  };

  const displayInfo = sslInfo || {
    valid: site.sslCertificateValid,
    daysRemaining: site.sslDaysRemaining,
    issuer: site.sslIssuer,
    validTo: site.sslExpiryDate,
    validFrom: site.sslValidFrom,
  };

  const SSLIcon = getSSLIcon(displayInfo.daysRemaining);
  const statusColor = getSSLStatusColor(displayInfo.daysRemaining);
  const badgeColor = getSSLBadgeColor(displayInfo.daysRemaining);

  if (!site.sslMonitoringEnabled && !site.url?.startsWith('https://')) {
    return null; // Don't show SSL card for non-HTTPS sites
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <SSLIcon className={`w-6 h-6 ${statusColor}`} />
          <h3 className="text-lg font-semibold text-gray-900">SSL Certificate</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCheckSSL}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Check SSL Certificate"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="SSL Settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {site.sslMonitoringEnabled ? (
        <>
          {displayInfo.valid ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                  {displayInfo.daysRemaining < 0
                    ? 'Expired'
                    : displayInfo.daysRemaining < 7
                    ? 'Expires Soon'
                    : displayInfo.daysRemaining < 30
                    ? 'Attention Needed'
                    : 'Valid'}
                </span>
              </div>

              {displayInfo.daysRemaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span className={`text-sm font-semibold ${statusColor}`}>
                    {displayInfo.daysRemaining < 0
                      ? `Expired ${Math.abs(displayInfo.daysRemaining)} days ago`
                      : `${displayInfo.daysRemaining} days`}
                  </span>
                </div>
              )}

              {displayInfo.validTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expiry Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(displayInfo.validTo).toLocaleDateString()}
                  </span>
                </div>
              )}

              {displayInfo.issuer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Issuer</span>
                  <span className="text-sm font-medium text-gray-900">{displayInfo.issuer}</span>
                </div>
              )}

              {site.sslLastChecked && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Last Checked</span>
                  <span className="text-xs text-gray-500">
                    {new Date(site.sslLastChecked).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Invalid or no SSL certificate found</p>
              <button
                onClick={handleCheckSSL}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check SSL'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">SSL monitoring is disabled</p>
        </div>
      )}

      {showSettings && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">SSL Monitoring</span>
              <span className={`px-2 py-1 rounded text-xs ${site.sslMonitoringEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {site.sslMonitoringEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {site.sslMonitoringEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Alert Threshold</span>
                <span className="text-sm text-gray-600">{site.sslAlertThreshold || 30} days</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              SSL certificates are checked daily. You'll be notified when the certificate is about to expire.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
