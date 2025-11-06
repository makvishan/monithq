'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { adminAPI } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Shield,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = roleFilter !== 'all' ? { role: roleFilter } : {};
      const data = await adminAPI.getUsers(filters);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    users: users.filter(u => u.role === 'USER').length,
    orgAdmins: users.filter(u => u.role === 'ORG_ADMIN').length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
  };

  const handleSuspend = (userId) => {
    console.log('Suspending user:', userId);
    setShowActionMenu(null);
  };

  const handleActivate = (userId) => {
    console.log('Activating user:', userId);
    setShowActionMenu(null);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
    setShowActionMenu(null);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      console.log('Deleting user:', userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleSendEmail = (userId) => {
    console.log('Sending email to user:', userId);
    setShowActionMenu(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold gradient-text">User Management</h1>
              <p className="text-muted-foreground">Manage all platform users</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Users
          </button>
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
            <button onClick={fetchUsers} className="ml-auto text-sm text-red-500 hover:underline">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Regular Users</p>
                        <p className="text-2xl font-bold text-foreground">{stats.users}</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <UserCheck className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Org Admins</p>
                        <p className="text-2xl font-bold text-foreground">{stats.orgAdmins}</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <Shield className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Super Admins</p>
                        <p className="text-2xl font-bold text-foreground">{stats.superAdmins}</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <Shield className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Roles</option>
                    <option value="USER">Users</option>
                    <option value="ORG_ADMIN">Org Admins</option>
                    <option value="SUPER_ADMIN">Super Admins</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Organization</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-foreground">{user.name || 'Unnamed User'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  user.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-500' :
                                  user.role === 'ORG_ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN' ? <Shield className="w-3 h-3" /> : null}
                                  {user.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground">{user.organization?.name || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </MainContent>
    </div>
  );
}
