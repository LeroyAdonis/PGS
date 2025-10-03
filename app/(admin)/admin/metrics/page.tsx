'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/lib/hooks/use-toast'

interface PlatformMetrics {
  user_metrics: {
    total_users: number
    active_users: number
    suspended_users: number
    admin_users: number
  }
  subscription_metrics: {
    total_subscriptions: number
    active_subscriptions: number
    trial_subscriptions: number
    cancelled_subscriptions: number
    starter_tier: number
    growth_tier: number
    enterprise_tier: number
  }
  post_metrics: {
    total_posts: number
    published_posts: number
    scheduled_posts: number
    draft_posts: number
  }
  revenue_metrics: {
    total_revenue: number
    monthly_revenue: number
    average_revenue_per_user: number
  }
  engagement_metrics: {
    total_likes: number
    total_comments: number
    total_shares: number
    average_engagement_rate: number
  }
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/admin/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load platform metrics',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading metrics...</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Failed to load metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Metrics</h1>
        <p className="text-muted-foreground">System-wide analytics and statistics</p>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">User Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.user_metrics.total_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.user_metrics.active_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.user_metrics.suspended_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.user_metrics.admin_users}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subscription Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Subscription Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.subscription_metrics.total_subscriptions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.subscription_metrics.active_subscriptions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.subscription_metrics.trial_subscriptions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.subscription_metrics.cancelled_subscriptions}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Content Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.post_metrics.total_posts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.post_metrics.published_posts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.post_metrics.scheduled_posts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.post_metrics.draft_posts}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Revenue Statistics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{metrics.revenue_metrics.total_revenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{metrics.revenue_metrics.monthly_revenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue per User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{metrics.revenue_metrics.average_revenue_per_user.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Engagement Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.engagement_metrics.total_likes.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.engagement_metrics.total_comments.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.engagement_metrics.total_shares.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.engagement_metrics.average_engagement_rate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
