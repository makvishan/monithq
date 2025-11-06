'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Globe, ExternalLink, Copy, Check, Eye, Settings as SettingsIcon, Save } from 'lucide-react';
import showToast from '@/lib/toast';

export default function StatusPageSettingsPage() {
  const [statusPage, setStatusPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    logoUrl: '',
    isPublic: true,
    showUptime: true,
    showIncidents: true,
  });

  useEffect(() => {
    fetchStatusPage();
  }, []);

  const fetchStatusPage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/status-page');
      const data = await response.json();
      
      if (response.ok && data.statusPage) {
        setStatusPage(data.statusPage);
        setFormData({
          slug: data.statusPage.slug || '',
          title: data.statusPage.title || '',
          description: data.statusPage.description || '',
          logoUrl: data.statusPage.logoUrl || '',
          isPublic: data.statusPage.isPublic ?? true,
          showUptime: data.statusPage.showUptime ?? true,
          showIncidents: data.statusPage.showIncidents ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch status page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const createOrUpdateStatusPage = async () => {
    try {
      setSaving(true);
      const method = statusPage ? 'PUT' : 'POST';
      const response = await fetch('/api/status-page', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusPage(data.statusPage);
        setHasChanges(false);
        showToast.success(statusPage ? 'Status page updated successfully!' : 'Status page created successfully!');
      } else {
        showToast.error(data.error || 'Failed to save status page');
      }
    } catch (error) {
      console.error('Failed to save status page:', error);
      showToast.error('Failed to save status page');
    } finally {
      setSaving(false);
    }
  };

  const copyStatusPageUrl = async () => {
    const url = `${window.location.origin}/status/${formData.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openStatusPage = () => {
    window.open(`/status/${formData.slug}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <MainContent>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Status Page
                </h1>
              </div>
              <p className="text-gray-600">
                Create a public status page to share with your customers
              </p>
            </div>

            {statusPage && (
              <div className="flex gap-3">
                <button
                  onClick={openStatusPage}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={copyStatusPageUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Page Configuration</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{window.location.origin}/status/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-company"
                        disabled={!!statusPage}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    {statusPage && (
                      <p className="text-xs text-gray-500 mt-1">
                        Slug cannot be changed after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Our Service Status"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Real-time status of our services"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use organization logo
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Display Options</h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => handleChange('isPublic', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Public Access</div>
                      <div className="text-sm text-gray-600">
                        Allow anyone to view this status page
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showUptime}
                      onChange={(e) => handleChange('showUptime', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Show Uptime</div>
                      <div className="text-sm text-gray-600">
                        Display uptime percentage for each service
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showIncidents}
                      onChange={(e) => handleChange('showIncidents', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Show Incidents</div>
                      <div className="text-sm text-gray-600">
                        Display recent incidents and their status
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={createOrUpdateStatusPage}
                disabled={saving || !formData.slug || !formData.title || !hasChanges}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : statusPage ? 'Update Status Page' : 'Create Status Page'}
              </button>
            </div>

            {/* Preview/Info */}
            <div className="space-y-6">
              {statusPage && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-900 mb-4">Your Status Page</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-green-700 mb-1">Public URL</div>
                      <code className="block px-3 py-2 bg-white rounded-lg text-xs break-all">
                        {window.location.origin}/status/{formData.slug}
                      </code>
                    </div>

                    <div>
                      <div className="text-sm text-green-700 mb-1">Status</div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        formData.isPublic
                          ? 'text-green-600 bg-green-100'
                          : 'text-gray-600 bg-gray-200'
                      }`}>
                        {formData.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>

                    <button
                      onClick={openStatusPage}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Status Page
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3">About Status Pages</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Share real-time service status with your customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Automatically updates with your monitored sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Shows incident history and resolution times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Clean, professional design that matches your brand</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </MainContent>
    </div>
  );
}
