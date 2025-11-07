'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/Card';
import { NOTIFICATION_CHANNELS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { Save, Trash2, User, Lock, CheckCircle, Loader2, Bell, ArrowRight, AlertTriangle, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [notifications, setNotifications] = useState(NOTIFICATION_CHANNELS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);
  
  const { user: userData } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  // Pre-fill profileData when userData loads
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
      });
    }
  }, [userData]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [channelConfig, setChannelConfig] = useState({
    slackWebhookUrl: '',
    smsPhoneNumber: '',
    customWebhookUrl: '',
  });
  
  // Alert Settings (Organization-level)
  const [alertSettings, setAlertSettings] = useState({
    alertThreshold: 2,
    alertCooldownMinutes: 15,
    maintenanceMode: false,
  });
  
  // App Settings (Application-level - Super Admin only)
  const [appSettings, setAppSettings] = useState({
    notifyOnManualCheck: false,
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Fetch user settings
      const response = await fetch('/api/users/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.notifications?.channels) {
          // Map API channels to NOTIFICATION_CHANNELS format
          const channels = data.settings.notifications.channels;
          setNotifications(NOTIFICATION_CHANNELS.map(channel => ({
            ...channel,
            enabled: channels[channel.id] ?? channel.enabled,
          })));
        }
        
        // Load channel configuration
        if (data.settings?.notifications?.channelConfig) {
          const config = data.settings.notifications.channelConfig;
          setChannelConfig({
            slackWebhookUrl: config.slackWebhookUrl || '',
            smsPhoneNumber: config.smsPhoneNumber || '',
            customWebhookUrl: config.customWebhookUrl || '',
          });
        }
      }

      // Fetch subscription to determine allowed channels
      const subResponse = await fetch('/api/user/subscription', {
        credentials: 'include',
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        // Store plan limits from API response
        if (subData.subscription?.planLimits) {
          setPlanLimits(subData.subscription.planLimits);
        }
      }
      
      // Load organization alert settings (for ORG_ADMIN and SUPER_ADMIN)
      if (userData?.role === 'ORG_ADMIN' || userData?.role === 'SUPER_ADMIN') {
        const orgResponse = await fetch('/api/organization/settings', {
          credentials: 'include',
        });
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setAlertSettings({
            alertThreshold: orgData.alertThreshold || 2,
            alertCooldownMinutes: orgData.alertCooldownMinutes || 15,
            maintenanceMode: orgData.maintenanceMode || false,
          });
        }
      }
      // Load app settings (for SUPER_ADMIN only)
      if (userData?.role === 'SUPER_ADMIN') {
        const appResponse = await fetch('/api/app-settings', {
          credentials: 'include',
        });
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setAppSettings({
            notifyOnManualCheck: appData.notifyOnManualCheck || false,
          });
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

  // Update userData state only
  // If you want to update context, call refreshUser from useAuth

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAlertSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(alertSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save alert settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/app-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(appSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save app settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save profile data and notification preferences
      const notificationChannels = {};
      notifications.forEach(n => {
        notificationChannels[n.id] = n.enabled;
      });

      // Prepare data to send - exclude email for regular users
      const updateData = {
        name: profileData.name,
        notificationChannels,
        ...channelConfig, // Include channel configuration (URLs/phone)
      };

      // Only allow admins to change email
      if (userData?.role !== 'USER') {
        updateData.email = profileData.email;
      }

      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      // Update local profileData state only (user info is managed by AuthContext)
      setProfileData({
        name: profileData.name,
        email: profileData.email,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (id) => {
    // Check if user's plan allows this channel
    if (!planLimits) {
      setError('Plan limits not loaded. Please refresh the page.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const allowedChannels = planLimits.allowedChannels || ['email'];
    
    if (!allowedChannels.includes(id)) {
      setError(`${id.charAt(0).toUpperCase() + id.slice(1)} notifications require a plan upgrade.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and organization preferences</p>
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

        {/* Success Message */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500 font-medium">Settings saved successfully!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <CardTitle>User Profile</CardTitle>
                  </div>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      disabled={userData?.role === 'USER'}
                      className={`w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        userData?.role === 'USER' 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : 'bg-background'
                      }`}
                    />
                    {userData?.role === 'USER' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact your organization admin to change your email address
                      </p>
                    )}
                  </div>

                  {userData && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={userData.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                               userData.role === 'ORG_ADMIN' ? 'Organization Admin' : 'User'}
                        disabled
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
               {/* Change Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <CardTitle>Change Password</CardTitle>
                  </div>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>


            {/* Notification Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle>Notification Channels</CardTitle>
                  </div>
                  <CardDescription>
                    Choose how you want to receive alerts about your monitored sites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((channel) => {
                      const isAllowed = planLimits?.allowedChannels?.includes(channel.id) ?? (channel.id === 'email');
                      const isPremium = channel.premium || (channel.id !== 'email' && !isAllowed);
                      
                      return (
                        <div key={channel.id} className="space-y-3">
                          <div
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              channel.enabled && isAllowed
                                ? 'bg-primary/5 border-primary/30'
                                : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">
                                  {channel.name}
                                </h4>
                                {isPremium && !isAllowed && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-full border border-purple-500/30">
                                    Premium
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {channel.description}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleNotification(channel.id)}
                              disabled={!isAllowed}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                channel.enabled && isAllowed
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  channel.enabled && isAllowed ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          
                          {/* Configuration fields for enabled channels */}
                          {channel.enabled && isAllowed && channel.id === 'slack' && (
                            <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Slack Webhook URL
                              </label>
                              <input
                                type="url"
                                value={channelConfig.slackWebhookUrl}
                                onChange={(e) => setChannelConfig({...channelConfig, slackWebhookUrl: e.target.value})}
                                placeholder="https://hooks.slack.com/services/..."
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Get your webhook URL from <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Slack API</a>
                              </p>
                            </div>
                          )}
                          
                          {channel.enabled && isAllowed && channel.id === 'sms' && (
                            <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={channelConfig.smsPhoneNumber}
                                onChange={(e) => setChannelConfig({...channelConfig, smsPhoneNumber: e.target.value})}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Include country code (e.g., +1 for US)
                              </p>
                            </div>
                          )}
                          
                          {channel.enabled && isAllowed && channel.id === 'webhook' && (
                            <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Webhook URL
                              </label>
                              <input
                                type="url"
                                value={channelConfig.customWebhookUrl}
                                onChange={(e) => setChannelConfig({...channelConfig, customWebhookUrl: e.target.value})}
                                placeholder="https://your-domain.com/webhook"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                We'll POST JSON alerts to this endpoint
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {subscription && subscription.plan === 'FREE' && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        🚀 <strong className="text-foreground">Upgrade to unlock more channels!</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get Slack, SMS, and Webhook notifications with our paid plans.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        View Plans
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Card for Regular Users */}
            {userData?.role === 'USER' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">
                          About Your Notification Settings
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>
                            ✅ You control <strong className="text-foreground">how</strong> you receive notifications (Email, Slack, SMS, Webhooks)
                          </p>
                          <p>
                            ℹ️ Your organization admin controls <strong className="text-foreground">when</strong> alerts are triggered (thresholds, timing, maintenance mode)
                          </p>
                          <p className="text-xs mt-3 pt-3 border-t border-border">
                            Need to change alert settings? Contact your organization administrator.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

                     {/* Organization Settings - Only for Org Admins */}
            {userData?.role === 'ORG_ADMIN' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>Manage your organization details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                          A
                        </div>
                        <button className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                          Upload New Logo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization ID
                      </label>
                      <input
                        type="text"
                        value="org_2k3j4h5g6f7d8s"
                        disabled
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Alert Settings - For Org Admin and Super Admin */}
            {(userData?.role === 'ORG_ADMIN' || userData?.role === 'SUPER_ADMIN') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-orange-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <CardTitle>Alert Settings</CardTitle>
                    </div>
                    <CardDescription>
                      Configure organization-wide alert behavior (Admin Only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Alert Threshold (consecutive failures)
                      </label>
                      <select 
                        value={alertSettings.alertThreshold}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={1}>1 failure</option>
                        <option value={2}>2 failures</option>
                        <option value={3}>3 failures</option>
                        <option value={5}>5 failures</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Number of consecutive check failures before creating an incident
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Alert Cooldown Period
                      </label>
                      <select 
                        value={alertSettings.alertCooldownMinutes}
                        onChange={(e) => setAlertSettings(prev => ({ ...prev, alertCooldownMinutes: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum time between repeated notifications for the same incident
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Maintenance Mode</h4>
                        <p className="text-sm text-muted-foreground">Pause all alerts temporarily for all users</p>
                      </div>
                      <button 
                        onClick={() => setAlertSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          alertSettings.maintenanceMode ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alertSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <button
                      onClick={handleSaveAlertSettings}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Alert Settings
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Super Admin Only Settings */}
            {userData?.role === 'SUPER_ADMIN' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="border-purple-500/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <CardTitle>Super Admin Controls</CardTitle>
                    </div>
                    <CardDescription>
                      Advanced settings (Super Admin Only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Email on Manual Checks</h4>
                        <p className="text-sm text-muted-foreground">Send email notifications when users click "Check Now"</p>
                      </div>
                      <button 
                        onClick={() => setAppSettings(prev => ({ ...prev, notifyOnManualCheck: !prev.notifyOnManualCheck }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          appSettings.notifyOnManualCheck ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          appSettings.notifyOnManualCheck ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <button
                      onClick={handleSaveAppSettings}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save App Settings
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Quick Actions & Danger Zone (Org Admin Only) */}
          {userData?.role === 'ORG_ADMIN' && (
            <div className="space-y-8">
              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-red-500/50">
                  <CardHeader>
                    <CardTitle className="text-red-500">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <button className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-500/10 transition-colors">
                      Delete All Data
                    </button>
                    <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      Delete Organization
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </MainContent>
    </div>
  );
}
