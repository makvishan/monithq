'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/Card';
import { Shield, Save, Loader2, CheckCircle, AlertCircle, Bell, Mail, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AppSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const [appSettings, setAppSettings] = useState({
    notifyOnManualCheck: false,
  });

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      // Check if user is logged in and is Super Admin
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(currentUser);
      setUserData(user);

      // Check if user is Super Admin
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }

      // Load app settings
      const response = await fetch('/api/app-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppSettings({
          notifyOnManualCheck: data.notifyOnManualCheck || false,
        });
      }
    } catch (err) {
      console.error('Error loading app settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/app-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(appSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
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
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Application Settings</h1>
              <p className="text-muted-foreground">Manage global application-wide settings</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-500 font-medium">Settings saved successfully!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500 font-medium">{error}</span>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notification Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle>Notification Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email on Manual Checks */}
                  <div className="flex items-center justify-between p-6 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Email on Manual Checks</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send email alerts when users click "Check Now"
                      </p>
                    </div>
                    <button
                      onClick={() => setAppSettings(prev => ({ 
                        ...prev, 
                        notifyOnManualCheck: !prev.notifyOnManualCheck 
                      }))}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors ${
                        appSettings.notifyOnManualCheck ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                        appSettings.notifyOnManualCheck ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Settings
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Info & Help */}
          <div className="space-y-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-blue-500">Super Admin Only</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">About Application Settings:</strong>
                    </p>
                    <ul className="space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>These settings apply globally across all organizations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Only Super Admins can modify these settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Changes take effect immediately after saving</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Organization-specific settings can be managed in the Settings page</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button className="w-full px-4 py-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">View Audit Logs</div>
                      <div className="text-xs text-muted-foreground">Track all settings changes</div>
                    </div>
                  </button>
                  <button className="w-full px-4 py-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">Email Templates</div>
                      <div className="text-xs text-muted-foreground">Customize notification emails</div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </MainContent>
    </div>
  );
}
