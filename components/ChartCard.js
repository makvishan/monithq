'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartCard({ title, description, data, dataKey, type = 'line', color = '#6366f1' }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">
            {dataKey === 'uptime' && `${payload[0].value.toFixed(2)}%`}
            {dataKey === 'responseTime' && `${payload[0].value.toFixed(0)}ms`}
            {!dataKey && payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${dataKey})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
