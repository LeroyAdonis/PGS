/**
 * Instagram Graph API Integration
 *
 * Handles OAuth authentication and content publishing to Instagram Business accounts.
 * Uses Instagram Graph API (via Facebook).
 *
 * Rate Limits: 200 calls/hour per user
 * OAuth Scopes: instagram_basic, instagram_content_publish
 */

import { z } from 'zod'

// ============================================================================
// Types & Validation
// ============================================================================

export interface InstagramOAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

export interface InstagramTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface InstagramPublishResult {
  platformPostId: string
  publishedAt: Date
  postUrl: string
}

export interface InstagramInsights {
  likes: number
  comments: number
  saves: number
  reach: number
  engagementRate: number
}

const PublishPostRequestSchema = z.object({
  instagramAccountId: z.string().min(1, 'Instagram account ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  caption: z.string().max(2200, 'Caption must be max 2200 characters'),
  imageUrl: z.string().url('Valid image URL is required'),
})

type PublishPostRequest = z.infer<typeof PublishPostRequestSchema>

const GetInsightsRequestSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
})

type GetInsightsRequest = z.infer<typeof GetInsightsRequestSchema>

// ============================================================================
// Instagram Graph API Client
// ============================================================================

const GRAPH_API_VERSION = 'v18.0'
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * Generate OAuth authorization URL for Instagram Login
 *
 * Instagram OAuth uses Facebook Login with Instagram-specific scopes
 */
export function generateOAuthUrl(config: InstagramOAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: 'instagram_basic,instagram_content_publish',
    response_type: 'code',
    state: generateRandomState(),
  })

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: InstagramOAuthConfig
): Promise<InstagramTokenResponse> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  })

  const response = await fetch(`${GRAPH_API_BASE_URL}/oauth/access_token?${params.toString()}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Instagram token exchange failed: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    expires_in: data.expires_in || 5184000, // Default to 60 days
  }
}

/**
 * Get Instagram Business Account ID from Facebook Page
 */
export async function getInstagramAccountId(pageId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to get Instagram account: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()

  if (!data.instagram_business_account) {
    throw new Error('No Instagram Business Account linked to this Facebook Page')
  }

  return data.instagram_business_account.id
}

/**
 * Publish post to Instagram (two-step process)
 *
 * Step 1: Create media container
 * Step 2: Publish media container
 */
export async function publishPost(request: PublishPostRequest): Promise<InstagramPublishResult> {
  // Validate request
  const validated = PublishPostRequestSchema.parse(request)

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    image_url: validated.imageUrl,
    caption: validated.caption,
    access_token: validated.accessToken,
  })

  const containerResponse = await fetch(
    `${GRAPH_API_BASE_URL}/${validated.instagramAccountId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: containerParams.toString(),
    }
  )

  if (!containerResponse.ok) {
    const error = await containerResponse.json()
    throw new Error(
      `Instagram media container creation failed: ${error.error?.message || containerResponse.statusText}`
    )
  }

  const containerData = await containerResponse.json()
  const containerId = containerData.id

  // Wait for media processing (Instagram requires delay)
  await delay(2000) // 2 seconds

  // Step 2: Publish media container
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: validated.accessToken,
  })

  const publishResponse = await fetch(
    `${GRAPH_API_BASE_URL}/${validated.instagramAccountId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: publishParams.toString(),
    }
  )

  if (!publishResponse.ok) {
    const error = await publishResponse.json()
    throw new Error(
      `Instagram media publish failed: ${error.error?.message || publishResponse.statusText}`
    )
  }

  const publishData = await publishResponse.json()
  const mediaId = publishData.id

  // Get Instagram username for post URL
  const accountResponse = await fetch(
    `${GRAPH_API_BASE_URL}/${validated.instagramAccountId}?fields=username&access_token=${validated.accessToken}`,
    { method: 'GET' }
  )

  if (accountResponse.ok) {
    // const accountData = await accountResponse.json()
    // username = accountData.username // Not used in current implementation
  }

  return {
    platformPostId: mediaId,
    publishedAt: new Date(),
    postUrl: `https://www.instagram.com/p/${mediaId}`, // Note: This is a placeholder, actual short code requires additional API call
  }
}

/**
 * Fetch media insights (analytics)
 *
 * Note: Insights are only available 24 hours after publishing
 */
export async function getMediaInsights(request: GetInsightsRequest): Promise<InstagramInsights> {
  // Validate request
  const validated = GetInsightsRequestSchema.parse(request)

  // Fetch media insights
  const metricsEndpoint = `${GRAPH_API_BASE_URL}/${validated.mediaId}/insights?metric=likes,comments,saved,reach,engagement&access_token=${validated.accessToken}`

  const response = await fetch(metricsEndpoint)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Failed to fetch Instagram insights: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()

  // Parse insights data
  const insights = data.data || []
  const likes = insights.find((i: any) => i.name === 'likes')?.values?.[0]?.value || 0
  const comments = insights.find((i: any) => i.name === 'comments')?.values?.[0]?.value || 0
  const saves = insights.find((i: any) => i.name === 'saved')?.values?.[0]?.value || 0
  const reach = insights.find((i: any) => i.name === 'reach')?.values?.[0]?.value || 0
  const engagement = insights.find((i: any) => i.name === 'engagement')?.values?.[0]?.value || 0

  const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0

  return {
    likes,
    comments,
    saves,
    reach,
    engagementRate: Math.round(engagementRate * 100) / 100,
  }
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  config: InstagramOAuthConfig
): Promise<InstagramTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: config.appSecret,
    access_token: shortLivedToken,
  })

  const response = await fetch(`${GRAPH_API_BASE_URL}/access_token?${params.toString()}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to exchange token: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    token_type: 'bearer',
    expires_in: data.expires_in || 5184000,
  }
}

/**
 * Refresh long-lived token (before expiration)
 */
export async function refreshAccessToken(longLivedToken: string): Promise<InstagramTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: longLivedToken,
  })

  const response = await fetch(`${GRAPH_API_BASE_URL}/refresh_access_token?${params.toString()}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    token_type: 'bearer',
    expires_in: data.expires_in || 5184000,
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate random state parameter for OAuth (CSRF protection)
 */
function generateRandomState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Delay utility for media processing
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
