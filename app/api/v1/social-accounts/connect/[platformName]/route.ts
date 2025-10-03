/**
 * POST /api/v1/social-accounts/connect/[platformName]
 * Initiate OAuth connection for social media platform
 *
 * @tags Social Accounts
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { connectSocialAccountSchema } from '@/lib/validation/social-account'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { generateOAuthUrl as generateFacebookOAuthUrl } from '@/lib/social-media/facebook'
import { generateOAuthUrl as generateInstagramOAuthUrl } from '@/lib/social-media/instagram'
import {
  generateOAuthUrl as generateTwitterOAuthUrl,
  generatePKCE,
} from '@/lib/social-media/twitter'
import { generateOAuthUrl as generateLinkedInOAuthUrl } from '@/lib/social-media/linkedin'

export const runtime = 'edge'

export async function POST(request: NextRequest, { params }: { params: { platformName: string } }) {
  try {
    const platform = params.platformName

    // Validate platform
    if (!['facebook', 'instagram', 'twitter', 'linkedin'].includes(platform)) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid platform. Supported platforms: facebook, instagram, twitter, linkedin.',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = connectSocialAccountSchema.parse({
      ...body,
      platform,
    })

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

    // Check if user has a business profile
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/precondition-failed',
          title: 'Precondition Failed',
          status: 412,
          detail: 'Business profile required. Complete onboarding first.',
        },
        { status: 412 }
      )
    }

    // Check subscription tier limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const tier = subscription?.tier || 'starter'
    const tierLimits = {
      starter: 2,
      growth: 4,
      enterprise: 4,
    }

    // Count existing connected accounts
    const { count: connectedCount } = await supabase
      .from('social_media_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', user.id)
      .eq('connection_status', 'connected')

    if ((connectedCount || 0) >= tierLimits[tier as keyof typeof tierLimits]) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: `Tier limit reached. ${tier} tier allows ${tierLimits[tier as keyof typeof tierLimits]} connected accounts.`,
        },
        { status: 403 }
      )
    }

    // Check if platform already connected
    const { data: existingAccount } = await supabase
      .from('social_media_accounts')
      .select('id, connection_status')
      .eq('owner_user_id', user.id)
      .eq('platform', platform)
      .single()

    if (existingAccount && existingAccount.connection_status === 'connected') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/conflict',
          title: 'Conflict',
          status: 409,
          detail: `${platform} account already connected.`,
        },
        { status: 409 }
      )
    }

    // Generate OAuth URL based on platform
    const redirectUri =
      validatedData.redirectUri ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/social-accounts/callback/${platform}`

    let oauthUrl: string
    let pkceData: { verifier: string; challenge: string } | undefined

    switch (platform) {
      case 'facebook':
        oauthUrl = generateFacebookOAuthUrl({
          appId: process.env.FACEBOOK_APP_ID!,
          appSecret: process.env.FACEBOOK_APP_SECRET!,
          redirectUri,
        })
        break

      case 'instagram':
        oauthUrl = generateInstagramOAuthUrl({
          appId: process.env.INSTAGRAM_APP_ID!,
          appSecret: process.env.INSTAGRAM_APP_SECRET!,
          redirectUri,
        })
        break

      case 'twitter':
        pkceData = generatePKCE()
        oauthUrl = generateTwitterOAuthUrl(
          {
            clientId: process.env.TWITTER_CLIENT_ID!,
            redirectUri,
          },
          pkceData.challenge
        )
        break

      case 'linkedin':
        oauthUrl = generateLinkedInOAuthUrl({
          clientId: process.env.LINKEDIN_CLIENT_ID!,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirectUri,
        })
        break

      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Generate state for CSRF protection
    const state = generateRandomState()

    // TODO: Store state and PKCE data in database/cache for callback validation
    // For now, we'll rely on the state parameter being returned to the callback

    // Log OAuth initiation
    logger.info('OAuth flow initiated', {
      userId: user.id,
      platform,
      redirectUri,
    })

    // Return OAuth URL and state
    return NextResponse.json({
      oauth_url: oauthUrl,
      state,
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}

// Generate random state for OAuth CSRF protection
function generateRandomState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
