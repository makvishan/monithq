"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/Card";
import { NOTIFICATION_CHANNELS, USER_ROLES } from "@/lib/constants";
import {
  Save,
  Trash2,
  User,
  Lock,
  CheckCircle,
  Loader2,
  Bell,
  ArrowRight,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { s3Upload } from "@/lib/s3";

export default function SettingsPage() {
    // Save Notification Channels handler
    const handleSaveNotificationChannels = async () => {
      setSaving(true);
      try {
        // Prepare payload for channels and config
        const channelsPayload = {};
        notifications.forEach((channel) => {
          channelsPayload[channel.id] = channel.enabled;
        });
        const payload = {
          notifications: {
            channels: channelsPayload,
            channelConfig: channelConfig,
          },
        };
        const response = await fetch("/api/users/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to save notification channels");
        }
        showSnackbar("Notification channels saved!", "success");
      } catch (err) {
        showSnackbar(err.message, "error");
      } finally {
        setSaving(false);
      }
    };
  
  // Organization logo state
  const [orgLogo, setOrgLogo] = useState(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState(null);
  const [orgLogoUrl, setOrgLogoUrl] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [orgName, setOrgName] = useState("");
  const [notifications, setNotifications] = useState(NOTIFICATION_CHANNELS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Removed error state, use snackbar for errors
  const [subscription, setSubscription] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);

  const { user: userData } = useAuth();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // Pre-fill profileData when userData loads
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
      });
      // Pre-fill orgName from userData if available
      console.log("Loaded userData in SettingsPage:", userData);
      if (userData?.organization?.name) {
        setOrgName(userData?.organization?.name);
      }
      setOrgLogoUrl(userData?.organization?.logo || null);
    }
  }, [userData]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [channelConfig, setChannelConfig] = useState({
    slackWebhookUrl: "",
    smsPhoneNumber: "",
    customWebhookUrl: "",
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

  const loadUserSettings = useCallback(async () => {
    try {
      // Fetch user settings
      const response = await fetch("/api/users/settings", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.notifications?.channels) {
          // Map API channels to NOTIFICATION_CHANNELS format
          const channels = data.settings.notifications.channels;
          setNotifications(
            NOTIFICATION_CHANNELS.map((channel) => ({
              ...channel,
              enabled: channels[channel.id] ?? channel.enabled,
            }))
          );
        }
        // Load channel configuration
        if (data.settings?.notifications?.channelConfig) {
          const config = data.settings.notifications.channelConfig;
          setChannelConfig({
            slackWebhookUrl: config.slackWebhookUrl || "",
            smsPhoneNumber: config.smsPhoneNumber || "",
            customWebhookUrl: config.customWebhookUrl || "",
          });
        }
      }
      // Fetch subscription to determine allowed channels
      const subResponse = await fetch("/api/user/subscription", {
        credentials: "include",
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
      if (
        userData?.role === USER_ROLES.ORG_ADMIN ||
        userData?.role === USER_ROLES.SUPER_ADMIN
      ) {
        const orgResponse = await fetch("/api/organization/settings", {
          credentials: "include",
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
      if (userData?.role === USER_ROLES.SUPER_ADMIN) {
        const appResponse = await fetch("/api/app-settings", {
          credentials: "include",
        });
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setAppSettings({
            notifyOnManualCheck: appData.notifyOnManualCheck || false,
          });
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

    // Handle organization settings save
  const handleSaveOrganization = async () => {
    setSaving(true);
    try {
      let logoUrl = orgLogoUrl;
      // If a new file is selected and not yet uploaded, upload it
      if (orgLogo && !orgLogoUrl) {
        logoUrl = await s3Upload(orgLogo, "logos");
        setOrgLogoUrl(logoUrl);
      }
      const payload = {
        name: orgName,
        logo: logoUrl,
      };
      const response = await fetch("/api/organization/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update organization");
      }
      showSnackbar("Organization updated!", "success");
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };


  const handleChangePassword = async (e) => {
    console.log("Changing password with data:", passwordData);
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar("New passwords do not match", "error");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showSnackbar("Password must be at least 8 characters", "error");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showSnackbar("Password changed successfully!", "success");
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAlertSettings = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/organization/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(alertSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save alert settings");
      }

      showSnackbar("Alert settings saved!", "success");
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/app-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(appSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save app settings");
      }

      showSnackbar("App settings saved!", "success");
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };


  const toggleNotification = (id) => {
    // Check if user's plan allows this channel
    if (!planLimits) {
      showSnackbar("Plan limits not loaded. Please refresh the page.", "error");
      return;
    }

    const allowedChannels = planLimits.allowedChannels || ["email"];

    if (!allowedChannels.includes(id)) {
      showSnackbar(
        `${
          id.charAt(0).toUpperCase() + id.slice(1)
        } notifications require a plan upgrade.`,
        "error"
      );
      return;
    }

    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, enabled: !n.enabled } : n
      )
    );
  };

    // Handler for organization logo upload
    const handleLogoFileChange = async (e) => {
      const file = e.target.files[0];
      setOrgLogo(file);
      if (file) {
        setOrgLogoPreview(URL.createObjectURL(file));
        // Upload immediately and set URL
        try {
          setLogoUploading(true);
          showSnackbar('Uploading logo...', 'info');
          const url = await s3Upload(file, "logos");
          setOrgLogoUrl(url);
          showSnackbar('Logo uploaded successfully!', 'success');
        } catch (error) {
          console.error('Logo upload failed:', error);
          showSnackbar('Failed to upload logo. Please try again.', 'error');
        } finally {
          setLogoUploading(false);
        }
      }
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
            <p className="text-muted-foreground">
              Manage your account and organization preferences
            </p>
          </div>
        </div>

        {/* Alerts handled globally by SnackbarProvider */}

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
                  <CardDescription>
                    Manage your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative w-full">
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                          disabled
                          className={`w-full px-4 py-2 border bg-muted text-muted-foreground cursor-not-allowed border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
                        />
                        <span
                          className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-xs font-semibold ${
                            userData?.emailVerified
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {userData?.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                      {!userData?.emailVerified && (
                        <button
                          type="button"
                          className="underline text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer flex items-center gap-2"
                          disabled={saving}
                          onClick={async () => {
                            setSaving(true);
                            try {
                              const res = await fetch(
                                "/api/auth/verify-email",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    email: profileData.email,
                                  }),
                                }
                              );
                              const data = await res.json();
                              if (!res.ok)
                                throw new Error(
                                  data.error ||
                                    "Failed to send verification email"
                                );
                              showSnackbar(
                                "Verification email sent! Please check your inbox.",
                                "success"
                              );
                            } catch (err) {
                              showSnackbar(
                                err.message ||
                                  "Failed to send verification email",
                                "error"
                              );
                            } finally {
                              setSaving(false);
                            }
                          }}
                        >
                          {saving ? (
                            <Loader2 className="animate-spin w-4 h-4 mr-1" />
                          ) : null}
                          Verify
                        </button>
                      )}
                    </div>
                    {userData?.role === USER_ROLES.USER && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact your organization admin to change your email
                        address
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
                        value={
                          userData.role === USER_ROLES.SUPER_ADMIN
                            ? "Super Admin"
                            : userData.role === USER_ROLES.ORG_ADMIN
                            ? "Organization Admin"
                            : "User"
                        }
                        disabled
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            {/* Organization Settings - Only for Org Admins */}
            {userData?.role === USER_ROLES.ORG_ADMIN && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>
                      Manage your organization details
                    </CardDescription>
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
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                          {orgLogoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={orgLogoPreview}
                              alt="Logo Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : orgLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={orgLogoUrl}
                              alt="Logo"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span>{orgName.charAt(0).toLocaleUpperCase()}</span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          id="org-logo-upload"
                          style={{ display: "none" }}
                          onChange={handleLogoFileChange}
                          disabled={saving || logoUploading}
                        />
                        <label
                          htmlFor="org-logo-upload"
                          className={`cursor-pointer ${logoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                          >
                            {logoUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload New Logo'
                            )}
                          </span>
                        </label>
                        {!logoUploading && orgLogoUrl && (
                          <span className="text-xs text-green-600 ml-2">
                            Uploaded!
                          </span>
                        )}
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
                    <div className="w-full mt-4 flex">
                      <button
                        onClick={handleSaveOrganization}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Organization
                          </>
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
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
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 pr-12 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
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
                    Choose how you want to receive alerts about your monitored
                    sites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((channel) => {
                      const isAllowed =
                        planLimits?.allowedChannels?.includes(channel.id) ??
                        channel.id === "email";
                      const isPremium =
                        channel.premium ||
                        (channel.id !== "email" && !isAllowed);

                      return (
                        <div key={channel.id} className="space-y-3">
                          <div
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              channel.enabled && isAllowed
                                ? "bg-primary/5 border-primary/30"
                                : "bg-muted/30 border-border"
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
                                  ? "bg-primary"
                                  : "bg-muted"
                              } ${
                                !isAllowed
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  channel.enabled && isAllowed
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Configuration fields for enabled channels */}
                          {channel.enabled &&
                            isAllowed &&
                            channel.id === "slack" && (
                              <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Slack Webhook URL
                                </label>
                                <input
                                  type="url"
                                  value={channelConfig.slackWebhookUrl}
                                  onChange={(e) =>
                                    setChannelConfig({
                                      ...channelConfig,
                                      slackWebhookUrl: e.target.value,
                                    })
                                  }
                                  placeholder="https://hooks.slack.com/services/..."
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Get your webhook URL from{" "}
                                  <a
                                    href="https://api.slack.com/messaging/webhooks"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Slack API
                                  </a>
                                </p>
                              </div>
                            )}

                          {channel.enabled &&
                            isAllowed &&
                            channel.id === "sms" && (
                              <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  value={channelConfig.smsPhoneNumber}
                                  onChange={(e) =>
                                    setChannelConfig({
                                      ...channelConfig,
                                      smsPhoneNumber: e.target.value,
                                    })
                                  }
                                  placeholder="+1 (555) 123-4567"
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Include country code (e.g., +1 for US)
                                </p>
                              </div>
                            )}

                          {channel.enabled &&
                            isAllowed &&
                            channel.id === "webhook" && (
                              <div className="ml-4 p-4 bg-muted/30 border border-border rounded-lg">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Webhook URL
                                </label>
                                <input
                                  type="url"
                                  value={channelConfig.customWebhookUrl}
                                  onChange={(e) =>
                                    setChannelConfig({
                                      ...channelConfig,
                                      customWebhookUrl: e.target.value,
                                    })
                                  }
                                  placeholder="https://your-domain.com/webhook"
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  We&apos;ll POST JSON alerts to this endpoint
                                </p>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Save Notification Channels Button - Consistent Style */}
                  <div className="w-full mt-4 flex">
                    <button
                      onClick={handleSaveNotificationChannels}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Notification Channels
                        </>
                      )}
                    </button>
                  </div>

                  {subscription && subscription.plan === "FREE" && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        🚀{" "}
                        <strong className="text-foreground">
                          Upgrade to unlock more channels!
                        </strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get Slack, SMS, and Webhook notifications with our paid
                        plans.
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
            {userData?.role === USER_ROLES.USER && (
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
                            ✅ You control{" "}
                            <strong className="text-foreground">how</strong> you
                            receive notifications (Email, Slack, SMS, Webhooks)
                          </p>
                          <p>
                            ℹ️ Your organization admin controls{" "}
                            <strong className="text-foreground">when</strong>{" "}
                            alerts are triggered (thresholds, timing,
                            maintenance mode)
                          </p>
                          <p className="text-xs mt-3 pt-3 border-t border-border">
                            Need to change alert settings? Contact your
                            organization administrator.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Alert Settings - For Org Admin and Super Admin */}
            {(userData?.role === USER_ROLES.ORG_ADMIN ||
              userData?.role === USER_ROLES.SUPER_ADMIN) && (
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
                        onChange={(e) =>
                          setAlertSettings((prev) => ({
                            ...prev,
                            alertThreshold: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={1}>1 failure</option>
                        <option value={2}>2 failures</option>
                        <option value={3}>3 failures</option>
                        <option value={5}>5 failures</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Number of consecutive check failures before creating an
                        incident
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Alert Cooldown Period
                      </label>
                      <select
                        value={alertSettings.alertCooldownMinutes}
                        onChange={(e) =>
                          setAlertSettings((prev) => ({
                            ...prev,
                            alertCooldownMinutes: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum time between repeated notifications for the same
                        incident
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground mb-1">
                          Maintenance Mode
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Pause all alerts temporarily for all users
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setAlertSettings((prev) => ({
                            ...prev,
                            maintenanceMode: !prev.maintenanceMode,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          alertSettings.maintenanceMode
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            alertSettings.maintenanceMode
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handleSaveAlertSettings}
                      disabled={saving}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
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
            {userData?.role === USER_ROLES.SUPER_ADMIN && (
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
                        <h4 className="font-medium text-foreground mb-1">
                          Email on Manual Checks
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications when users click &quot;Check
                          Now&quot;
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setAppSettings((prev) => ({
                            ...prev,
                            notifyOnManualCheck: !prev.notifyOnManualCheck,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          appSettings.notifyOnManualCheck
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            appSettings.notifyOnManualCheck
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
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
          {userData?.role === USER_ROLES.ORG_ADMIN && (
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
