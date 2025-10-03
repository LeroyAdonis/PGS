'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCard {
  title: string
  value: number
  change: number // percentage change from previous period
  format?: 'number' | 'percentage'
  icon?: string
}

interface AnalyticsSummaryProps {
  metrics: MetricCard[]
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

function formatChange(change: number, format: 'number' | 'percentage' = 'number'): string {
  const sign = change > 0 ? '+' : ''
  if (format === 'percentage') {
    return `${sign}${change.toFixed(1)}%`
  }
  return `${sign}${change.toFixed(0)}%`
}

export function AnalyticsSummary({ metrics }: AnalyticsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon && <span className="text-2xl">{metric.icon}</span>}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.format === 'percentage'
                ? `${metric.value.toFixed(1)}%`
                : formatNumber(metric.value)}
            </div>
            <p
              className={cn(
                'text-xs',
                metric.change > 0 && 'text-green-600',
                metric.change < 0 && 'text-red-600',
                metric.change === 0 && 'text-muted-foreground'
              )}
            >
              {metric.change === 0 ? (
                'No change from last period'
              ) : (
                <>
                  {formatChange(metric.change, metric.format)} from last period
                </>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
