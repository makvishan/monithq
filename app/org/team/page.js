'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import ConfirmDialog from '@/components/ConfirmDialog';
import { organizationsAPI } from '@/lib/api';
import showToast from '@/lib/toast';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Search, 
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function TeamManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizationsAPI.getTeam();
      setTeamMembers(data.team || []);
    } catch (err) {
      setError(err.message || 'Failed to load team');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    (member.name && member.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = teamMembers.filter(m => m.status === 'ACTIVE').length;
  const pendingCount = teamMembers.filter(m => m.status === 'PENDING').length;

  const handleInvite = async () => {
    if (!inviteEmail) {
      showToast.warning('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      await organizationsAPI.inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('USER');
      setShowInviteModal(false);
      await fetchTeam(); // Refresh the list
      showToast.success(`Invitation sent to ${inviteEmail}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (member) => {
    setMemberToRemove(member);
    setShowConfirmDialog(true);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      await organizationsAPI.removeMember(memberToRemove.id);
      await fetchTeam(); // Refresh the list
      const displayName = memberToRemove.name || memberToRemove.email;
      showToast.success(`${displayName} has been removed from the team`);
    } catch (err) {
      showToast.error(err.message || 'Failed to remove member');
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleResendInvite = (member) => {
    showToast.info(`Invitation resent to ${member.email}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE' || status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const getAvatar = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
      }
      return name.substring(0, 2);
    }
    return email ? email.substring(0, 2) : '??';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Team Management</h1>
            <p className="text-muted-foreground">Manage your organization's team members</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 gradient-ai text-white rounded-lg font-medium inline-flex items-center gap-2 glow-ai"
            disabled={loading}
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
            <button onClick={fetchTeam} className="ml-auto text-sm text-red-500 hover:underline">
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                    <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Invites</p>
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Team Members Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Member</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Joined</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Last Active</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full gradient-ai flex items-center justify-center text-white font-semibold uppercase">
                              {getAvatar(member.name, member.email)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.name || (member.status === 'PENDING' ? 'Pending Invitation' : 'Unnamed User')}
                              </p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{formatDate(member.createdAt)}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">{member.lastActive ? formatRelativeTime(member.lastActive) : 'Never'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {member.status === 'PENDING' && (
                              <button
                                onClick={() => handleResendInvite(member)}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Resend Invite"
                              >
                                <Mail className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemove(member)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredMembers.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">About Team Roles</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        • <strong>Organization Admin (you):</strong> Can manage team members, billing, and all organization settings. Only one admin per organization.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        • <strong>User:</strong> Can access dashboard, manage sites, view insights and incidents. Cannot access billing or team management.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </MainContent>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border rounded-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={submitting}
                >
                  <option value="USER">User</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                An invitation email will be sent with instructions to join your organization.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="flex-1 px-4 py-2 gradient-ai text-white rounded-lg font-medium glow-ai inline-flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invite'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setMemberToRemove(null);
        }}
        onConfirm={confirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.name || memberToRemove?.email || 'this member'} from the team? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
