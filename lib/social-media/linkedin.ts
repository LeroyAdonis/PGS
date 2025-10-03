/**
 * LinkedIn Marketing API Integration
 *
 * Handles OAuth 2.0 authentication and UGC post publishing to LinkedIn.
 * Uses LinkedIn Marketing API.
 *
 * Rate Limits: 100 calls/day per application
 * OAuth Scopes: w_member_social, r_liteprofile, r_emailaddress
 */

import { z } from 'zod'

// ============================================================================
// Types & Validation
// ============================================================================

export interface LinkedInOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

export interface LinkedInPublishResult {
  platformPostId: string
  publishedAt: Date
  postUrl: string
}

export interface LinkedInAnalytics {
  likes: number
  comments: number
  shares: number
  impressions: number
  engagementRate: number
}

const PublishPostRequestSchema = z.object({
  personUrn: z.string().min(1, 'Person URN is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  text: z.string().min(1).max(3000, 'Text must be 1-3000 characters'),
  imageUrl: z.string().url().optional(),
})

type PublishPostRequest = z.infer<typeof PublishPostRequestSchema>

const GetAnalyticsRequestSchema = z.object({
  shareUrn: z.string().min(1, 'Share URN is required'),
  accessToken: z.string().min(1, 'Access token is required'),
})

type GetAnalyticsRequest = z.infer<typeof GetAnalyticsRequestSchema>

// ============================================================================
// LinkedIn API Client
// ============================================================================

const API_BASE_URL = 'https://api.linkedin.com/v2'

/**
 * Generate OAuth authorization URL
 */
export function generateOAuthUrl(config: LinkedInOAuthConfig): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'w_member_social r_liteprofile r_emailaddress',
    state: generateRandomState(),
  })

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: LinkedInOAuthConfig
): Promise<LinkedInTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  })

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `LinkedIn token exchange failed: ${error.error_description || response.statusText}`
    )
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    refresh_token_expires_in: data.refresh_token_expires_in,
  }
}

/**
 * Refresh access token
 *
 * Note: LinkedIn refresh tokens are only available for specific apps
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: LinkedInOAuthConfig
): Promise<LinkedInTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `LinkedIn token refresh failed: ${error.error_description || response.statusText}`
    )
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    refresh_token_expires_in: data.refresh_token_expires_in,
  }
}

/**
 * Get user profile URN
 */
export async function getUserProfile(
  accessToken: string
): Promise<{ personUrn: string; firstName: string; lastName: string }> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get LinkedIn profile: ${error.message || response.statusText}`)
  }

  const data = await response.json()

  return {
    personUrn: `urn:li:person:${data.id}`,
    firstName: data.localizedFirstName || '',
    lastName: data.localizedLastName || '',
  }
}

/**
 * Register image upload
 *
 * Returns upload URL and asset URN
 */
async function registerImageUpload(
  personUrn: string,
  accessToken: string
): Promise<{ uploadUrl: string; assetUrn: string }> {
  const payload = {
    registerUploadRequest: {
      owner: personUrn,
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  }

  const response = await fetch(`${API_BASE_URL}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to register image upload: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  const uploadUrl =
    data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
      .uploadUrl
  const assetUrn = data.value.asset

  return { uploadUrl, assetUrn }
}

/**
 * Upload image to LinkedIn
 */
async function uploadImage(
  uploadUrl: string,
  imageUrl: string,
  accessToken: string
): Promise<void> {
  // Download image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Failed to download image')
  }

  const imageBuffer = await imageResponse.arrayBuffer()

  // Upload to LinkedIn
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`)
  }
}

/**
 * Publish UGC post to LinkedIn
 */
export async function publishPost(request: PublishPostRequest): Promise<LinkedInPublishResult> {
  // Validate request
  const validated = PublishPostRequestSchema.parse(request)

  // Build UGC post payload
  const payload: any = {
    author: validated.personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: validated.text,
        },
        shareMediaCategory: validated.imageUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  // Handle image if provided
  if (validated.imageUrl) {
    // Register upload
    const { uploadUrl, assetUrn } = await registerImageUpload(
      validated.personUrn,
      validated.accessToken
    )

    // Upload image
    await uploadImage(uploadUrl, validated.imageUrl, validated.accessToken)

    // Add media to payload
    payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        description: {
          text: 'Image',
        },
        media: assetUrn,
        title: {
          text: 'Image',
        },
      },
    ]
  }

  // Publish post
  const response = await fetch(`${API_BASE_URL}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${validated.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`LinkedIn publish failed: ${error.message || response.statusText}`)
  }

  const shareId = response.headers.get('x-restli-id')
  if (!shareId) {
    throw new Error('LinkedIn publish succeeded but no share ID returned')
  }

  return {
    platformPostId: shareId,
    publishedAt: new Date(),
    postUrl: `https://www.linkedin.com/feed/update/${shareId}`,
  }
}

/**
 * Fetch post analytics (social actions)
 */
export async function getPostAnalytics(request: GetAnalyticsRequest): Promise<LinkedInAnalytics> {
  // Validate request
  const validated = GetAnalyticsRequestSchema.parse(request)

  // Fetch social actions
  const params = new URLSearchParams({
    q: 'ugcPost',
    ugcPost: validated.shareUrn,
  })

  const response = await fetch(`${API_BASE_URL}/socialActions?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${validated.accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to fetch LinkedIn analytics: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  const element = data.elements?.[0]

  if (!element) {
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      engagementRate: 0,
    }
  }

  const likes = element.likesSummary?.totalLikes || 0
  const comments = element.commentsSummary?.totalComments || 0
  const shares = element.sharesSummary?.totalShares || 0

  // LinkedIn doesn't provide impressions via social actions endpoint
  // Would require organization access or Statistics API
  const impressions = 0

  const engagementRate = impressions > 0 ? ((likes + comments + shares) / impressions) * 100 : 0

  return {
    likes,
    comments,
    shares,
    impressions,
    engagementRate: Math.round(engagementRate * 100) / 100,
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
