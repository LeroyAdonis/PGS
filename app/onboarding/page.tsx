'use client'

import * as React from 'react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
  const handleComplete = () => {
    // Here we would save the business profile to the database
    // Redirect will be handled by the wizard
  }

  return <OnboardingWizard onComplete={handleComplete} />
}
