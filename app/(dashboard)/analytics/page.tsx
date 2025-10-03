'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Eye, Heart, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Mock data - replace with actual data from Supabase
const mockAnalytics = {
  overview: {
    totalPosts: 24,
    totalReach: 12543,
    totalEngagement: 892,
    avgEngagementRate: 7.1,
  },
  platformStats: [
    {
      platform: 'Facebook',
      posts: 8,
      reach: 5421,
      engagement: 234,
      engagementRate: 4.3,
    },
    {
      platform: 'Instagram',
      posts: 6,
      reach: 3892,
      engagement: 345,
      engagementRate: 8.9,
    },
    {
      platform: 'Twitter',
      posts: 5,
      reach: 2156,
      engagement: 156,
      engagementRate: 7.2,
    },
    {
      platform: 'LinkedIn',
      posts: 5,
      reach: 1074,
      engagement: 157,
      engagementRate: 14.6,
    },
  ],
  topPosts: [
    {
      id: '1',
      title: 'Exciting Product Launch!',
      platform: 'Instagram',
      reach: 2341,
      engagement: 156,
      engagementRate: 6.7,
      publishedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Customer Success Story',
      platform: 'LinkedIn',
      reach: 892,
      engagement: 89,
      engagementRate: 10.0,
      publishedAt: '2024-01-12T14:00:00Z',
    },
    {
      id: '3',
      title: 'Industry Insights',
      platform: 'Facebook',
      reach: 1456,
      engagement: 67,
      engagementRate: 4.6,
      publishedAt: '2024-01-10T09:00:00Z',
    },
  ],
  engagementTrends: [
    { date: '2024-01-01', reach: 1200, engagement: 85 },
    { date: '2024-01-02', reach: 1350, engagement: 92 },
    { date: '2024-01-03', reach: 1180, engagement: 78 },
    { date: '2024-01-04', reach: 1420, engagement: 105 },
    { date: '2024-01-05', reach: 1580, engagement: 118 },
    { date: '2024-01-06', reach: 1650, engagement: 125 },
    { date: '2024-01-07', reach: 1720, engagement: 132 },
  ],
}

const platformColors = {
  Facebook: 'bg-blue-500',
  Instagram: 'bg-pink-500',
  Twitter: 'bg-gray-500',
  LinkedIn: 'bg-blue-700',
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your social media performance and engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.totalPosts}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAnalytics.overview.totalReach.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.totalEngagement}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.overview.avgEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.platformStats.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${platformColors[platform.platform as keyof typeof platformColors]}`}
                  />
                  <div>
                    <h4 className="font-medium">{platform.platform}</h4>
                    <p className="text-sm text-muted-foreground">{platform.posts} posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{platform.reach.toLocaleString()} reach</div>
                  <div className="text-sm text-muted-foreground">
                    {platform.engagement} engagements
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {platform.engagementRate}% rate
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium line-clamp-1">{post.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{post.platform}</Badge>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{post.reach.toLocaleString()} reach</div>
                  <div className="text-sm text-muted-foreground">{post.engagement} engagements</div>
                  <Badge variant="secondary" className="mt-1">
                    {post.engagementRate}% rate
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engagement Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.engagementTrends.map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="font-medium">{day.reach.toLocaleString()}</div>
                    <div className="text-muted-foreground">reach</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{day.engagement}</div>
                    <div className="text-muted-foreground">engagements</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
