'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EngagementDataPoint {
  date: string
  likes: number
  comments: number
  shares: number
  reach: number
}

interface AnalyticsChartProps {
  data: EngagementDataPoint[]
  title?: string
}

type DateRange = '7d' | '30d' | '90d' | 'all'

const dateRangeLabels: Record<DateRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  all: 'All Time',
}

export function AnalyticsChart({ data, title = 'Engagement Over Time' }: AnalyticsChartProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'likes' | 'comments' | 'shares' | 'reach'>(
    'likes'
  )

  // Filter data by date range
  const getFilteredData = () => {
    if (selectedRange === 'all') return data

    const now = new Date()
    const days = parseInt(selectedRange)
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return data.filter((point) => new Date(point.date) >= cutoffDate)
  }

  const filteredData = getFilteredData()

  const metricColors: Record<string, string> = {
    likes: '#3b82f6', // blue
    comments: '#10b981', // green
    shares: '#f59e0b', // yellow
    reach: '#8b5cf6', // purple
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{title}</CardTitle>

          <div className="flex flex-wrap gap-2">
            {/* Date Range Selector */}
            {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
              >
                {dateRangeLabels[range]}
              </Button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 pt-2">
          {(['likes', 'comments', 'shares', 'reach'] as const).map((metric) => (
            <Button
              key={metric}
              variant={selectedMetric === metric ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMetric(metric)}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[400px] w-full">
          {filteredData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metricColors[selectedMetric]}
                  strokeWidth={2}
                  dot={{ fill: metricColors[selectedMetric] }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
