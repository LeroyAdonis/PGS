'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/hooks/use-toast'

interface PostActionsProps {
  postId: string
  postStatus: string
  onActionComplete?: () => void
}

export function PostActions({ postId, postStatus, onActionComplete }: PostActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')

  const handleApprove = async () => {
    if (postStatus !== 'draft') {
      toast({
        title: 'Invalid Action',
        description: 'Only draft posts can be approved',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/posts/${postId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to approve post')
      }

      toast({
        title: 'Post Approved',
        description: 'The post has been approved successfully.',
      })

      onActionComplete?.()
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (postStatus !== 'draft' && postStatus !== 'approved') {
      toast({
        title: 'Invalid Action',
        description: 'Only draft or approved posts can be rejected',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by user' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to reject post')
      }

      toast({
        title: 'Post Rejected',
        description: 'The post has been rejected.',
      })

      onActionComplete?.()
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateImage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/posts/${postId}/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePrompt: imagePrompt || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to regenerate image')
      }

      toast({
        title: 'Image Regenerated',
        description: 'A new image has been generated for this post.',
      })

      setShowRegenerateDialog(false)
      setImagePrompt('')
      onActionComplete?.()
    } catch (error) {
      toast({
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {postStatus === 'draft' && (
          <>
            <Button onClick={handleApprove} disabled={isLoading} variant="default" size="sm">
              Approve
            </Button>
            <Button onClick={handleReject} disabled={isLoading} variant="destructive" size="sm">
              Reject
            </Button>
          </>
        )}

        {postStatus === 'approved' && (
          <Button onClick={handleReject} disabled={isLoading} variant="outline" size="sm">
            Unapprove
          </Button>
        )}

        {(postStatus === 'draft' || postStatus === 'approved') && (
          <Button
            onClick={() => setShowRegenerateDialog(true)}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Regenerate Image
          </Button>
        )}
      </div>

      {/* Regenerate Image Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Image</DialogTitle>
            <DialogDescription>
              Provide an optional custom prompt to generate a new image, or leave blank to use the
              caption.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="imagePrompt">Image Prompt (optional)</Label>
            <Input
              id="imagePrompt"
              placeholder="A vibrant sunset over the ocean..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to generate from post caption
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerateImage} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
