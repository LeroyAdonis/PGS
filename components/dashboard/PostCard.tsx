'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'
type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected'

interface PostCardProps {
  id: string
  caption: string
  imageUrl?: string
  platforms: Platform[]
  status: PostStatus
  createdAt: string
  scheduledTime?: string
  onClick?: () => void
}

const platformIcons: Record<Platform, string> = {
  facebook: '📘',
  instagram: '📷',
  twitter: '🐦',
  linkedin: '💼',
}

const statusColors: Record<PostStatus, string> = {
  draft: 'bg-gray-500',
  approved: 'bg-green-500',
  scheduled: 'bg-yellow-500',
  published: 'bg-blue-500',
  rejected: 'bg-red-500',
}

const statusLabels: Record<PostStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
}

export function PostCard({
  id,
  caption,
  imageUrl,
  platforms,
  status,
  createdAt,
  scheduledTime,
  onClick,
}: PostCardProps) {
  const truncatedCaption = caption.length > 150 ? `${caption.slice(0, 150)}...` : caption
  const formattedDate = new Date(createdAt).toLocaleDateString()
  const formattedScheduledTime = scheduledTime ? new Date(scheduledTime).toLocaleString() : null

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      data-post-id={id}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {platforms.map((platform) => (
              <span key={platform} className="text-2xl" title={platform}>
                {platformIcons[platform]}
              </span>
            ))}
          </div>
          <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            <Image
              src={imageUrl}
              alt="Post image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-3">{truncatedCaption}</p>
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-muted-foreground pt-3">
        <span>Created {formattedDate}</span>
        {formattedScheduledTime && <span>Scheduled for {formattedScheduledTime}</span>}
      </CardFooter>
    </Card>
  )
}
