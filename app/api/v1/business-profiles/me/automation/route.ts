/**
 * PUT /api/v1/business-profiles/me/automation
 * Toggle automatic posting (requires 10 approved posts + 14 days active)
 *
 * @tags Business Profiles
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { toggleAutomationSchema } from '@/lib/validation/business-profile'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = toggleAutomationSchema.parse(body)

    // Initialize Supabase client

    const supabase = createRouteClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required.',
        },
        { status: 401 }
      )
    }

    // Fetch business profile
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('owner_user_id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Business profile not found.',
        },
        { status: 404 }
      )
    }

    // If enabling automation, check eligibility
    if (validatedData.enabled) {
      // Check if profile has 10+ approved posts
      if (profile.approved_posts_count < 10) {
        return NextResponse.json(
          {
            type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: `Automation requires at least 10 approved posts. You currently have ${profile.approved_posts_count}.`,
            current_approved_posts: profile.approved_posts_count,
            required_approved_posts: 10,
          },
          { status: 403 }
        )
      }

      // Check if profile is at least 14 days old
      const profileCreatedAt = new Date(profile.created_at)
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      if (profileCreatedAt > fourteenDaysAgo) {
        const daysActive = Math.floor(
          (Date.now() - profileCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        return NextResponse.json(
          {
            type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: `Automation requires at least 14 days of active usage. You have been active for ${daysActive} days.`,
            days_active: daysActive,
            required_days: 14,
          },
          { status: 403 }
        )
      }
    }

    // Update automation status
    const { data: updatedProfile, error: updateError } = await supabase
      .from('business_profiles')
      .update({
        automation_enabled: validatedData.enabled,
        automation_eligible_at: validatedData.enabled
          ? new Date().toISOString()
          : profile.automation_eligible_at,
      })
      .eq('owner_user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log automation toggle
    logger.info('Automation toggled', {
      userId: user.id,
      profileId: profile.id,
      enabled: validatedData.enabled,
    })

    // Return updated profile
    return NextResponse.json({
      id: updatedProfile.id,
      owner_user_id: updatedProfile.owner_user_id,
      business_name: updatedProfile.business_name,
      industry: updatedProfile.industry,
      target_audience: updatedProfile.target_audience,
      brand_logo_url: updatedProfile.brand_logo_url,
      primary_color: updatedProfile.primary_color,
      secondary_color: updatedProfile.secondary_color,
      content_tone: updatedProfile.content_tone,
      content_topics: updatedProfile.content_topics,
      preferred_language: updatedProfile.preferred_language,
      posting_frequency: updatedProfile.posting_frequency,
      automation_enabled: updatedProfile.automation_enabled,
      automation_eligible_at: updatedProfile.automation_eligible_at,
      approved_posts_count: updatedProfile.approved_posts_count,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at,
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
