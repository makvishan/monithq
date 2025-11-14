'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import showToast from '@/lib/toast';

export default function SiteEditModal({ site, isOpen, onClose, onUpdate, mode = 'edit' }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    checkInterval: 300,
    region: 'US-EAST',
    sslMonitoringEnabled: true,
    sslAlertThreshold: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        url: site.url || '',
        checkInterval: site.checkInterval || 300,
        region: site.region || 'US-EAST',
        sslMonitoringEnabled: site.sslMonitoringEnabled ?? true,
        sslAlertThreshold: site.sslAlertThreshold || 30,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: 300,
        region: 'US-EAST',
        sslMonitoringEnabled: true,
        sslAlertThreshold: 30,
      });
    }
  }, [site, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'edit' && site) {
        // Update existing site
        const response = await fetch(`/api/sites/${site.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
          body: JSON.stringify(formData),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {/* Two Column Grid for Main Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="My Website"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com"
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

          {/* SSL Monitoring Section - Only show for HTTPS sites */}
          {formData.url && formData.url.startsWith('https://') && (
            <div className="pt-4 border-t border-border">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
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
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
