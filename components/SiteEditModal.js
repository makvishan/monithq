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
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        url: site.url || '',
        checkInterval: site.checkInterval || 300,
        region: site.region || 'US-EAST',
      });
    } else {
      setFormData({
        name: '',
        url: '',
        checkInterval: 300,
        region: 'US-EAST',
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
        className="bg-card rounded-lg shadow-xl max-w-md w-full"
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
