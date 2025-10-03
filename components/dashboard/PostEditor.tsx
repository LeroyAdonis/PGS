'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePostSchema, type UpdatePostInput } from '@/lib/validation/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/hooks/use-toast'

type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'

interface PostEditorProps {
  postId: string
  initialCaption: string
  initialHashtags: string[]
  initialPlatforms: Platform[]
  initialImageUrl?: string
  onSave?: (updatedPost: UpdatePostInput) => void
  onCancel?: () => void
}

const platformLabels: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
}

export function PostEditor({
  postId,
  initialCaption,
  initialHashtags,
  initialPlatforms,
  initialImageUrl,
  onSave,
  onCancel,
}: PostEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set(initialPlatforms)
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      caption: initialCaption,
      hashtags: initialHashtags,
      platforms: initialPlatforms,
      imageUrl: initialImageUrl,
    },
  })

  const caption = watch('caption')
  const hashtags = watch('hashtags')

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(platform)) {
        newSet.delete(platform)
      } else {
        newSet.add(platform)
      }
      return newSet
    })
  }

  const onSubmit = async (data: UpdatePostInput) => {
    setIsLoading(true)

    try {
      const platforms = Array.from(selectedPlatforms)
      if (platforms.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select at least one platform',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          platforms,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update post')
      }

      toast({
        title: 'Post Updated',
        description: 'Your changes have been saved successfully.',
      })

      onSave?.({ ...data, platforms })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Textarea
          id="caption"
          placeholder="Enter post caption..."
          rows={6}
          {...register('caption')}
          disabled={isLoading}
          className="resize-none"
        />
        {errors.caption && <p className="text-sm text-destructive">{errors.caption.message}</p>}
        <p className="text-xs text-muted-foreground">{caption?.length || 0} / 3000 characters</p>
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
        <Input
          id="hashtags"
          placeholder="marketing, socialmedia, business"
          {...register('hashtags', {
            setValueAs: (value: string) =>
              value
                .split(',')
                .map((tag) => tag.trim().replace(/^#/, ''))
                .filter(Boolean),
          })}
          disabled={isLoading}
        />
        {errors.hashtags && <p className="text-sm text-destructive">{errors.hashtags.message}</p>}
        <p className="text-xs text-muted-foreground">{hashtags?.length || 0} hashtags</p>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <Label>Target Platforms</Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(platformLabels) as Platform[]).map((platform) => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={platform}
                checked={selectedPlatforms.has(platform)}
                onCheckedChange={() => togglePlatform(platform)}
                disabled={isLoading}
              />
              <Label htmlFor={platform} className="cursor-pointer">
                {platformLabels[platform]}
              </Label>
            </div>
          ))}
        </div>
        {selectedPlatforms.size === 0 && (
          <p className="text-sm text-destructive">At least one platform is required</p>
        )}
      </div>

      {/* Image URL (optional) */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://example.com/image.jpg"
          {...register('imageUrl')}
          disabled={isLoading}
        />
        {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
