'use client'

import { cn } from '@/lib/utils'
import type { CalendarPost } from './ContentCalendar'

interface CalendarDayProps {
  date: Date
  posts: CalendarPost[]
  isToday: boolean
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  published: 'bg-green-500',
  scheduled: 'bg-yellow-500',
  approved: 'bg-blue-500',
  draft: 'bg-gray-500',
  rejected: 'bg-red-500',
}

export function CalendarDay({ date, posts, isToday, onClick }: CalendarDayProps) {
  const dayNumber = date.getDate()
  const hasEvents = posts.length > 0

  // Count posts by status
  const statusCounts = posts.reduce(
    (acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square w-full rounded-lg border p-1 text-left transition-colors hover:bg-muted',
        isToday && 'border-primary border-2 bg-primary/5',
        hasEvents && 'cursor-pointer',
        !hasEvents && 'cursor-default'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Day number */}
        <span
          className={cn(
            'text-sm font-medium',
            isToday && 'text-primary',
            !isToday && 'text-foreground'
          )}
        >
          {dayNumber}
        </span>

        {/* Post indicators */}
        {hasEvents && (
          <div className="mt-auto space-y-1">
            {/* Status dots */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-0.5">
                  <div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
                  {count > 1 && <span className="text-xs text-muted-foreground">{count}</span>}
                </div>
              ))}
            </div>

            {/* Post count badge */}
            <div className="text-xs font-medium text-muted-foreground">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
