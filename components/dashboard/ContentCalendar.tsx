'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarDay } from './CalendarDay'

type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected'

export interface CalendarPost {
  id: string
  caption: string
  status: PostStatus
  scheduledTime?: string
  publishedAt?: string
}

interface ContentCalendarProps {
  posts: CalendarPost[]
  onDayClick?: (date: Date, posts: CalendarPost[]) => void
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function ContentCalendar({ posts, onDayClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Group posts by date
  const postsByDate = posts.reduce(
    (acc, post) => {
      const dateStr = post.scheduledTime || post.publishedAt
      if (!dateStr) return acc

      const date = new Date(dateStr)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(post)

      return acc
    },
    {} as Record<string, CalendarPost[]>
  )

  // Generate calendar grid
  const calendarDays: (Date | null)[] = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            ←
          </Button>
          <h2 className="text-xl font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            →
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square p-1" />
          }

          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          const dayPosts = postsByDate[dateKey] || []
          const isToday = isSameDay(date, new Date())

          return (
            <CalendarDay
              key={dateKey}
              date={date}
              posts={dayPosts}
              isToday={isToday}
              onClick={() => onDayClick?.(date, dayPosts)}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-500" />
          <span>Draft</span>
        </div>
      </div>
    </div>
  )
}
