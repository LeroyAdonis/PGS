'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data - replace with actual data from Supabase
const mockPosts = [
    {
        id: '1',
        title: 'Exciting New Product Launch!',
        content: 'We\'re thrilled to announce our latest innovation...',
        status: 'published',
        platforms: ['facebook', 'instagram'],
        scheduledDate: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-10T09:00:00Z'
    },
    {
        id: '2',
        title: 'Customer Success Story',
        content: 'Hear from our satisfied customer about their experience...',
        status: 'scheduled',
        platforms: ['linkedin', 'twitter'],
        scheduledDate: '2024-01-20T14:00:00Z',
        createdAt: '2024-01-12T11:00:00Z'
    },
    {
        id: '3',
        title: 'Industry Insights',
        content: 'Latest trends in our industry...',
        status: 'draft',
        platforms: ['facebook'],
        scheduledDate: null,
        createdAt: '2024-01-13T16:00:00Z'
    }
]

const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
}

const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼'
}

export default function PostsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [platformFilter, setPlatformFilter] = useState('all')

    const filteredPosts = mockPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter
        const matchesPlatform = platformFilter === 'all' ||
            post.platforms.includes(platformFilter)

        return matchesSearch && matchesStatus && matchesPlatform
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
                    <p className="text-muted-foreground">
                        Manage your social media content
                    </p>
                </div>
                <Link href="/dashboard/posts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Post
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Posts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg line-clamp-2">
                                    {post.title}
                                </CardTitle>
                                <Badge className={statusColors[post.status as keyof typeof statusColors]}>
                                    {post.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                {post.platforms.map((platform) => (
                                    <span key={platform} title={platform}>
                                        {platformIcons[platform as keyof typeof platformIcons]}
                                    </span>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.content}
                            </p>

                            {post.scheduledDate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(post.scheduledDate).toLocaleDateString()} at{' '}
                                    {new Date(post.scheduledDate).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        <p className="text-lg font-medium">No posts found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                </div>
            )}
        </div>
    )
}