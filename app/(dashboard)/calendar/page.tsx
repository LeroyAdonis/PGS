'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data - replace with actual data from Supabase
const mockScheduledPosts = [
  {
    id: '1',
    title: 'Product Launch Announcement',
    content: 'Exciting news coming soon...',
    platforms: ['facebook', 'instagram'],
    scheduledDate: '2024-01-20T10:00:00Z',
    status: 'scheduled',
  },
  {
    id: '2',
    title: 'Customer Success Story',
    content: 'How our client achieved 300% growth...',
    platforms: ['linkedin'],
    scheduledDate: '2024-01-22T14:00:00Z',
    status: 'scheduled',
  },
  {
    id: '3',
    title: 'Industry Insights',
    content: 'Latest trends in digital marketing...',
    platforms: ['twitter', 'facebook'],
    scheduledDate: '2024-01-25T09:00:00Z',
    status: 'scheduled',
  },
]

const platformColors = {
  facebook: 'bg-blue-100 text-blue-800',
  instagram: 'bg-pink-100 text-pink-800',
  twitter: 'bg-gray-100 text-gray-800',
  linkedin: 'bg-blue-100 text-blue-800',
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getPostsForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return mockScheduledPosts.filter((post) => post.scheduledDate.startsWith(dateString))
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage your social media content</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const postsForDay = day ? getPostsForDate(day) : []

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    day ? 'bg-background hover:bg-muted/50' : 'bg-muted/20'
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium mb-2">{day}</div>
                      <div className="space-y-1">
                        {postsForDay.map((post) => (
                          <div
                            key={post.id}
                            className="text-xs p-1 rounded bg-primary/10 border border-primary/20"
                          >
                            <div className="font-medium truncate">{post.title}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(post.scheduledDate).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {post.platforms.slice(0, 2).map((platform) => (
                                <Badge
                                  key={platform}
                                  variant="secondary"
                                  className={`text-xs px-1 py-0 ${platformColors[platform as keyof typeof platformColors]}`}
                                >
                                  {platform.charAt(0).toUpperCase()}
                                </Badge>
                              ))}
                              {post.platforms.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  +{post.platforms.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockScheduledPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{post.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(post.scheduledDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {post.platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="secondary"
                      className={platformColors[platform as keyof typeof platformColors]}
                    >
                      {platform.charAt(0).toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
