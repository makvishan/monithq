'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Webhook, Plus, Trash2, Copy, Check, Power, Edit2, AlertCircle, Shield } from 'lucide-react';
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_DISPLAY_NAMES } from '@/lib/constants';
import showToast from '@/lib/toast';

// Map webhook events to their descriptions
const WEBHOOK_EVENT_DESCRIPTIONS = {
  [WEBHOOK_EVENTS.INCIDENT_CREATED]: 'When a new incident is detected',
  [WEBHOOK_EVENTS.INCIDENT_UPDATED]: 'When an incident status changes',
  [WEBHOOK_EVENTS.INCIDENT_RESOLVED]: 'When an incident is resolved',
  [WEBHOOK_EVENTS.SITE_DOWN]: 'When a site goes offline',
  [WEBHOOK_EVENTS.SITE_UP]: 'When a site comes back online',
  [WEBHOOK_EVENTS.SITE_DEGRADED]: 'When a site performance degrades',
  [WEBHOOK_EVENTS.SITE_CREATED]: 'When a new site is added',
  [WEBHOOK_EVENTS.SITE_DELETED]: 'When a site is removed',
};

const AVAILABLE_EVENTS = Object.values(WEBHOOK_EVENTS).map((value) => ({
  value,
  label: WEBHOOK_EVENT_DISPLAY_NAMES[value],
  description: WEBHOOK_EVENT_DESCRIPTIONS[value],
}));

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    useSecret: false,
  });
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks');
      const data = await response.json();
      
      if (response.ok) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      showToast.warning('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.secret) {
          setCreatedSecret(data.secret);
        }
        setFormData({ name: '', url: '', events: [], useSecret: false });
        setShowCreateModal(false);
        fetchWebhooks();
        showToast.success('Webhook created successfully!');
      } else {
        showToast.error(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      showToast.error('Failed to create webhook');
    }
  };

  const toggleWebhook = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchWebhooks();
        showToast.success(`Webhook ${!currentStatus ? 'enabled' : 'disabled'}`);
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Failed to update webhook');
      }
    } catch (error) {
      console.error('Failed to update webhook:', error);
      showToast.error('Failed to update webhook');
    }
  };

  const deleteWebhook = (webhook) => {
    setWebhookToDelete(webhook);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!webhookToDelete) return;

    try {
      const response = await fetch(`/api/webhooks/${webhookToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWebhooks();
        showToast.success('Webhook deleted successfully');
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      showToast.error('Failed to delete webhook');
    } finally {
      setShowDeleteDialog(false);
      setWebhookToDelete(null);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
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
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                  <Webhook className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Webhooks
                </h1>
              </div>
              <p className="text-gray-600">
                Send real-time notifications to your custom endpoints
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Webhook
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">How Webhooks Work</h3>
              </div>
              <p className="text-sm text-blue-800 mb-3">
                Webhooks send POST requests to your specified URL when events occur. Each request includes event details in JSON format.
              </p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs">
                <div className="text-gray-600 mb-1">Example payload:</div>
                <pre className="text-gray-800">
{`{
  "event": "incident_created",
  "timestamp": "2025-11-05T10:30:00Z",
  "data": {
    "incident_id": "...",
    "site_name": "Main Website",
    "severity": "high"
  }
}`}
                </pre>
              </div>
              <br></br>
              <p className="text-xs text-muted-foreground">
                Refer here for more details on setting up and securing your &nbsp;
                <a
                  href="/assets/docs/MonitHQ_Webhook_Integration_Guide.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                   Webhook Setup
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Webhooks List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No webhooks configured yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
              >
                Create your first webhook
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    webhook.isActive
                      ? 'border-gray-200 bg-gray-50 hover:border-purple-300'
                      : 'border-gray-200 bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {webhook.name}
                        </h3>
                        {webhook.isActive ? (
                          <span className="px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                            Inactive
                          </span>
                        )}
                        {webhook.secret && (
                          <span className="px-3 py-1 text-xs font-semibold text-purple-600 bg-purple-100 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Secured
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-1">Endpoint URL</div>
                        <code className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono block">
                          {webhook.url}
                        </code>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Events</div>
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map(event => (
                            <span
                              key={event}
                              className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
                            >
                              {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div>
                          Created: {formatDate(webhook.createdAt)}
                        </div>
                        {webhook.lastTriggeredAt && (
                          <div>
                            Last triggered: {formatDate(webhook.lastTriggeredAt)}
                          </div>
                        )}
                        <div>
                          By: {webhook.createdBy.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleWebhook(webhook.id, webhook.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          webhook.isActive
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title={webhook.isActive ? 'Disable webhook' : 'Enable webhook'}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Webhook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create Webhook
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Slack Notifications"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://your-domain.com/webhook"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Events to Listen *
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {AVAILABLE_EVENTS.map(event => (
                      <label
                        key={event.value}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{event.label}</div>
                          <div className="text-sm text-gray-600">{event.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Selected: {formData.events.length} event(s)
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useSecret}
                      onChange={(e) => setFormData({ ...formData, useSecret: e.target.checked })}
                    />
                    <div>
                      <div className="font-medium text-purple-900 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Use Webhook Secret (Recommended)
                      </div>
                      <div className="text-sm text-purple-700">
                        Generate a secret for HMAC signature verification
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={createWebhook}
                  disabled={!formData.name || !formData.url || formData.events.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Webhook
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', url: '', events: [], useSecret: false });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Secret Modal */}
        {createdSecret && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold mb-4 text-purple-600">
                Webhook Secret Created!
              </h2>
              
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Important: Copy this secret now!
                </p>
                <p className="text-sm text-yellow-700">
                  You won't be able to see this secret again. Use it to verify webhook signatures.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret
                </label>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono break-all">
                    {createdSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdSecret, 'secret')}
                    className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    {copiedId === 'secret' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-700 mb-2">Header verification:</div>
                <code className="text-xs text-gray-800">X-MonitHQ-Signature: {'{HMAC-SHA256}'}</code>
              </div>

              <button
                onClick={() => setCreatedSecret(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
              >
                I've copied the secret
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setWebhookToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Webhook"
          message={`Are you sure you want to delete "${webhookToDelete?.name}"? This action cannot be undone and webhook deliveries will stop immediately.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </MainContent>
    </div>
  );
}
