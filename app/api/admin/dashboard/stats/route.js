import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

// GET /api/admin/dashboard/stats - Get admin dashboard statistics
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Check if user is super admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for time range
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Parallel queries for better performance
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalOrganizations,
      activeOrganizations,
      newOrganizations,
      totalSites,
      activeSites,
      newSites,
      totalIncidents,
      openIncidents,
      newIncidents,
      subscriptions,
      recentUsers,
      planStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // New users in time range
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Total organizations
      prisma.organization.count(),
      
      // Active organizations (with active subscription or has sites)
      prisma.organization.count({
        where: {
          OR: [
            {
              subscription: {
                status: 'ACTIVE',
              },
            },
            {
              sites: {
                some: {},
              },
            },
          ],
        },
      }),
      
      // New organizations in time range
      prisma.organization.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Total sites
      prisma.site.count(),
      
      // Active sites (enabled)
      prisma.site.count({
        where: {
          enabled: true,
        },
      }),
      
      // New sites in time range
      prisma.site.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Total incidents
      prisma.incident.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Open incidents (not resolved)
      prisma.incident.count({
        where: {
          status: {
            not: 'RESOLVED',
          },
        },
      }),
      
      // New incidents in time range
      prisma.incident.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Active subscriptions
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          organization: true,
        },
      }),
      
      // Recent users (last 10)
      prisma.user.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          organization: {
            include: {
              subscription: true,
            },
          },
        },
      }),
      
      // Plan statistics
      prisma.subscription.groupBy({
        by: ['plan'],
        where: {
          status: 'ACTIVE',
        },
        _count: {
          plan: true,
        },
      }),
    ]);

    // Calculate subscription breakdown with revenue
    const planPrices = {
      'FREE': 0,
      'STARTER': 2900, // in cents
      'PRO': 7900,
      'ENTERPRISE': 29900,
    };

    const subscriptionBreakdown = planStats.map(stat => {
      const planName = stat.plan;
      const count = stat._count.plan;
      const price = planPrices[planName] || 0;
      const revenue = count * price;
      
      return {
        plan: planName,
        count,
        revenue,
        percentage: 0, // Will calculate after
      };
    });

    // Calculate percentages
    const totalActiveSubscriptions = subscriptionBreakdown.reduce((sum, item) => sum + item.count, 0);
    subscriptionBreakdown.forEach(item => {
      item.percentage = totalActiveSubscriptions > 0 
        ? parseFloat(((item.count / totalActiveSubscriptions) * 100).toFixed(1))
        : 0;
    });

    // Calculate total revenue
    const monthlyRevenue = subscriptionBreakdown.reduce((sum, item) => sum + item.revenue, 0);
    const annualRevenue = monthlyRevenue * 12;
    
    // Calculate revenue metrics
    const paidSubscriptions = subscriptionBreakdown.filter(item => item.plan !== 'FREE');
    const paidSubscriptionCount = paidSubscriptions.reduce((sum, item) => sum + item.count, 0);
    const freeSubscriptionCount = subscriptionBreakdown.find(item => item.plan === 'FREE')?.count || 0;
    const conversionRate = totalActiveSubscriptions > 0 
      ? parseFloat(((paidSubscriptionCount / totalActiveSubscriptions) * 100).toFixed(1))
      : 0;
    
    // Calculate ARPU (Average Revenue Per User) - only paid users
    const arpu = paidSubscriptionCount > 0 
      ? Math.round(monthlyRevenue / paidSubscriptionCount)
      : 0;
    
    // Get subscription growth data (comparing to previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));
    
    const [previousPeriodSubscriptions, subscriptionsInPeriod, canceledInPeriod] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            lt: startDate,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: 'CANCELED',
          updatedAt: {
            gte: startDate,
          },
        },
      }),
    ]);
    
    const churnRate = totalActiveSubscriptions > 0
      ? parseFloat(((canceledInPeriod / totalActiveSubscriptions) * 100).toFixed(2))
      : 0;
    
    // Calculate growth percentages (comparing to previous period)
    // For simplicity, using random growth for now - you can implement real comparison
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    // Calculate average uptime (from sites)
    const uptimeChecks = await prisma.siteCheck.findMany({
      where: {
        checkedAt: {
          gte: startDate,
        },
      },
      select: {
        status: true,
      },
    });

    const totalChecks = uptimeChecks.length;
    const successfulChecks = uptimeChecks.filter(check => check.status === 'ONLINE').length;
    const avgUptime = totalChecks > 0 
      ? parseFloat(((successfulChecks / totalChecks) * 100).toFixed(2))
      : 100;

    // Calculate average response time
    const responseTimeChecks = await prisma.siteCheck.findMany({
      where: {
        checkedAt: {
          gte: startDate,
        },
        responseTime: {
          gt: 0,
        },
      },
      select: {
        responseTime: true,
      },
    });

    const avgResponseTime = responseTimeChecks.length > 0
      ? Math.round(
          responseTimeChecks.reduce((sum, check) => sum + (check.responseTime || 0), 0) / 
          responseTimeChecks.length
        )
      : 0;

    // Format recent users
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.organization?.subscription?.plan || 'FREE',
      status: user.status ? user.status.toLowerCase() : 'active',
      joined: formatTimeAgo(user.createdAt),
    }));

    // System health metrics
    const errorRate = totalChecks > 0
      ? parseFloat((((totalChecks - successfulChecks) / totalChecks) * 100).toFixed(2))
      : 0;

    const systemHealth = [
      {
        metric: 'API Response Time',
        value: `${avgResponseTime}ms`,
        status: avgResponseTime < 500 ? 'good' : avgResponseTime < 1000 ? 'warning' : 'critical',
        change: '+2%', // Calculate from previous period
      },
      {
        metric: 'Database Load',
        value: '45%', // Would need server metrics
        status: 'good',
        change: '+2%',
      },
      {
        metric: 'Error Rate',
        value: `${errorRate}%`,
        status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical',
        change: '-0.01%',
      },
      {
        metric: 'Memory Usage',
        value: '68%', // Would need server metrics
        status: 'warning',
        change: '+8%',
      },
    ];

    // Return dashboard stats
    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        newUsers,
        userGrowth: calculateGrowth(totalUsers, totalUsers - newUsers),
        
        totalOrganizations,
        activeOrganizations,
        newOrganizations,
        organizationGrowth: calculateGrowth(totalOrganizations, totalOrganizations - newOrganizations),
        
        totalSites,
        activeSites,
        newSites,
        siteGrowth: calculateGrowth(totalSites, totalSites - newSites),
        
        totalIncidents,
        openIncidents,
        newIncidents,
        incidentChange: calculateGrowth(totalIncidents, Math.max(1, totalIncidents - newIncidents)),
        
        monthlyRevenue,
        annualRevenue,
        revenueGrowth: 23.4, // Would calculate from previous period
        
        avgUptime,
        avgResponseTime,
      },
      revenueMetrics: {
        totalSubscriptions: totalActiveSubscriptions,
        paidSubscriptions: paidSubscriptionCount,
        freeSubscriptions: freeSubscriptionCount,
        conversionRate,
        arpu,
        churnRate,
        newSubscriptions: subscriptionsInPeriod,
        canceledSubscriptions: canceledInPeriod,
      },
      subscriptionBreakdown,
      recentUsers: formattedRecentUsers,
      systemHealth,
      timeRange,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}
