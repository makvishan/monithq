'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import SiteStatusCard from '@/components/SiteStatusCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import SiteEditModal from '@/components/SiteEditModal';
import { sitesAPI } from '@/lib/api';
import { getStatusBadge, formatUptime, formatResponseTime, formatRelativeTime } from '@/lib/utils';
import showToast from '@/lib/toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Search, Filter, Download, ExternalLink, Edit, Trash2, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SitesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [checkingSites, setCheckingSites] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  // Fetch sites on mount and when filters change
  useEffect(() => {
    fetchSites();
  }, [pagination.currentPage, statusFilter, searchTerm]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/sites?${params.toString()}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSites(data.sites || []);
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
        }));
      } else {
        throw new Error(data.error || 'Failed to load sites');
      }
    } catch (err) {
      setError(err.message || 'Failed to load sites');
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on search
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setShowModal(true);
  };

  const handleDelete = (site) => {
    setSiteToDelete(site);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    
    try {
      await sitesAPI.delete(siteToDelete.id);
      await fetchSites(); // Refresh the list
      showToast.success('Site deleted successfully');
    } catch (err) {
      showToast.error(err.message || 'Failed to delete site');
    } finally {
      setShowDeleteDialog(false);
      setSiteToDelete(null);
    }
  };

  const handleCheckNow = async (site) => {
    setCheckingSites(prev => ({ ...prev, [site.id]: true }));
    
    try {
      const response = await fetch(`/api/sites/${site.id}/check`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the site in the list with new data
        setSites(prevSites => 
          prevSites.map(s => s.id === site.id ? data.site : s)
        );
        
        const statusEmoji = data.check.status === 'ONLINE' ? '✅' : 
                           data.check.status === 'DEGRADED' ? '⚠️' : '❌';
        
        showToast.success(
          `${statusEmoji} ${site.name}: ${data.check.status} (${data.check.latency}ms)`
        );
      } else {
        showToast.error(data.error || 'Failed to check site');
      }
    } catch (err) {
      showToast.error(err.message || 'Failed to check site');
    } finally {
      setCheckingSites(prev => ({ ...prev, [site.id]: false }));
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/export/sites?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sites-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast.success(`Sites exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast.error('Failed to export data');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Monitored Sites</h1>
            <p className="text-muted-foreground">Manage and monitor all your websites</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 gradient-ai text-white rounded-lg font-medium hover:opacity-90 transition-all glow-ai inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Site
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by site name or URL..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {sites.length} of {pagination.totalCount} sites
          {statusFilter !== 'all' && ` (filtered by ${statusFilter.toLowerCase()})`}
          {searchTerm && ` (searching for "${searchTerm}")`}
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
            <button onClick={fetchSites} className="ml-auto text-sm text-red-500 hover:underline">
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
          /* Sites Table */
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
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Site Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">URL</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Uptime</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Latency</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Last Check</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sites.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'No sites found matching your filters.'
                              : 'No sites found. Add your first site to get started!'}
                          </td>
                        </tr>
                      ) : (
                        sites.map((site, index) => (
                          <motion.tr
                            key={site.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusBadge(site.status)}`}></span>
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                  site.status === 'ONLINE' ? 'bg-green-500/10 text-green-500' :
                                  site.status === 'DEGRADED' ? 'bg-yellow-500/10 text-yellow-500' :
                                  site.status === 'MAINTENANCE' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                  {site.status.toLowerCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => router.push(`/sites/${site.id}`)}
                                className="font-medium text-foreground hover:text-primary transition-colors text-left"
                              >
                                {site.name}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <a
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {site.url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-foreground">
                                {site.uptime ? formatUptime(site.uptime) : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-muted-foreground">
                                {site.averageLatency ? formatResponseTime(site.averageLatency) : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-muted-foreground">
                                {site.lastChecked ? formatRelativeTime(site.lastChecked) : 'Never'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-muted-foreground">{site.region}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleCheckNow(site)}
                                  disabled={checkingSites[site.id]}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                                  title="Check Now"
                                >
                                  {checkingSites[site.id] ? (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEdit(site)}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDelete(site)}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSiteToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Site"
          message={`Are you sure you want to delete "${siteToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

        {/* Site Modal (Add/Edit) */}
        <SiteEditModal
          site={editingSite}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingSite(null);
          }}
          onUpdate={() => {
            fetchSites(); // Refresh sites list
          }}
          mode={editingSite ? 'edit' : 'add'}
        />
      </MainContent>
    </div>
  );
}
