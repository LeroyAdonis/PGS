'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected'

interface CalendarPostProps {
  id: string
  caption: string
  status: PostStatus
  scheduledTime?: string
  onClick?: () => void
}

const statusColors: Record<PostStatus, string> = {
  draft: 'bg-gray-500',
  approved: 'bg-blue-500',
  scheduled: 'bg-yellow-500',
  published: 'bg-green-500',
  rejected: 'bg-red-500',
}

const statusLabels: Record<PostStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
}

export function CalendarPost({ id, caption, status, scheduledTime, onClick }: CalendarPostProps) {
  const truncatedCaption = caption.length > 80 ? `${caption.slice(0, 80)}...` : caption
  const time = scheduledTime ? new Date(scheduledTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-md border bg-card p-2 text-left transition-colors hover:bg-muted',
        'space-y-1'
      )}
      data-post-id={id}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge className={cn('text-xs', statusColors[status])}>{statusLabels[status]}</Badge>
        {time && <span className="text-xs text-muted-foreground">{time}</span>}
      </div>

      <p className="text-xs line-clamp-2">{truncatedCaption}</p>
    </button>
  )
}
