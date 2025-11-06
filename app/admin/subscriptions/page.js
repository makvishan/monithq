'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { adminAPI } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  CreditCard, 
  Search, 
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Loader2
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, planFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (planFilter !== 'all') filters.plan = planFilter;
      const data = await adminAPI.getSubscriptions(filters);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = (sub.organization?.name && sub.organization.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    pastDue: subscriptions.filter(s => s.status === 'PAST_DUE').length,
    canceled: subscriptions.filter(s => s.status === 'CANCELED').length,
    mrr: subscriptions
      .filter(s => s.status === 'ACTIVE')
      .reduce((acc, s) => {
        const planAmounts = { FREE: 0, STARTER: 10, PRO: 50, ENTERPRISE: 100 };
        return acc + (planAmounts[s.plan] || 0);
      }, 0),
  };

  const handleCancelSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    if (selectedSubscription) {
      console.log('Canceling subscription:', selectedSubscription.id);
      setShowCancelDialog(false);
      setSelectedSubscription(null);
    }
  };

  const handleRefund = (subscription) => {
    setSelectedSubscription(subscription);
    setShowRefundDialog(true);
  };

  const confirmRefund = () => {
    if (selectedSubscription) {
      console.log('Refunding subscription:', selectedSubscription.id);
      setShowRefundDialog(false);
      setSelectedSubscription(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MainContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
    
            <div>
              <h1 className="text-3xl font-bold gradient-text">Subscription Management</h1>
              <p className="text-muted-foreground">Monitor and manage all subscriptions</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
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
            <button onClick={fetchSubscriptions} className="ml-auto text-sm text-red-500 hover:underline">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary" />
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
            <Card className="gradient-success-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
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
            <Card className="gradient-warning-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Past Due</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pastDue}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
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
            <Card className="gradient-danger-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Canceled</p>
                    <p className="text-2xl font-bold text-foreground">{stats.canceled}</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="gradient-ai-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">MRR</p>
                    <p className="text-2xl font-bold text-foreground">${stats.mrr}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
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
                  placeholder="Search by user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Billing</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Next Billing</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Payment Method</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{sub.user}</p>
                            <p className="text-sm text-muted-foreground">{sub.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.plan === 'Starter' ? 'bg-blue-500/10 text-blue-500' :
                            sub.plan === 'Professional' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-500'
                          }`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">${sub.amount}/mo</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground capitalize">{sub.billingCycle}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            sub.status === 'active' ? 'bg-green-500/10 text-green-500' :
                            sub.status === 'past_due' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{sub.nextBilling}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{sub.paymentMethod}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRefund(sub.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Issue Refund"
                            >
                              <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            {sub.status === 'active' && (
                              <button
                                onClick={() => handleCancelSubscription(sub)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Cancel Subscription"
                              >
                                <XCircle className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}

        {/* Cancel Subscription Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showCancelDialog}
          onClose={() => {
            setShowCancelDialog(false);
            setSelectedSubscription(null);
          }}
          onConfirm={confirmCancel}
          title="Cancel Subscription"
          message={`Are you sure you want to cancel the subscription for "${selectedSubscription?.organization?.name}"? This action will affect their access to premium features.`}
          confirmText="Cancel Subscription"
          cancelText="Keep Active"
          variant="warning"
        />

        {/* Refund Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showRefundDialog}
          onClose={() => {
            setShowRefundDialog(false);
            setSelectedSubscription(null);
          }}
          onConfirm={confirmRefund}
          title="Issue Refund"
          message={`Are you sure you want to issue a refund for "${selectedSubscription?.organization?.name}"? This action cannot be undone.`}
          confirmText="Issue Refund"
          cancelText="Cancel"
          variant="warning"
        />
      </MainContent>
    </div>
  );
}
