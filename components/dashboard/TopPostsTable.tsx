'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'

interface TopPost {
  id: string
  caption: string
  imageUrl?: string
  platform: Platform
  likes: number
  comments: number
  shares: number
  reach: number
  engagementRate: number
  publishedAt: string
}

interface TopPostsTableProps {
  posts: TopPost[]
  onPostClick?: (postId: string) => void
}

type SortField = 'likes' | 'comments' | 'shares' | 'reach' | 'engagementRate'

const platformEmojis: Record<Platform, string> = {
  facebook: '📘',
  instagram: '📷',
  twitter: '🐦',
  linkedin: '💼',
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

export function TopPostsTable({ posts, onPostClick }: TopPostsTableProps) {
  const [sortBy, setSortBy] = useState<SortField>('engagementRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Posts</CardTitle>
        <CardDescription>Your highest-engagement content across all platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden grid-cols-12 gap-4 rounded-lg bg-muted p-3 text-sm font-medium lg:grid">
            <div className="col-span-5">Post</div>
            <div className="col-span-1 cursor-pointer" onClick={() => handleSort('likes')}>
              Likes {sortBy === 'likes' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-1 cursor-pointer" onClick={() => handleSort('comments')}>
              Comments {sortBy === 'comments' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-1 cursor-pointer" onClick={() => handleSort('shares')}>
              Shares {sortBy === 'shares' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-2 cursor-pointer" onClick={() => handleSort('reach')}>
              Reach {sortBy === 'reach' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-2 cursor-pointer" onClick={() => handleSort('engagementRate')}>
              Engagement {sortBy === 'engagementRate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
          </div>

          {/* Table Rows */}
          {sortedPosts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No posts available yet. Create and publish your first post!
            </div>
          ) : (
            sortedPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostClick?.(post.id)}
                className="grid w-full grid-cols-12 gap-4 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                {/* Post Preview */}
                <div className="col-span-12 flex items-start gap-3 lg:col-span-5">
                  {post.imageUrl && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={post.imageUrl}
                        alt="Post thumbnail"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{post.caption}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{platformEmojis[post.platform]}</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="col-span-3 flex items-center text-sm lg:col-span-1">
                  <span className="lg:hidden font-medium mr-2">Likes:</span>
                  {formatNumber(post.likes)}
                </div>
                <div className="col-span-3 flex items-center text-sm lg:col-span-1">
                  <span className="lg:hidden font-medium mr-2">Comments:</span>
                  {formatNumber(post.comments)}
                </div>
                <div className="col-span-3 flex items-center text-sm lg:col-span-1">
                  <span className="lg:hidden font-medium mr-2">Shares:</span>
                  {formatNumber(post.shares)}
                </div>
                <div className="col-span-3 flex items-center text-sm lg:col-span-2">
                  <span className="lg:hidden font-medium mr-2">Reach:</span>
                  {formatNumber(post.reach)}
                </div>
                <div className="col-span-12 flex items-center lg:col-span-2">
                  <Badge variant="secondary" className="w-full justify-center lg:w-auto">
                    {post.engagementRate.toFixed(1)}%
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
