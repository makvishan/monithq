'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/Card';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Bookmark,
  Loader2,
  Save,
} from 'lucide-react';

export default function NotificationSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifyOnIncident: true,
    notifyOnResolution: true,
    notifyOnDegradation: true,
    notifyOnlyAdmins: false,
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [allSites, setAllSites] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchSites();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings({
        notifyOnIncident: data.notifyOnIncident,
        notifyOnResolution: data.notifyOnResolution,
        notifyOnDegradation: data.notifyOnDegradation,
        notifyOnlyAdmins: data.notifyOnlyAdmins,
      });
      setSubscriptions(data.siteSubscriptions || []);
    } catch (error) {
      toast.error('Failed to load notification settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setAllSites(data.sites || []);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save notification settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async (siteId) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      setSubscriptions((prev) => [...prev, data.subscription]);
      toast.success('Subscribed to site notifications');
    } catch (error) {
      toast.error(error.message || 'Failed to subscribe');
      console.error(error);
    }
  };

  const handleUnsubscribe = async (siteId) => {
    try {
      const response = await fetch(`/api/subscriptions?siteId=${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setSubscriptions((prev) => prev.filter((sub) => sub.siteId !== siteId));
      toast.success('Unsubscribed from site notifications');
    } catch (error) {
      toast.error(error.message || 'Failed to unsubscribe');
      console.error(error);
    }
  };

  const isSubscribed = (siteId) => {
    return subscriptions.some((sub) => sub.siteId === siteId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications about your monitored sites
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 gradient-ai text-white rounded-lg font-medium hover:opacity-90 transition-all glow-ai inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Configure which types of alerts you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Incident Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <h4 className="font-medium text-foreground">Incident Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when sites go offline</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notifyOnIncident')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyOnIncident ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyOnIncident ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Degradation Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h4 className="font-medium text-foreground">Degradation Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when sites are slow or degraded</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notifyOnDegradation')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyOnDegradation ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyOnDegradation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Resolution Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <h4 className="font-medium text-foreground">Resolution Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when incidents are resolved</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notifyOnResolution')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyOnResolution ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyOnResolution ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Admin Only Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-medium text-foreground">Admin Only Mode</h4>
                    <p className="text-sm text-muted-foreground">Only receive notifications if you're an admin</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('notifyOnlyAdmins')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifyOnlyAdmins ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifyOnlyAdmins ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Site Subscriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                <CardTitle>Site Subscriptions</CardTitle>
              </div>
              <CardDescription>
                Subscribe to specific sites to only receive notifications for them
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sites available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allSites.map((site) => {
                    const subscribed = isSubscribed(site.id);
                    return (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              site.status === 'ONLINE'
                                ? 'bg-green-400 shadow-glow-success'
                                : site.status === 'DEGRADED'
                                ? 'bg-yellow-400 shadow-glow-warning'
                                : 'bg-red-400 shadow-glow-danger'
                            }`}
                          />
                          <div>
                            <h4 className="font-medium text-foreground">{site.name}</h4>
                            <p className="text-sm text-muted-foreground">{site.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => subscribed ? handleUnsubscribe(site.id) : handleSubscribe(site.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            subscribed
                              ? 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
                              : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                          }`}
                        >
                          {subscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {subscriptions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    📌 You're subscribed to {subscriptions.length} site{subscriptions.length !== 1 ? 's' : ''}.
                    You'll only receive notifications for these sites.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </MainContent>
    </div>
  );
}
