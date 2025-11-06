'use client';

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { getStatusBadge, formatUptime, formatResponseTime, formatRelativeTime } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SiteStatusCard({ site }) {
  return (
    <Card hover className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusBadge(site.status)}`}></span>
              {site.name}
            </CardTitle>
            <Link
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
            >
              {site.url}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
            site.status === 'online' ? 'bg-green-500/10 text-green-500' :
            site.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-500' :
            site.status === 'maintenance' ? 'bg-blue-500/10 text-blue-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {site.status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Uptime</p>
            <p className="text-lg font-semibold text-foreground">{formatUptime(site.uptime)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Response Time</p>
            <p className="text-lg font-semibold text-foreground">{formatResponseTime(site.averageLatency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Check</p>
            <p className="text-sm font-medium text-foreground">{formatRelativeTime(site.lastChecked)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Region: <span className="text-foreground font-medium">{site.region}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
