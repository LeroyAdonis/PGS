'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Facebook, Instagram, Twitter, Linkedin, Plus, Trash2, CheckCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

interface SocialAccount {
    id: string
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
    account_name: string
    account_username: string
    connection_status: 'connected' | 'disconnected' | 'error'
    connected_at: string | null
}

const platformConfig = {
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: 'bg-blue-500',
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: 'bg-pink-500',
    },
    twitter: {
        name: 'X (Twitter)',
        icon: Twitter,
        color: 'bg-black',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'bg-blue-600',
    },
}

export default function SettingsPage() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)
    const { toast } = useToast()

    // Load social accounts
    useEffect(() => {
        loadSocialAccounts()
    }, [])

    const loadSocialAccounts = async () => {
        try {
            const response = await fetch('/api/v1/social-accounts')
            if (response.ok) {
                const data = await response.json()
                setAccounts(data.accounts || [])
            }
        } catch (error) {
            console.error('Failed to load social accounts:', error)
            toast({
                title: 'Error',
                description: 'Failed to load social accounts',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (platform: string) => {
        setConnecting(platform)
        try {
            const response = await fetch(`/api/v1/social-accounts/connect/${platform}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    redirectUri: `${window.location.origin}/settings`,
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
            }
        } catch (error) {
            console.error('Connection error:', error)
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            })
        } finally {
            setConnecting(null)
        }
    }

    const handleDisconnect = async (accountId: string, platform: string) => {
        try {
            const response = await fetch(`/api/v1/social-accounts/${accountId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setAccounts(prev => prev.filter(acc => acc.id !== accountId))
                toast({
                    title: 'Disconnected',
                    description: `${platformConfig[platform as keyof typeof platformConfig].name} account disconnected successfully`,
                })
            } else {
                const error = await response.json()
                toast({
                    title: 'Disconnection Failed',
                    description: error.detail || 'Failed to disconnect account',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            console.error('Disconnection error:', error)
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            })
        }
    }

    // Check for OAuth callback parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)

        if (urlParams.get('oauth_success') === 'true') {
            const platform = urlParams.get('platform')
            toast({
                title: 'Connected!',
                description: `${platformConfig[platform as keyof typeof platformConfig]?.name || platform} account connected successfully`,
            })
            // Reload accounts
            loadSocialAccounts()
            // Clean up URL
            window.history.replaceState({}, '', '/settings')
        } else if (urlParams.get('oauth_error')) {
            const error = urlParams.get('error_description') || 'OAuth connection failed'
            toast({
                title: 'Connection Failed',
                description: error,
                variant: 'destructive',
            })
            // Clean up URL
            window.history.replaceState({}, '', '/settings')
        }
    }, [toast])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600 mt-1">Manage your account and social media connections.</p>
                    </div>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account and social media connections.</p>
                </div>
            </div>

            {/* Social Media Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle>Social Media Accounts</CardTitle>
                    <CardDescription>
                        Connect your social media accounts to publish content automatically.
                        You can connect up to {accounts.filter(acc => acc.connection_status === 'connected').length}/4 accounts on your current plan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Connected Accounts */}
                    {accounts.filter(acc => acc.connection_status === 'connected').length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium">Connected Accounts</h3>
                            {accounts
                                .filter(acc => acc.connection_status === 'connected')
                                .map((account) => {
                                    const config = platformConfig[account.platform]
                                    const IconComponent = config.icon
                                    return (
                                        <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${config.color}`}>
                                                    <IconComponent className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{account.account_name}</div>
                                                    <div className="text-sm text-gray-600">@{account.account_username}</div>
                                                </div>
                                                <Badge variant="secondary" className="ml-2">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDisconnect(account.id, account.platform)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Disconnect
                                            </Button>
                                        </div>
                                    )
                                })}
                        </div>
                    )}

                    {/* Available Platforms */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium">Available Platforms</h3>
                        {Object.entries(platformConfig).map(([platform, config]) => {
                            const IconComponent = config.icon
                            const isConnected = accounts.some(
                                acc => acc.platform === platform && acc.connection_status === 'connected'
                            )
                            const isConnecting = connecting === platform

                            return (
                                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${config.color}`}>
                                            <IconComponent className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{config.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {isConnected ? 'Already connected' : 'Connect your account'}
                                            </div>
                                        </div>
                                        {isConnected && (
                                            <Badge variant="secondary">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Connected
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => handleConnect(platform)}
                                        disabled={isConnected || isConnecting}
                                        variant={isConnected ? 'secondary' : 'default'}
                                    >
                                        {isConnecting ? (
                                            'Connecting...'
                                        ) : isConnected ? (
                                            'Connected'
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Connect
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and billing information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium">Subscription Plan</div>
                                <div className="text-sm text-gray-600">Manage your billing and upgrade your plan</div>
                            </div>
                            <Button variant="outline">Manage Subscription</Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium">Business Profile</div>
                                <div className="text-sm text-gray-600">Update your business information and preferences</div>
                            </div>
                            <Button variant="outline">Edit Profile</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}