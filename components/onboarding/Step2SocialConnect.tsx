'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Facebook, Instagram, Twitter, Linkedin, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

interface Step2SocialConnectProps {
    onNext: () => void
    onBack: () => void
    businessProfileId: string | null
}

interface PlatformStatus {
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
    name: string
    icon: React.ComponentType<{ className?: string }>
    connected: boolean
    description: string
    connecting: boolean
}

export function Step2SocialConnect({ onNext, onBack, businessProfileId }: Step2SocialConnectProps) {
    const [platforms, setPlatforms] = useState<PlatformStatus[]>([
        {
            platform: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            connected: false,
            connecting: false,
            description: 'Connect your Facebook pages to publish posts and track engagement.',
        },
        {
            platform: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            connected: false,
            connecting: false,
            description: 'Link your Instagram business account for seamless content publishing.',
        },
        {
            platform: 'twitter',
            name: 'X (Twitter)',
            icon: Twitter,
            connected: false,
            connecting: false,
            description: 'Connect your Twitter account to share posts and monitor conversations.',
        },
        {
            platform: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            connected: false,
            connecting: false,
            description: 'Connect your LinkedIn page for professional content distribution.',
        },
    ])
    const { toast } = useToast()

    const handleConnect = async (platform: string) => {
        // Update state to show connecting
        setPlatforms(prev =>
            prev.map(p =>
                p.platform === platform ? { ...p, connecting: true } : p
            )
        )

        try {
            const response = await fetch(`/api/v1/social-accounts/connect/${platform}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessProfileId,
                    redirectUri: `${window.location.origin}/onboarding`,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                // Redirect to OAuth URL
                window.location.href = data.oauth_url
            } else {
                const error = await response.json()
                toast({
                    title: 'Connection Failed',
                    description: error.detail || 'Failed to initiate connection',
                    variant: 'destructive',
                })
                // Reset connecting state
                setPlatforms(prev =>
                    prev.map(p =>
                        p.platform === platform ? { ...p, connecting: false } : p
                    )
                )
            }
        } catch (error) {
            console.error('Connection error:', error)
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            })
            // Reset connecting state
            setPlatforms(prev =>
                prev.map(p =>
                    p.platform === platform ? { ...p, connecting: false } : p
                )
            )
        }
    }

    const connectedCount = platforms.filter(p => p.connected).length
    const canProceed = connectedCount > 0

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Connect Your Social Media Accounts</h2>
                <p className="text-muted-foreground mt-2">
                    Link your social media accounts to start publishing content automatically.
                    You can connect more accounts later in your settings.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {platforms.map((platform) => {
                    const IconComponent = platform.icon
                    return (
                        <Card key={platform.platform} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <IconComponent className="h-6 w-6" />
                                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                                    </div>
                                    {platform.connected ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <CardDescription>{platform.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => handleConnect(platform.platform)}
                                    disabled={platform.connected || platform.connecting}
                                    className="w-full"
                                    variant={platform.connected ? 'secondary' : 'default'}
                                >
                                    {platform.connecting
                                        ? 'Connecting...'
                                        : platform.connected
                                            ? 'Connected'
                                            : 'Connect Account'}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">
                        {connectedCount} of {platforms.length} platforms connected
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {canProceed
                        ? "Great! You're ready to start creating content. You can connect more platforms later."
                        : "Please connect at least one social media account to continue."
                    }
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed} className="flex-1">
                    Complete Setup
                </Button>
            </div>
        </div>
    )
}