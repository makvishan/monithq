'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Calendar, Shield } from 'lucide-react';
import showToast from '@/lib/toast';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [createdKey, setCreatedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/api-keys');
      const data = await response.json();
      
      if (response.ok) {
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const expiresAt = newKeyExpiry === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(newKeyExpiry) * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expiresAt,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedKey(data.key);
        setNewKeyName('');
        setNewKeyExpiry('never');
        fetchApiKeys();
        showToast.success('API key created successfully!');
      } else {
        showToast.error(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      showToast.error('Failed to create API key');
    }
  };

  const deleteApiKey = (key) => {
    setKeyToDelete(key);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;

    try {
      const response = await fetch(`/api/api-keys/${keyToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApiKeys();
        showToast.success('API key deleted successfully');
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      showToast.error('Failed to delete API key');
    } finally {
      setShowDeleteDialog(false);
      setKeyToDelete(null);
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

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 12) + '•'.repeat(32) + key.substring(key.length - 4);
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
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  API Keys
                </h1>
              </div>
              <p className="text-gray-600">
                Manage API keys for programmatic access to your monitoring data
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create API Key
            </button>
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No API keys yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
              >
                Create your first API key
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    isExpired(apiKey.expiresAt)
                      ? 'border-red-200 bg-red-50'
                      : apiKey.isActive
                      ? 'border-gray-200 bg-gray-50 hover:border-blue-300'
                      : 'border-gray-200 bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {apiKey.name}
                        </h3>
                        {isExpired(apiKey.expiresAt) ? (
                          <span className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full">
                            Expired
                          </span>
                        ) : apiKey.isActive ? (
                          <span className="px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono flex-1">
                            {visibleKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title={visibleKeys[apiKey.id] ? 'Hide key' : 'Show key'}
                          >
                            {visibleKeys[apiKey.id] ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === apiKey.id ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {formatDate(apiKey.createdAt)}</span>
                        </div>
                        {apiKey.expiresAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {formatDate(apiKey.expiresAt)}</span>
                          </div>
                        )}
                        {apiKey.lastUsedAt && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteApiKey(apiKey)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ml-4"
                      title="Delete API key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create API Key
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Server"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration
                  </label>
                  <select
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="never">Never</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createApiKey}
                  disabled={!newKeyName.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Key
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setNewKeyExpiry('never');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Key Modal */}
        {createdKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold mb-4 text-green-600">
                API Key Created!
              </h2>
              
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⚠️ Important: Copy this key now!
                </p>
                <p className="text-sm text-yellow-700">
                  For security reasons, you won't be able to see this key again.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your API Key
                </label>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono break-all">
                    {createdKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdKey, 'created')}
                    className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {copiedId === 'created' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCreatedKey(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
              >
                I've copied the key
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setKeyToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete API Key"
          message={`Are you sure you want to delete "${keyToDelete?.name}"? This action cannot be undone and any applications using this key will stop working.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </MainContent>
    </div>
  );
}
