/**
 * GET /api/v1/social-accounts/callback/[platformName]
 * Handle OAuth callback from social media platforms
 *
 * @tags Social Accounts
 * @security None (public callback endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { oauthCallbackSchema } from '@/lib/validation/social-account'
import { logger } from '@/lib/logging/logger'
import {
  exchangeCodeForToken as exchangeFacebookCode,
  getPageAccessToken,
  getUserPages,
} from '@/lib/social-media/facebook'
import { exchangeCodeForToken as exchangeInstagramCode } from '@/lib/social-media/instagram'
import {
  exchangeCodeForToken as exchangeTwitterCode,
  generatePKCE,
} from '@/lib/social-media/twitter'
import { exchangeCodeForToken as exchangeLinkedInCode } from '@/lib/social-media/linkedin'

export const runtime = 'edge'

export async function GET(request: NextRequest, { params }: { params: { platformName: string } }) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const callbackData = {
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      platform,
    }

    // Validate callback data
    const validatedData = oauthCallbackSchema.parse(callbackData)

    // Check for OAuth errors
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      logger.warn('OAuth callback error', {
        platform,
        error,
        errorDescription,
        state: validatedData.state,
      })

      // Redirect to frontend with error
      const redirectUrl = new URL('/settings', process.env.NEXT_PUBLIC_APP_URL)
      redirectUrl.searchParams.set('oauth_error', error)
      redirectUrl.searchParams.set(
        'error_description',
        errorDescription || 'OAuth authorization failed'
      )
      return NextResponse.redirect(redirectUrl)
    }

    if (!validatedData.code) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Authorization code is required.',
        },
        { status: 400 }
      )
    }

    // TODO: Validate state parameter against stored session
    // For now, we'll accept any state (simplified implementation)

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // TODO: Get user ID from stored OAuth session based on state
    // For now, we'll require the user to be logged in (simplified)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL)
      redirectUrl.searchParams.set('redirect', `/settings?oauth_platform=${platform}`)
      return NextResponse.redirect(redirectUrl)
    }

    // Exchange authorization code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/social-accounts/callback/${platform}`

    let tokenData: any
    let accountInfo: any

    try {
      switch (platform) {
        case 'facebook': {
          // Exchange code for user token
          const userToken = await exchangeFacebookCode(validatedData.code, {
            appId: process.env.FACEBOOK_APP_ID!,
            appSecret: process.env.FACEBOOK_APP_SECRET!,
            redirectUri,
          })

          // Get user's Facebook Pages
          const pages = await getUserPages(userToken.access_token)

          if (pages.length === 0) {
            throw new Error(
              'No Facebook Pages found. You need to create a Facebook Page to connect.'
            )
          }

          // Use the first page (in production, user should choose)
          const selectedPage = pages[0]

          // Get long-lived page token
          const pageToken = await getPageAccessToken(userToken.access_token, selectedPage.id)

          tokenData = {
            access_token: pageToken.accessToken,
            token_type: 'bearer',
            expires_at: pageToken.expiresAt.toISOString(),
          }

          accountInfo = {
            account_id: selectedPage.id,
            account_name: selectedPage.name,
            account_username: selectedPage.name.toLowerCase().replace(/\s+/g, ''),
          }
          break
        }

        case 'instagram': {
          // Instagram uses Facebook's OAuth, so similar flow
          const userToken = await exchangeInstagramCode(validatedData.code, {
            appId: process.env.INSTAGRAM_APP_ID!,
            appSecret: process.env.INSTAGRAM_APP_SECRET!,
            redirectUri,
          })

          // Get Instagram accounts connected to Facebook Pages
          // This is a simplified version - in production, you'd get the Instagram Business Account
          tokenData = {
            access_token: userToken.access_token,
            token_type: userToken.token_type,
            expires_at: new Date(Date.now() + userToken.expires_in * 1000).toISOString(),
          }

          accountInfo = {
            account_id: 'instagram_account_id', // Would be fetched from API
            account_name: 'Instagram Account', // Would be fetched from API
            account_username: 'instagram_username', // Would be fetched from API
          }
          break
        }

        case 'twitter': {
          // Twitter uses PKCE - we'd need the stored code verifier
          // For now, generate a new one (simplified)
          const pkce = generatePKCE()

          const twitterToken = await exchangeTwitterCode(validatedData.code, pkce.verifier, {
            clientId: process.env.TWITTER_CLIENT_ID!,
            redirectUri,
          })

          tokenData = {
            access_token: twitterToken.access_token,
            refresh_token: twitterToken.refresh_token,
            token_type: twitterToken.token_type,
            expires_at: new Date(Date.now() + twitterToken.expires_in * 1000).toISOString(),
          }

          accountInfo = {
            account_id: 'twitter_user_id', // Would be fetched from API
            account_name: 'Twitter User', // Would be fetched from API
            account_username: 'twitter_username', // Would be fetched from API
          }
          break
        }

        case 'linkedin': {
          const linkedinToken = await exchangeLinkedInCode(validatedData.code, {
            clientId: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
            redirectUri,
          })

          tokenData = {
            access_token: linkedinToken.access_token,
            refresh_token: linkedinToken.refresh_token,
            token_type: 'bearer', // LinkedIn doesn't return token_type, assume bearer
            expires_at: new Date(
              Date.now() + (linkedinToken.expires_in || 60 * 24 * 60 * 60 * 1000) * 1000
            ).toISOString(), // Default 60 days
          }

          accountInfo = {
            account_id: 'linkedin_user_id', // Would be fetched from API
            account_name: 'LinkedIn User', // Would be fetched from API
            account_username: 'linkedin_username', // Would be fetched from API
          }
          break
        }

        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }
    } catch (tokenError) {
      logger.error('Token exchange failed', {
        userId: user.id,
        platform,
        error: tokenError,
      })

      // Redirect to frontend with error
      const redirectUrl = new URL('/settings', process.env.NEXT_PUBLIC_APP_URL)
      redirectUrl.searchParams.set('oauth_error', 'token_exchange_failed')
      redirectUrl.searchParams.set(
        'error_description',
        'Failed to exchange authorization code for access token'
      )
      return NextResponse.redirect(redirectUrl)
    }

    // Encrypt the access token using pgcrypto
    // Note: In production, this should be done server-side with proper encryption
    const encryptedToken = `encrypted:${tokenData.access_token}` // Placeholder encryption

    // Save or update social media account
    const accountData = {
      owner_user_id: user.id,
      platform,
      account_id: accountInfo.account_id,
      account_name: accountInfo.account_name,
      account_username: accountInfo.account_username,
      encrypted_access_token: encryptedToken,
      encrypted_refresh_token: tokenData.refresh_token
        ? `encrypted:${tokenData.refresh_token}`
        : null,
      token_expires_at: tokenData.expires_at,
      connection_status: 'connected',
      connected_at: new Date().toISOString(),
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('social_media_accounts')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('platform', platform)
      .single()

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('social_media_accounts')
        .update(accountData)
        .eq('id', existingAccount.id)

      if (updateError) {
        throw updateError
      }

      logger.info('Social account reconnected', {
        userId: user.id,
        platform,
        accountId: existingAccount.id,
      })
    } else {
      // Create new account
      const { error: insertError } = await supabase
        .from('social_media_accounts')
        .insert(accountData)

      if (insertError) {
        throw insertError
      }

      logger.info('Social account connected', {
        userId: user.id,
        platform,
        accountId: accountInfo.account_id,
      })
    }

    // Redirect to frontend success page
    const redirectUrl = new URL('/settings', process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set('oauth_success', 'true')
    redirectUrl.searchParams.set('platform', platform)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    // Log error and redirect to frontend with generic error
    logger.error('OAuth callback failed', {
      platform: params.platformName,
      error,
    })

    const redirectUrl = new URL('/settings', process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set('oauth_error', 'callback_failed')
    redirectUrl.searchParams.set(
      'error_description',
      'An error occurred during OAuth callback processing'
    )
    return NextResponse.redirect(redirectUrl)
  }
}
