'use client'

import { useState } from 'react'
import { ProgressBar } from './ProgressBar'
import { Step1BusinessProfile } from './Step1BusinessProfile'
import { Step2SocialConnect } from './Step2SocialConnect'
import { type CreateBusinessProfileInput } from '@/lib/validation/business-profile'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STEPS = [
    { id: 1, title: 'Business Profile', description: 'Tell us about your business' },
    { id: 2, title: 'Social Media', description: 'Connect your accounts' },
]

interface OnboardingWizardProps {
    onComplete?: (businessProfile: CreateBusinessProfileInput) => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [businessProfile, setBusinessProfile] = useState<Partial<CreateBusinessProfileInput>>({})
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)
    const [profileCreationError, setProfileCreationError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
            window.location.href = '/login'
        }
    }

    const handleStep1Next = async (data: CreateBusinessProfileInput) => {
        setIsCreatingProfile(true)
        setProfileCreationError(null)

        try {
            const response = await fetch('/api/v1/business-profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to create business profile')
            }

            const profile = await response.json()
            setBusinessProfile(data)
            setBusinessProfileId(profile.id)
            setCurrentStep(2)
        } catch (error) {
            console.error('Error creating business profile:', error)
            setProfileCreationError(error instanceof Error ? error.message : 'An unexpected error occurred')
        } finally {
            setIsCreatingProfile(false)
        }
    }

    const handleStep2Next = () => {
        // Here we would typically save the business profile and connected accounts
        // For now, we'll just redirect to the dashboard
        if (onComplete) {
            onComplete(businessProfile as CreateBusinessProfileInput)
        } else {
            router.push('/dashboard')
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header with logout button */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>

                    <div className="mb-8">
                        <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />
                    </div>

                    <div className="bg-card rounded-lg border p-8 shadow-sm">
                        {currentStep === 1 && (
                            <Step1BusinessProfile
                                onNext={handleStep1Next}
                                initialData={businessProfile}
                                isLoading={isCreatingProfile}
                                error={profileCreationError}
                            />
                        )}

                        {currentStep === 2 && (
                            <Step2SocialConnect
                                onNext={handleStep2Next}
                                onBack={handleBack}
                                businessProfileId={businessProfileId}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}