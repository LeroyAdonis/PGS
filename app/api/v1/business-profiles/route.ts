/**
 * POST /api/v1/business-profiles
 * Create new business profile (onboarding step)
 *
 * @tags Business Profiles
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createBusinessProfileSchema } from '@/lib/validation/business-profile'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createBusinessProfileSchema.parse(body)

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // Check if user already has a business profile
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/conflict',
          title: 'Conflict',
          status: 409,
          detail: 'User already has a business profile. Use PUT /business-profiles/me to update.',
        },
        { status: 409 }
      )
    }

    // Create business profile
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .insert({
        owner_user_id: user.id,
        business_name: validatedData.name,
        industry: validatedData.industry,
        target_audience: validatedData.targetAudience,
        content_tone: validatedData.tone,
        content_topics: validatedData.topics,
        preferred_language: validatedData.language,
        brand_logo_url: validatedData.logoUrl || null,
        automation_enabled: false,
        approved_posts_count: 0,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log successful profile creation
    logger.info('Business profile created', {
      userId: user.id,
      profileId: profile.id,
      businessName: validatedData.name,
    })

    // Return created profile
    return NextResponse.json(
      {
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
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error, request.url)
  }
}
