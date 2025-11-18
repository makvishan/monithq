'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { REGIONS, REGION_INFO, DEFAULT_REGIONS } from '@/lib/constants';
import WorldMap from './WorldMap';

export default function RegionMapCard({ siteId, initialResults = null }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(initialResults);
  const [statistics, setStatistics] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState(DEFAULT_REGIONS);
  const [expandedRegion, setExpandedRegion] = useState(null);

    useEffect(() => {
      runRegionalCheck();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId, selectedRegions]);
    
  // Run check
  const runRegionalCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regions: selectedRegions }),
      });

      if (!response.ok) {
        throw new Error('Failed to run regional check');
      }

      const data = await response.json();
      setResults(data.results);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Regional check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle region selection
  const toggleRegion = (region) => {
    if (selectedRegions.includes(region)) {
      if (selectedRegions.length > 1) {
        setSelectedRegions(selectedRegions.filter(r => r !== region));
      }
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (result) => {
    if (!result || !result.success) {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        label: 'Offline',
      };
    }

    if (result.status === 'ONLINE') {
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        label: 'Online',
      };
    }

    if (result.status === 'DEGRADED') {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        label: 'Degraded',
      };
    }

    return {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Offline',
    };
  };

  // Format response time
  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Multi-Region Performance
          </CardTitle>
          <button
            onClick={runRegionalCheck}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Run Check'}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Statistics Summary */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
              <div className="text-2xl font-bold text-foreground">
                {formatTime(statistics.averageResponseTime)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Fastest</div>
              <div className="text-2xl font-bold text-green-500">
                {statistics.fastestRegion ? (
                  <span className="flex items-center gap-1">
                    <span className="text-xl">{REGION_INFO[statistics.fastestRegion.region]?.flag}</span>
                    <span className="text-sm">{formatTime(statistics.fastestRegion.responseTime)}</span>
                  </span>
                ) : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Slowest</div>
              <div className="text-2xl font-bold text-orange-500">
                {statistics.slowestRegion ? (
                  <span className="flex items-center gap-1">
                    <span className="text-xl">{REGION_INFO[statistics.slowestRegion.region]?.flag}</span>
                    <span className="text-sm">{formatTime(statistics.slowestRegion.responseTime)}</span>
                  </span>
                ) : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Regions</div>
              <div className="text-2xl font-bold text-foreground">
                {statistics.successfulChecks}/{statistics.regionsChecked}
              </div>
            </div>
          </div>
        )}

        {/* World Map Visualization */}
        {/* {results && results.length > 0 && (
          <div className="mb-6">
            <WorldMap
              results={results}
              onRegionHover={(regionKey) => {
                // Optional: sync hover state with expanded region
                // setExpandedRegion(regionKey);
              }}
            />
          </div>
        )} */}

        {/* Region Selection */}
        <div className="mb-4">
          <div className="text-sm font-medium text-foreground mb-2">Select Regions to Monitor</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REGIONS).map(([key, value]) => {
              const regionInfo = REGION_INFO[value];
              const isSelected = selectedRegions.includes(value);

              return (
                <button
                  key={value}
                  onClick={() => toggleRegion(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background/50 border border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="mr-1">{regionInfo.flag}</span>
                  {regionInfo.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Regional Results */}
        {results && results.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground mb-3">Regional Check Results</div>
            {results.map((result) => {
              const regionInfo = REGION_INFO[result.region];
              const statusDisplay = getStatusDisplay(result);
              const StatusIcon = statusDisplay.icon;
              const isExpanded = expandedRegion === result.region;

              return (
                <motion.div
                  key={result.region}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-border bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedRegion(isExpanded ? null : result.region)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{regionInfo.flag}</span>
                      <div>
                        <div className="font-medium text-foreground">{regionInfo.name}</div>
                        <div className="text-xs text-muted-foreground">{regionInfo.location}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{formatTime(result.responseTime)}</div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusDisplay.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${statusDisplay.color}`} />
                        <span className={`text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && result.success && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3"
                      >
                        {result.dnsLookupTime && (
                          <div>
                            <div className="text-xs text-muted-foreground">DNS Lookup</div>
                            <div className="text-sm font-medium text-foreground">{formatTime(result.dnsLookupTime)}</div>
                          </div>
                        )}

                        {result.connectTime && (
                          <div>
                            <div className="text-xs text-muted-foreground">Connection</div>
                            <div className="text-sm font-medium text-foreground">{formatTime(result.connectTime)}</div>
                          </div>
                        )}

                        {result.tlsHandshakeTime && (
                          <div>
                            <div className="text-xs text-muted-foreground">TLS Handshake</div>
                            <div className="text-sm font-medium text-foreground">{formatTime(result.tlsHandshakeTime)}</div>
                          </div>
                        )}

                        {result.statusCode && (
                          <div>
                            <div className="text-xs text-muted-foreground">Status Code</div>
                            <div className="text-sm font-medium text-foreground">{result.statusCode}</div>
                          </div>
                        )}

                        {result.resolvedIp && (
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">Resolved IP</div>
                            <div className="text-sm font-medium text-foreground font-mono">{result.resolvedIp}</div>
                          </div>
                        )}

                        {result.errorMessage && (
                          <div className="col-span-2 md:col-span-4">
                            <div className="text-xs text-muted-foreground">Error</div>
                            <div className="text-sm text-red-500">{result.errorMessage}</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No regional checks yet</p>
            <p className="text-sm text-muted-foreground/70">Click "Run Check" to test your site from multiple regions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
