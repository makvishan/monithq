'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { 
  Users, 
  Globe, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  Database,
  Zap,
  Clock,
  Building2,
  Loader2,
  CreditCard,
  TrendingDown,
  Percent,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueMetrics, setRevenueMetrics] = useState(null);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard/stats?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setRevenueMetrics(data.revenueMetrics);
      setSubscriptionBreakdown(data.subscriptionBreakdown);
      setRecentUsers(data.recentUsers);
      setSystemHealth(data.systemHealth);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <div className="flex items-center justify-center h-96">
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
            <h1 className="text-3xl font-bold gradient-text">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide overview and management</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-success-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-sm text-green-500 font-medium">
                    {stats.userGrowth > 0 ? '+' : ''}{stats.userGrowth.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.totalUsers.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.activeUsers.toLocaleString()} active · {stats.newUsers} new
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Organizations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="gradient-info-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm text-blue-500 font-medium">
                    {stats.organizationGrowth > 0 ? '+' : ''}{stats.organizationGrowth.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.totalOrganizations.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.activeOrganizations.toLocaleString()} active · {stats.newOrganizations} new
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Sites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="gradient-ai-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm text-primary font-medium">
                    {stats.siteGrowth > 0 ? '+' : ''}{stats.siteGrowth.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.totalSites.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground">Monitored Sites</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.activeSites.toLocaleString()} active · {stats.newSites} new
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="gradient-warning-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  </div>
                  <span className="text-sm text-yellow-500 font-medium">
                    {stats.incidentChange > 0 ? '+' : ''}{stats.incidentChange.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.openIncidents}
                </h3>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalIncidents} total · {stats.newIncidents} new
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Card - Full Width */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="gradient-success-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</p>
                      <h3 className="text-3xl font-bold text-foreground">
                        ${(stats.monthlyRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${(stats.totalRevenue / 100).toLocaleString()} annual projection
                      </p>
                    </div>
                  </div>
                  <span className="text-lg text-green-500 font-medium">
                    +{stats.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Metrics Row */}
        {revenueMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* ARPU Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="gradient-success-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    ${(revenueMetrics.arpu / 100).toFixed(2)}
                  </h3>
                  <p className="text-sm text-muted-foreground">ARPU</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Average per paid user
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Conversion Rate Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="gradient-info-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {revenueMetrics.conversionRate.toFixed(1)}%
                  </h3>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Users on paid plans
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Churn Rate Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="gradient-warning-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {revenueMetrics.churnRate.toFixed(2)}%
                  </h3>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {revenueMetrics.canceledSubscriptions} canceled
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Paid vs Free Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="gradient-secondary-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <UserCheck className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {revenueMetrics.paidSubscriptions} / {revenueMetrics.totalSubscriptions}
                  </h3>
                  <p className="text-sm text-muted-foreground">Paid Subscribers</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {revenueMetrics.freeSubscriptions} on free plan
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Second Row: System Health & Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'good' ? 'bg-green-500' :
                          item.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-foreground">{item.metric}</p>
                          <p className="text-sm text-muted-foreground">{item.change} from last period</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">Avg Uptime</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgUptime}%</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <p className="text-sm text-muted-foreground">Avg Response</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgResponseTime}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Subscription Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.plan === 'STARTER' ? 'bg-blue-500/10 text-blue-500' :
                            item.plan === 'PRO' ? 'bg-purple-500/10 text-purple-500' :
                            item.plan === 'ENTERPRISE' ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {item.plan}
                          </span>
                          <span className="text-sm text-muted-foreground">{item.count} users</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">${item.revenue.toLocaleString()}/mo</p>
                          <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.plan === 'STARTER' ? 'bg-blue-500' :
                            item.plan === 'PRO' ? 'bg-purple-500' :
                            item.plan === 'ENTERPRISE' ? 'gradient-ai' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 gradient-ai rounded-lg glow-ai">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm opacity-90">Total MRR</p>
                        <p className="text-2xl font-bold">
                          ${subscriptionBreakdown.reduce((acc, item) => acc + item.revenue, 0).toLocaleString()}
                        </p>
                      </div>
                    <DollarSign className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent User Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{user.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.plan === 'STARTER' ? 'bg-blue-500/10 text-blue-500' :
                            user.plan === 'PRO' ? 'bg-purple-500/10 text-purple-500' :
                            user.plan === 'ENTERPRISE' ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            user.status === 'active' ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">{user.joined}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </MainContent>
    </div>
  );
}
