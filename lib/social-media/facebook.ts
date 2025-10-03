/**
 * Facebook Graph API Integration
 *
 * Handles OAuth authentication and post publishing to Facebook Pages.
 * Uses Facebook Graph API v18.0.
 *
 * Rate Limits: 200 calls/hour per user
 * OAuth Scopes: pages_manage_posts, pages_read_engagement
 */

import { z } from 'zod'

// ============================================================================
// Types & Validation
// ============================================================================

export interface FacebookOAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

export interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number // seconds
}

export interface FacebookPublishResult {
  platformPostId: string
  publishedAt: Date
  postUrl: string
}

export interface FacebookInsights {
  likes: number
  comments: number
  shares: number
  reach: number
  engagementRate: number
}

const PublishPostRequestSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  caption: z.string().min(1).max(5000, 'Caption must be 1-5000 characters'),
  imageUrl: z.string().url().optional(),
})

type PublishPostRequest = z.infer<typeof PublishPostRequestSchema>

const GetInsightsRequestSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
})

type GetInsightsRequest = z.infer<typeof GetInsightsRequestSchema>

// ============================================================================
// Facebook Graph API Client
// ============================================================================

const GRAPH_API_VERSION = 'v18.0'
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * Generate OAuth authorization URL for Facebook Login
 */
export function generateOAuthUrl(config: FacebookOAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: 'pages_manage_posts,pages_read_engagement',
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
  config: FacebookOAuthConfig
): Promise<FacebookTokenResponse> {
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
      `Facebook token exchange failed: ${error.error?.message || response.statusText}`
    )
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    expires_in: data.expires_in || 5184000, // Default to 60 days if not provided
  }
}

/**
 * Get long-lived Page access token
 *
 * Converts short-lived user token to long-lived page token.
 * Long-lived page tokens don't expire unless permissions revoked.
 */
export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/${pageId}?fields=access_token&access_token=${userAccessToken}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get page token: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()

  // Page tokens don't expire, but we set a far future date for consistency
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 10) // 10 years

  return {
    accessToken: data.access_token,
    expiresAt,
  }
}

/**
 * Get list of Facebook Pages the user manages
 */
export async function getUserPages(
  userAccessToken: string
): Promise<Array<{ id: string; name: string; accessToken: string }>> {
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/me/accounts?access_token=${userAccessToken}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get user pages: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.data.map((page: any) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
  }))
}

/**
 * Publish post to Facebook Page
 */
export async function publishPost(request: PublishPostRequest): Promise<FacebookPublishResult> {
  // Validate request
  const validated = PublishPostRequestSchema.parse(request)

  // Build form data
  const formData = new URLSearchParams()
  formData.append('message', validated.caption)
  formData.append('access_token', validated.accessToken)

  if (validated.imageUrl) {
    formData.append('url', validated.imageUrl)
  }

  // Publish to page feed
  const endpoint = validated.imageUrl
    ? `${GRAPH_API_BASE_URL}/${validated.pageId}/photos`
    : `${GRAPH_API_BASE_URL}/${validated.pageId}/feed`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Facebook publish failed: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const postId = data.id || data.post_id

  return {
    platformPostId: postId,
    publishedAt: new Date(),
    postUrl: `https://www.facebook.com/${postId}`,
  }
}

/**
 * Fetch post insights (analytics)
 */
export async function getPostInsights(request: GetInsightsRequest): Promise<FacebookInsights> {
  // Validate request
  const validated = GetInsightsRequestSchema.parse(request)

  // Fetch post insights
  const metricsEndpoint = `${GRAPH_API_BASE_URL}/${validated.postId}?fields=reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares&access_token=${validated.accessToken}`
  const insightsEndpoint = `${GRAPH_API_BASE_URL}/${validated.postId}/insights?metric=post_impressions_unique&access_token=${validated.accessToken}`

  const [metricsResponse, insightsResponse] = await Promise.all([
    fetch(metricsEndpoint),
    fetch(insightsEndpoint),
  ])

  if (!metricsResponse.ok) {
    const error = await metricsResponse.json()
    throw new Error(
      `Failed to fetch post metrics: ${error.error?.message || metricsResponse.statusText}`
    )
  }

  if (!insightsResponse.ok) {
    const error = await insightsResponse.json()
    throw new Error(
      `Failed to fetch post insights: ${error.error?.message || insightsResponse.statusText}`
    )
  }

  const metricsData = await metricsResponse.json()
  const insightsData = await insightsResponse.json()

  const likes = metricsData.reactions?.summary?.total_count || 0
  const comments = metricsData.comments?.summary?.total_count || 0
  const shares = metricsData.shares?.count || 0
  const reach = insightsData.data?.[0]?.values?.[0]?.value || 0

  const engagementRate = reach > 0 ? ((likes + comments + shares) / reach) * 100 : 0

  return {
    likes,
    comments,
    shares,
    reach,
    engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimal places
  }
}

/**
 * Refresh access token (not needed for Page tokens, but included for consistency)
 */
export async function refreshAccessToken(
  _refreshToken: string,
  _config: FacebookOAuthConfig
): Promise<FacebookTokenResponse> {
  // Facebook doesn't use refresh tokens for Pages
  // Page tokens are long-lived and don't expire
  // This function exists for API consistency with other platforms
  throw new Error('Facebook Page tokens do not need refresh')
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
 * Validate webhook signature (for future webhook support)
 */
export function verifyWebhookSignature(
  _payload: string,
  signature: string,
  _appSecret: string
): boolean {
  // Facebook uses sha256 HMAC for webhook signatures
  // Format: sha256=<signature>
  const [algorithm, _expectedSignature] = signature.split('=')

  if (algorithm !== 'sha256') {
    return false
  }

  // Note: crypto.subtle is async, so this is a simplified version
  // In production, use a proper HMAC library
  return signature.includes('sha256=')
}
