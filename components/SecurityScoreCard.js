"use client";

import { useState, useEffect } from "react";
import { SECURITY_GRADES, SECURITY_HEADERS } from '@/lib/constants';
import { RefreshCw } from 'lucide-react';

export default function SecurityScoreCard({ siteId, initialScore, initialGrade, lastChecked }) {
 
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(initialScore);
  const [grade, setGrade] = useState(initialGrade);
  const [lastCheck, setLastCheck] = useState(lastChecked);
  const [checkDetails, setCheckDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

     useEffect(() => {
      loadCheckHistory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId]);
  const runSecurityCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/security`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to run security check');
      }

      const data = await response.json();
      setScore(data.score);
      setGrade(data.grade);
      setLastCheck(new Date().toISOString());
      setCheckDetails(data.check);
    } catch (error) {
      console.error('Security check failed:', error);
      alert('Failed to run security check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckHistory = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/security`);
      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      if (data.history && data.history.length > 0) {
        const latest = data.history[0];
        setCheckDetails(latest);
        if (typeof latest.securityScore !== 'undefined') setScore(latest.securityScore);
        if (typeof latest.grade !== 'undefined') setGrade(latest.grade);
        if (latest.checkedAt) setLastCheck(latest.checkedAt);
      }
    } catch (error) {
      console.error('Failed to load check history:', error);
    }
  };

  const getGradeColor = (gradeLabel) => {
    for (const gradeInfo of Object.values(SECURITY_GRADES)) {
      if (gradeInfo.label === gradeLabel) {
        return gradeInfo.bgColor;
      }
    }
    return 'bg-gray-500/10 text-gray-500';
  };

  const getScoreRing = () => {
    const percentage = score || 0;
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;

    let strokeColor = '#ef4444'; // red
    if (percentage >= 85) strokeColor = '#22c55e'; // green
    else if (percentage >= 70) strokeColor = '#3b82f6'; // blue
    else if (percentage >= 50) strokeColor = '#eab308'; // yellow
    else if (percentage >= 30) strokeColor = '#f97316'; // orange

    return { offset, circumference, strokeColor };
  };

  const { offset, circumference, strokeColor } = getScoreRing();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Security Score</h3>
        <button
          onClick={runSecurityCheck}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Run Check'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        {/* Score Circle */}
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke={strokeColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{score || 0}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>

        {/* Grade Badge */}
        <div className="text-center">
          <div
            className={`inline-block px-6 py-3 rounded-lg ${getGradeColor(
              grade || 'F'
            )}`}
          >
            <div className="text-3xl font-bold">{grade || 'F'}</div>
          </div>
          <div className="mt-2 text-sm text-gray-400">Security Grade</div>
        </div>
      </div>

      {lastCheck && (
        <div className="text-sm text-gray-400 mb-4">
          Last checked: {new Date(lastCheck).toLocaleString()}
        </div>
      )}

      {/* Toggle Details */}
      {checkDetails && (
        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4">
              {/* Security Headers Status */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Security Headers
                </h4>
                <div className="space-y-2">
                  <HeaderStatus
                    name="HSTS"
                    enabled={checkDetails.hasHSTS}
                    details={
                      checkDetails.hstsMaxAge
                        ? `max-age=${checkDetails.hstsMaxAge}${
                            checkDetails.hstsIncludesSubdomains
                              ? ', includeSubDomains'
                              : ''
                          }`
                        : null
                    }
                  />
                  <HeaderStatus
                    name="Content-Security-Policy"
                    enabled={checkDetails.hasCSP}
                    details={
                      checkDetails.cspPolicy
                        ? checkDetails.cspPolicy.substring(0, 50) + '...'
                        : null
                    }
                  />
                  <HeaderStatus
                    name="X-Frame-Options"
                    enabled={checkDetails.hasXFrameOptions}
                    details={checkDetails.xFrameOptions}
                  />
                  <HeaderStatus
                    name="X-Content-Type-Options"
                    enabled={checkDetails.hasXContentType}
                    details="nosniff"
                  />
                  <HeaderStatus
                    name="X-XSS-Protection"
                    enabled={checkDetails.hasXXSSProtection}
                  />
                  <HeaderStatus
                    name="Referrer-Policy"
                    enabled={checkDetails.hasReferrerPolicy}
                    details={checkDetails.referrerPolicy}
                  />
                  <HeaderStatus
                    name="Permissions-Policy"
                    enabled={checkDetails.hasPermissionsPolicy}
                  />
                </div>
              </div>

              {/* Issues */}
              {checkDetails.issues && checkDetails.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">
                    Issues Found
                  </h4>
                  <ul className="space-y-1">
                    {checkDetails.issues.map((issue, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-400 flex items-start"
                      >
                        <span className="mr-2">⚠️</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {checkDetails.recommendations &&
                checkDetails.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {checkDetails.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="text-sm text-blue-400 flex items-start"
                        >
                          <span className="mr-2">💡</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {!checkDetails && !loading && (
        <button
          onClick={loadCheckHistory}
          className="text-sm text-gray-400 hover:text-gray-300"
        >
          Load check details
        </button>
      )}
    </div>
  );
}

function HeaderStatus({ name, enabled, details }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-700">
      <div className="flex items-center">
        <span className={`mr-2 ${enabled ? 'text-green-400' : 'text-red-400'}`}>
          {enabled ? '✓' : '✗'}
        </span>
        <span className="text-sm text-gray-300">{name}</span>
      </div>
      {details && enabled && (
        <span className="text-xs text-gray-500 max-w-xs truncate">{details}</span>
      )}
    </div>
  );
}
