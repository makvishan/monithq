'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Activity, Calendar, Filter, Search, User, FileText, Download } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPagination({ ...pagination, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity: '',
      userId: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'text-green-600 bg-green-50',
      update: 'text-blue-600 bg-blue-50',
      delete: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
      logout: 'text-gray-600 bg-gray-50',
      invite: 'text-indigo-600 bg-indigo-50',
      remove: 'text-orange-600 bg-orange-50',
    };
    return colors[action] || 'text-gray-600 bg-gray-50';
  };

  const getEntityIcon = (entity) => {
    const icons = {
      user: User,
      site: Activity,
      organization: FileText,
      incident: Activity,
    };
    const Icon = icons[entity] || FileText;
    return <Icon className="w-4 h-4" />;
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Audit Logs
                </h1>
              </div>
              <p className="text-gray-600">
                Track all system activities and user actions
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="invite">Invite</option>
                    <option value="remove">Remove</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity
                  </label>
                  <select
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Entities</option>
                    <option value="user">User</option>
                    <option value="site">Site</option>
                    <option value="organization">Organization</option>
                    <option value="incident">Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                    placeholder="Enter user ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Entity
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Entity ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        IP Address
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {log.user ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.user.name}
                              </div>
                              <div className="text-sm text-gray-500">{log.user.email}</div>
                              <div className="text-xs text-gray-400">{log.user.role}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity)}
                            <span className="text-sm text-gray-900 capitalize">
                              {log.entity}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {log.entityId.substring(0, 12)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-purple-600 hover:text-purple-700">
                                View
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination({ ...pagination, page: pageNum })}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            pagination.page === pageNum
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </MainContent>
    </div>
  );
}
