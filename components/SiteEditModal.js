'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Code, Globe, Activity, Eye, EyeOff } from 'lucide-react';
import showToast from '@/lib/toast';
import { SITE_TYPES, SITE_TYPE_DISPLAY_NAMES, HTTP_METHODS, AUTH_TYPES, AUTH_TYPE_DISPLAY_NAMES } from '@/lib/constants';

export default function SiteEditModal({ site, isOpen, onClose, onUpdate, mode = 'edit' }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    checkInterval: 300,
    region: 'US-EAST',
    sslMonitoringEnabled: true,
    sslAlertThreshold: 30,
    multiRegionMonitoringEnabled: true,
    dnsMonitoringEnabled: true,
    securityMonitoringEnabled: true,
    performanceMonitoringEnabled: true,
    // API Endpoint fields
    siteType: SITE_TYPES.WEB,
    httpMethod: HTTP_METHODS.GET,
    requestHeaders: {},
    requestBody: '',
    expectedStatus: [200],
    authType: AUTH_TYPES.NONE,
    authValue: '',
    responseValidation: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showAuthValue, setShowAuthValue] = useState(false);

  // Header management
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        url: site.url || '',
        checkInterval: site.checkInterval || 300,
        region: site.region || 'US-EAST',
        sslMonitoringEnabled: site.sslMonitoringEnabled ?? true,
        sslAlertThreshold: site.sslAlertThreshold || 30,
        multiRegionMonitoringEnabled: site.multiRegionMonitoringEnabled ?? true,
        dnsMonitoringEnabled: site.dnsMonitoringEnabled ?? true,
        securityMonitoringEnabled: site.securityMonitoringEnabled ?? true,
        performanceMonitoringEnabled: site.performanceMonitoringEnabled ?? true,
        siteType: site.siteType || SITE_TYPES.WEB,
        httpMethod: site.httpMethod || HTTP_METHODS.GET,
        requestHeaders: site.requestHeaders || {},
        requestBody: site.requestBody ? JSON.stringify(site.requestBody, null, 2) : '',
        expectedStatus: site.expectedStatus || [200],
        authType: site.authType || AUTH_TYPES.NONE,
        authValue: site.authValue || '',
        responseValidation: site.responseValidation,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: 300,
        region: 'US-EAST',
        sslMonitoringEnabled: true,
        sslAlertThreshold: 30,
        multiRegionMonitoringEnabled: true,
        dnsMonitoringEnabled: true,
        securityMonitoringEnabled: true,
        performanceMonitoringEnabled: true,
        siteType: SITE_TYPES.WEB,
        httpMethod: HTTP_METHODS.GET,
        requestHeaders: {},
        requestBody: '',
        expectedStatus: [200],
        authType: AUTH_TYPES.NONE,
        authValue: '',
        responseValidation: null,
      });
    }
  }, [site, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = { ...formData };

      // Parse request body if it's a string
      if (formData.siteType === SITE_TYPES.API && formData.requestBody) {
        try {
          submitData.requestBody = JSON.parse(formData.requestBody);
        } catch (err) {
          showToast.error('Invalid JSON in request body');
          setSubmitting(false);
          return;
        }
      } else {
        submitData.requestBody = null;
      }

      if (mode === 'edit' && site) {
        // Update existing site
        const response = await fetch(`/api/sites/${site.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        const data = await response.json();

        if (response.ok) {
          showToast.success('Site updated successfully');
          onUpdate(data.site);
          onClose();
        } else {
          showToast.error(data.error || 'Failed to update site');
        }
      } else {
        // Create new site
        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        const data = await response.json();

        if (response.ok) {
          showToast.success('Site added successfully');
          onUpdate(data.site);
          onClose();
        } else {
          showToast.error(data.error || 'Failed to add site');
        }
      }
    } catch (err) {
      showToast.error(err.message || `Failed to ${mode === 'edit' ? 'update' : 'add'} site`);
    } finally {
      setSubmitting(false);
    }
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        requestHeaders: {
          ...formData.requestHeaders,
          [headerKey]: headerValue,
        },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key) => {
    const headers = { ...formData.requestHeaders };
    delete headers[key];
    setFormData({ ...formData, requestHeaders: headers });
  };

  const addExpectedStatus = () => {
    const status = prompt('Enter expected status code (e.g., 200, 201):');
    if (status) {
      const statusCode = parseInt(status);
      if (!isNaN(statusCode) && !formData.expectedStatus.includes(statusCode)) {
        setFormData({
          ...formData,
          expectedStatus: [...formData.expectedStatus, statusCode],
        });
      }
    }
  };

  const removeExpectedStatus = (status) => {
    setFormData({
      ...formData,
      expectedStatus: formData.expectedStatus.filter(s => s !== status),
    });
  };

  if (!isOpen) return null;

  const isApiEndpoint = formData.siteType === SITE_TYPES.API;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'edit' ? 'Edit Site' : 'Add New Site'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Site Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Monitoring Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, siteType: SITE_TYPES.WEB })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.siteType === SITE_TYPES.WEB
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={submitting}
                >
                  <Globe className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm font-medium">Website</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Monitor HTTP/HTTPS websites
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, siteType: SITE_TYPES.API })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.siteType === SITE_TYPES.API
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={submitting}
                >
                  <Code className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm font-medium">API Endpoint</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Monitor REST API endpoints
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={isApiEndpoint ? 'User API' : 'My Website'}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL {isApiEndpoint && '/ Endpoint'}
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={isApiEndpoint ? 'https://api.example.com/v1/users' : 'https://example.com'}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Check Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.checkInterval}
                  onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="60"
                  max="3600"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Region
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={submitting}
                >
                  <option value="US-EAST">US East</option>
                  <option value="US-WEST">US West</option>
                  <option value="EU-WEST">EU West</option>
                  <option value="AP-SOUTH">Asia Pacific</option>
                </select>
              </div>
            </div>

            {/* API-Specific Configuration */}
            {isApiEndpoint && (
              <div className="space-y-6 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>

                {/* HTTP Method */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    HTTP Method
                  </label>
                  <select
                    value={formData.httpMethod}
                    onChange={(e) => setFormData({ ...formData, httpMethod: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  >
                    {Object.values(HTTP_METHODS).map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {/* Authentication */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Authentication
                  </label>
                  <select
                    value={formData.authType}
                    onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                    disabled={submitting}
                  >
                    {Object.entries(AUTH_TYPE_DISPLAY_NAMES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  {formData.authType !== AUTH_TYPES.NONE && (
                    <div className="relative">
                      <input
                        type={showAuthValue ? "text" : "password"}
                        value={formData.authValue}
                        onChange={(e) => setFormData({ ...formData, authValue: e.target.value })}
                        className="w-full px-4 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={
                          formData.authType === AUTH_TYPES.BEARER ? 'Bearer token' :
                          formData.authType === AUTH_TYPES.API_KEY ? 'API key' :
                          'username:password (base64)'
                        }
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthValue(!showAuthValue)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showAuthValue ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Request Headers */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Custom Headers
                  </label>
                  <div className="space-y-2 mb-3">
                    {Object.entries(formData.requestHeaders).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-background border border-border rounded-lg">
                        <code className="flex-1 text-sm">{key}: {value}</code>
                        <button
                          type="button"
                          onClick={() => removeHeader(key)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={submitting}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={headerKey}
                      onChange={(e) => setHeaderKey(e.target.value)}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Header name"
                      disabled={submitting}
                    />
                    <input
                      type="text"
                      value={headerValue}
                      onChange={(e) => setHeaderValue(e.target.value)}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Header value"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={addHeader}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      disabled={submitting}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Request Body */}
                {['POST', 'PUT', 'PATCH'].includes(formData.httpMethod) && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={formData.requestBody}
                      onChange={(e) => setFormData({ ...formData, requestBody: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      rows={6}
                      placeholder='{\n  "key": "value"\n}'
                      disabled={submitting}
                    />
                  </div>
                )}

                {/* Expected Status Codes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Status Codes
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.expectedStatus.map(status => (
                      <div key={status} className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                        <code className="text-sm">{status}</code>
                        <button
                          type="button"
                          onClick={() => removeExpectedStatus(status)}
                          className="text-xs hover:text-green-700"
                          disabled={submitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addExpectedStatus}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20"
                      disabled={submitting}
                    >
                      + Add
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alerts will trigger if response status is not in this list
                  </p>
                </div>
              </div>
            )}

            {/* SSL Monitoring Section */}
                      {/* Monitoring Toggles Section */}
                      <div className="pt-6 border-t border-border">
                        <div className="mb-4 grid grid-cols-2 gap-4">
                          <label className="flex items-center justify-between cursor-pointer relative">
                            <div>
                              <span className="block text-sm font-medium text-foreground mb-1">Multi-Region Monitoring</span>
                              <span className="block text-xs text-muted-foreground">Check site performance from multiple regions</span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.multiRegionMonitoringEnabled}
                                onChange={e => setFormData({ ...formData, multiRegionMonitoringEnabled: e.target.checked })}
                                className="sr-only peer"
                                disabled={submitting}
                              />
                              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary transition-all"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                          </label>
                          <label className="flex items-center justify-between cursor-pointer relative">
                            <div>
                              <span className="block text-sm font-medium text-foreground mb-1">DNS Monitoring</span>
                              <span className="block text-xs text-muted-foreground">Track DNS records and detect changes</span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.dnsMonitoringEnabled}
                                onChange={e => setFormData({ ...formData, dnsMonitoringEnabled: e.target.checked })}
                                className="sr-only peer"
                                disabled={submitting}
                              />
                              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary transition-all"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                          </label>
                          <label className="flex items-center justify-between cursor-pointer relative">
                            <div>
                              <span className="block text-sm font-medium text-foreground mb-1">Security Monitoring</span>
                              <span className="block text-xs text-muted-foreground">Scan for security headers and vulnerabilities</span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.securityMonitoringEnabled}
                                onChange={e => setFormData({ ...formData, securityMonitoringEnabled: e.target.checked })}
                                className="sr-only peer"
                                disabled={submitting}
                              />
                              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary transition-all"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                          </label>
                          <label className="flex items-center justify-between cursor-pointer relative">
                            <div>
                              <span className="block text-sm font-medium text-foreground mb-1">Performance Monitoring</span>
                              <span className="block text-xs text-muted-foreground">Track site response time and performance metrics</span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.performanceMonitoringEnabled}
                                onChange={e => setFormData({ ...formData, performanceMonitoringEnabled: e.target.checked })}
                                className="sr-only peer"
                                disabled={submitting}
                              />
                              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary transition-all"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                          </label>
                        </div>
                      </div>
            {!isApiEndpoint && formData.url && formData.url.startsWith('https://') && (
              <div className="pt-6 border-t border-border">
                <div className="mb-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="block text-sm font-medium text-foreground mb-1">
                        SSL Certificate Monitoring
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Monitor SSL certificate expiry and get alerts
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.sslMonitoringEnabled}
                        onChange={(e) => setFormData({ ...formData, sslMonitoringEnabled: e.target.checked })}
                        className="sr-only peer"
                        disabled={submitting}
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary transition-all"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>

                {formData.sslMonitoringEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alert Threshold (days before expiry)
                    </label>
                    <input
                      type="number"
                      value={formData.sslAlertThreshold}
                      onChange={(e) => setFormData({ ...formData, sslAlertThreshold: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max="90"
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Alert when certificate expires in {formData.sslAlertThreshold || 30} days or less
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-all"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Site' : 'Add Site')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
