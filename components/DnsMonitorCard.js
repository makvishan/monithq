'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const DNS_RECORD_TYPES = [
  { key: 'aRecords', label: 'A Records (IPv4)', icon: '🌐', color: 'text-blue-600' },
  { key: 'aaaaRecords', label: 'AAAA Records (IPv6)', icon: '🌍', color: 'text-purple-600' },
  { key: 'cnameRecords', label: 'CNAME Records', icon: '🔗', color: 'text-green-600' },
  { key: 'mxRecords', label: 'MX Records (Mail)', icon: '📧', color: 'text-orange-600' },
  { key: 'nsRecords', label: 'NS Records (Nameservers)', icon: '🖥️', color: 'text-cyan-600' },
  { key: 'txtRecords', label: 'TXT Records', icon: '📝', color: 'text-yellow-600' },
];

export default function DnsMonitorCard({ siteId, initialCheck = null }) {
  const [loading, setLoading] = useState(false);
  const [currentCheck, setCurrentCheck] = useState(initialCheck);
  const [checkHistory, setCheckHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [changeDetection, setChangeDetection] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRecords, setExpandedRecords] = useState({});

  // Fetch DNS check history on mount
  useEffect(() => {
    if (siteId) {
      fetchDnsHistory();
    }
  }, [siteId]);

  const fetchDnsHistory = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/dns?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch DNS history');

      const data = await response.json();
      if (data.success) {
        setCheckHistory(data.checks || []);
        if (data.latest) {
          setCurrentCheck(data.latest);
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch DNS history:', error);
    }
  };

  const runDnsCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/dns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('DNS check failed');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentCheck(data.check);
        setStatistics(data.statistics);
        setChangeDetection(data.changeDetection);

        // Refresh history
        await fetchDnsHistory();
      }
    } catch (error) {
      console.error('DNS check failed:', error);
      alert('DNS check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecordExpansion = (recordKey) => {
    setExpandedRecords((prev) => ({
      ...prev,
      [recordKey]: !prev[recordKey],
    }));
  };

  const formatRecordValue = (recordType, value) => {
    if (!value) return 'None';

    if (recordType === 'mxRecords') {
      // MX records are objects with priority and exchange
      if (Array.isArray(value) && value.length > 0) {
        return value.map((mx) => `${mx.priority} ${mx.exchange}`).join(', ');
      }
    } else if (recordType === 'soaRecord') {
      // SOA record is an object
      if (value && typeof value === 'object') {
        return `${value.mname} ${value.rname} (Serial: ${value.serial})`;
      }
    } else if (Array.isArray(value)) {
      // Other record types are arrays of strings
      return value.length > 0 ? value.join(', ') : 'None';
    }

    return JSON.stringify(value);
  };

  const getRecordCount = (recordType, check) => {
    const value = check?.[recordType];
    if (!value) return 0;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object') return 1;
    return 0;
  };

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">DNS Monitoring</h3>
            <p className="text-sm text-gray-500 mt-1">
              Track DNS records and detect changes
            </p>
          </div>
          <button
            onClick={runDnsCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Checking...' : 'Run DNS Check'}
          </button>
        </div>

        {/* Current Check Summary */}
        {currentCheck && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Resolution Time</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {currentCheck.resolutionTime}ms
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Total Records</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {statistics?.totalRecords || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">IPv6 Support</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {statistics?.hasIPv6 ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">Mail Servers</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {statistics?.hasMailServers ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}

        {/* Change Detection Alert */}
        {changeDetection?.hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-900">DNS Changes Detected</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {changeDetection.changes.length} DNS record type(s) changed since last check
                </p>
                <div className="mt-2 space-y-1">
                  {changeDetection.changes.map((change, idx) => (
                    <div key={idx} className="text-xs text-yellow-800">
                      <span className="font-medium">{change.type} Records:</span>{' '}
                      {Array.isArray(change.previous) ? change.previous.join(', ') : JSON.stringify(change.previous)}{' '}
                      → {Array.isArray(change.current) ? change.current.join(', ') : JSON.stringify(change.current)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* DNS Records */}
        {currentCheck && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">DNS Records</h4>
            <div className="space-y-2">
              {DNS_RECORD_TYPES.map((recordType) => {
                const count = getRecordCount(recordType.key, currentCheck);
                const isExpanded = expandedRecords[recordType.key];

                return (
                  <div key={recordType.key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleRecordExpansion(recordType.key)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{recordType.icon}</span>
                        <div className="text-left">
                          <div className={`font-medium ${recordType.color}`}>
                            {recordType.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {count} record{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-white border-t border-gray-200">
                            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                              {formatRecordValue(recordType.key, currentCheck[recordType.key])}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* SOA Record */}
              {currentCheck.soaRecord && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleRecordExpansion('soaRecord')}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚙️</span>
                      <div className="text-left">
                        <div className="font-medium text-indigo-600">SOA Record (Authority)</div>
                        <div className="text-xs text-gray-500">Zone authority information</div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedRecords.soaRecord ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {expandedRecords.soaRecord && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-white border-t border-gray-200">
                          <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                            {formatRecordValue('soaRecord', currentCheck.soaRecord)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}

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
                        <div className="flex items-center gap-2">
                          {check.changesDetected && (
                            <span className="text-yellow-600 font-medium">⚠️ Changed</span>
                          )}
                          <span className="text-gray-600">
                            {new Date(check.checkedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-500">{check.resolutionTime}ms</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!currentCheck && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No DNS Checks Yet</h4>
            <p className="text-gray-500 mb-4">Run your first DNS check to see DNS records</p>
            <button
              onClick={runDnsCheck}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run DNS Check
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
