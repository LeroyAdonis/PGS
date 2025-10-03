'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Image as ImageIcon, Calendar, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'

const platforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-500' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' }
]

export default function NewPostPage() {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [formData, setFormData] = useState({
        topic: '',
        tone: 'professional',
        language: 'en',
        platforms: [] as string[],
        content: '',
        scheduledDate: '',
        scheduledTime: '',
        includeImage: false
    })

    const handleGenerateContent = async () => {
        if (!formData.topic.trim()) {
            toast({
                title: 'Topic required',
                description: 'Please enter a topic for your post.',
                variant: 'destructive'
            })
            return
        }

        setIsGenerating(true)
        try {
            // TODO: Integrate with Gemini API for content generation
            // For now, simulate generation
            await new Promise(resolve => setTimeout(resolve, 2000))

            const generatedContent = `🚀 Exciting news! We're diving deep into ${formData.topic} and can't wait to share our insights with you.

What makes this topic so fascinating is the way it connects with current trends in our industry. Our team has been working tirelessly to bring you the most up-to-date information and practical advice.

Stay tuned for more updates! #Innovation #BusinessGrowth`

            setFormData(prev => ({ ...prev, content: generatedContent }))

            toast({
                title: 'Content generated!',
                description: 'Your post content has been created successfully.'
            })
        } catch (error) {
            toast({
                title: 'Generation failed',
                description: 'Failed to generate content. Please try again.',
                variant: 'destructive'
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGenerateImage = async () => {
        // TODO: Integrate with Gemini API for image generation
        toast({
            title: 'Image generation',
            description: 'Image generation will be available soon!'
        })
    }

    const handlePublish = async () => {
        if (!formData.content.trim()) {
            toast({
                title: 'Content required',
                description: 'Please generate or enter post content.',
                variant: 'destructive'
            })
            return
        }

        if (formData.platforms.length === 0) {
            toast({
                title: 'Platforms required',
                description: 'Please select at least one platform to publish to.',
                variant: 'destructive'
            })
            return
        }

        setIsPublishing(true)
        try {
            // TODO: Integrate with social media APIs for publishing
            await new Promise(resolve => setTimeout(resolve, 3000))

            toast({
                title: 'Post published!',
                description: 'Your post has been successfully published.'
            })

            router.push('/dashboard/posts')
        } catch (error) {
            toast({
                title: 'Publishing failed',
                description: 'Failed to publish post. Please try again.',
                variant: 'destructive'
            })
        } finally {
            setIsPublishing(false)
        }
    }

    const handleSchedule = async () => {
        if (!formData.scheduledDate || !formData.scheduledTime) {
            toast({
                title: 'Schedule date required',
                description: 'Please select a date and time to schedule the post.',
                variant: 'destructive'
            })
            return
        }

        // TODO: Save as scheduled post
        toast({
            title: 'Post scheduled!',
            description: 'Your post has been scheduled for publishing.'
        })

        router.push('/dashboard/posts')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/posts">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Posts
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
                    <p className="text-muted-foreground">
                        Generate AI-powered content for your social media
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Topic Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                AI Content Generation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic or Idea</Label>
                                <Textarea
                                    id="topic"
                                    placeholder="Describe what you want to post about..."
                                    value={formData.topic}
                                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tone">Tone</Label>
                                    <Select
                                        value={formData.tone}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="casual">Casual</SelectItem>
                                            <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                            <SelectItem value="educational">Educational</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="af">Afrikaans</SelectItem>
                                            <SelectItem value="zu">Zulu</SelectItem>
                                            <SelectItem value="xh">Xhosa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateContent}
                                disabled={isGenerating || !formData.topic.trim()}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                        Generating Content...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Content
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Generated Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Post Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Your generated content will appear here..."
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                rows={8}
                            />

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeImage"
                                    checked={formData.includeImage}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, includeImage: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="includeImage" className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Include AI-generated image
                                </Label>
                            </div>

                            {formData.includeImage && (
                                <Button
                                    variant="outline"
                                    onClick={handleGenerateImage}
                                    className="w-full"
                                >
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Generate Image
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Platform Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Platforms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {platforms.map((platform) => (
                                <div key={platform.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={platform.id}
                                        checked={formData.platforms.includes(platform.id)}
                                        onCheckedChange={(checked) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                platforms: checked
                                                    ? [...prev.platforms, platform.id]
                                                    : prev.platforms.filter(p => p !== platform.id)
                                            }))
                                        }}
                                    />
                                    <Label htmlFor={platform.id} className="flex items-center gap-2 flex-1">
                                        <span className="text-lg">{platform.icon}</span>
                                        <span>{platform.name}</span>
                                    </Label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Scheduling */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Schedule Post
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={handlePublish}
                                disabled={isPublishing || !formData.content.trim() || formData.platforms.length === 0}
                                className="w-full"
                            >
                                {isPublishing ? (
                                    <>
                                        <Send className="mr-2 h-4 w-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Publish Now
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleSchedule}
                                disabled={!formData.content.trim() || !formData.scheduledDate || !formData.scheduledTime}
                                className="w-full"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule Post
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}