/**
 * GET /api/v1/business-profiles/me
 * Get current user's business profile
 *
 * PUT /api/v1/business-profiles/me
 * Update current user's business profile
 *
 * @tags Business Profiles
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { updateBusinessProfileSchema } from '@/lib/validation/business-profile'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
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
          detail: 'Business profile not found. Complete onboarding to create a profile.',
        },
        { status: 404 }
      )
    }

    // Return profile
    return NextResponse.json({
      id: profile.id,
      owner_user_id: profile.owner_user_id,
      business_name: profile.business_name,
      industry: profile.industry,
      target_audience: profile.target_audience,
      brand_logo_url: profile.brand_logo_url,
      primary_color: profile.primary_color,
      secondary_color: profile.secondary_color,
      content_tone: profile.content_tone,
      content_topics: profile.content_topics,
      preferred_language: profile.preferred_language,
      posting_frequency: profile.posting_frequency,
      automation_enabled: profile.automation_enabled,
      automation_eligible_at: profile.automation_eligible_at,
      approved_posts_count: profile.approved_posts_count,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateBusinessProfileSchema.parse(body)

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

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (!existingProfile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Business profile not found. Use POST /business-profiles to create one.',
        },
        { status: 404 }
      )
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {}
    if (validatedData.name !== undefined) updateData.business_name = validatedData.name
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry
    if (validatedData.targetAudience !== undefined)
      updateData.target_audience = validatedData.targetAudience
    if (validatedData.tone !== undefined) updateData.content_tone = validatedData.tone
    if (validatedData.topics !== undefined) updateData.content_topics = validatedData.topics
    if (validatedData.language !== undefined) updateData.preferred_language = validatedData.language
    if (validatedData.logoUrl !== undefined) updateData.brand_logo_url = validatedData.logoUrl

    // Update profile
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .update(updateData)
      .eq('owner_user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log successful update
    logger.info('Business profile updated', {
      userId: user.id,
      profileId: profile.id,
      updatedFields: Object.keys(updateData),
    })

    // Return updated profile
    return NextResponse.json({
      id: profile.id,
      owner_user_id: profile.owner_user_id,
      business_name: profile.business_name,
      industry: profile.industry,
      target_audience: profile.target_audience,
      brand_logo_url: profile.brand_logo_url,
      primary_color: profile.primary_color,
      secondary_color: profile.secondary_color,
      content_tone: profile.content_tone,
      content_topics: profile.content_topics,
      preferred_language: profile.preferred_language,
      posting_frequency: profile.posting_frequency,
      automation_enabled: profile.automation_enabled,
      automation_eligible_at: profile.automation_eligible_at,
      approved_posts_count: profile.approved_posts_count,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
