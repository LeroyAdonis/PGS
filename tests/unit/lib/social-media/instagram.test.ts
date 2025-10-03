/**
 * Unit Tests: Instagram Graph API Integration
 *
 * Tests OAuth flows, two-step publishing, and analytics fetching.
 */

import {
  generateOAuthUrl,
  exchangeCodeForToken,
  getInstagramAccountId,
  publishPost,
  getMediaInsights,
  exchangeForLongLivedToken,
  refreshAccessToken,
} from '@/lib/social-media/instagram'

// ============================================================================
// Mock Setup
// ============================================================================

global.fetch = jest.fn()
global.crypto = {
  getRandomValues: jest.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
} as any

const mockConfig = {
  appId: 'test-app-id',
  appSecret: 'test-app-secret',
  redirectUri: 'https://example.com/callback',
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// OAuth Flow Tests
// ============================================================================

describe('generateOAuthUrl', () => {
  it('should generate valid OAuth URL with Instagram scopes', () => {
    const url = generateOAuthUrl(mockConfig)

    expect(url).toContain('https://www.facebook.com/v18.0/dialog/oauth')
    expect(url).toContain(`client_id=${mockConfig.appId}`)
    expect(url).toContain('scope=instagram_basic%2Cinstagram_content_publish')
    expect(url).toContain('state=')
  })
})

describe('exchangeCodeForToken', () => {
  it('should exchange authorization code for access token', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      token_type: 'bearer',
      expires_in: 5184000,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await exchangeCodeForToken('test-code', mockConfig)

    expect(result).toEqual(mockResponse)
  })

  it('should throw error if token exchange fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error: { message: 'Invalid authorization code' },
      }),
    })

    await expect(exchangeCodeForToken('invalid-code', mockConfig)).rejects.toThrow(
      'Instagram token exchange failed: Invalid authorization code'
    )
  })
})

describe('getInstagramAccountId', () => {
  it('should retrieve Instagram Business Account ID from Facebook Page', async () => {
    const mockResponse = {
      instagram_business_account: {
        id: 'instagram-account-id',
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getInstagramAccountId('page-id', 'access-token')

    expect(result).toBe('instagram-account-id')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page-id?fields=instagram_business_account'),
      expect.any(Object)
    )
  })

  it('should throw error if no Instagram account linked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No instagram_business_account field
    })

    await expect(getInstagramAccountId('page-id', 'token')).rejects.toThrow(
      'No Instagram Business Account linked to this Facebook Page'
    )
  })

  it('should throw error if request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({
        error: { message: 'Page not found' },
      }),
    })

    await expect(getInstagramAccountId('invalid-page', 'token')).rejects.toThrow(
      'Failed to get Instagram account: Page not found'
    )
  })
})

// ============================================================================
// Post Publishing Tests
// ============================================================================

describe('publishPost', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should publish post successfully (two-step process)', async () => {
    // Mock container creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'container-id' }),
    })

    // Mock publish
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'media-id' }),
    })

    // Mock account username fetch
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser' }),
    })

    const publishPromise = publishPost({
      instagramAccountId: 'ig-account-id',
      accessToken: 'token',
      caption: 'Test post',
      imageUrl: 'https://example.com/image.jpg',
    })

    // Fast-forward through delay
    jest.advanceTimersByTime(2000)

    const result = await publishPromise

    expect(result.platformPostId).toBe('media-id')
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(global.fetch).toHaveBeenCalledTimes(3)

    // Verify container creation call
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/ig-account-id/media'),
      expect.objectContaining({ method: 'POST' })
    )

    // Verify publish call
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/media_publish'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should throw validation error for missing image URL', async () => {
    await expect(
      publishPost({
        instagramAccountId: 'ig-account-id',
        accessToken: 'token',
        caption: 'Test',
        imageUrl: '',
      })
    ).rejects.toThrow()
  })

  it('should throw validation error for caption exceeding 2200 characters', async () => {
    await expect(
      publishPost({
        instagramAccountId: 'ig-account-id',
        accessToken: 'token',
        caption: 'A'.repeat(2201),
        imageUrl: 'https://example.com/image.jpg',
      })
    ).rejects.toThrow('Caption must be max 2200 characters')
  })

  it('should throw error if container creation fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error: { message: 'Invalid image URL' },
      }),
    })

    await expect(
      publishPost({
        instagramAccountId: 'ig-account-id',
        accessToken: 'token',
        caption: 'Test',
        imageUrl: 'https://example.com/invalid.jpg',
      })
    ).rejects.toThrow('Instagram media container creation failed: Invalid image URL')
  })

  it('should throw error if publish fails', async () => {
    // Container creation succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'container-id' }),
    })

    // Publish fails
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
      json: async () => ({
        error: { message: 'Insufficient permissions' },
      }),
    })

    const publishPromise = publishPost({
      instagramAccountId: 'ig-account-id',
      accessToken: 'invalid-token',
      caption: 'Test',
      imageUrl: 'https://example.com/image.jpg',
    })

    jest.advanceTimersByTime(2000)

    await expect(publishPromise).rejects.toThrow(
      'Instagram media publish failed: Insufficient permissions'
    )
  })
})

// ============================================================================
// Analytics Tests
// ============================================================================

describe('getMediaInsights', () => {
  it('should fetch media insights successfully', async () => {
    const mockInsights = {
      data: [
        { name: 'likes', values: [{ value: 200 }] },
        { name: 'comments', values: [{ value: 30 }] },
        { name: 'saved', values: [{ value: 15 }] },
        { name: 'reach', values: [{ value: 1500 }] },
        { name: 'engagement', values: [{ value: 245 }] },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockInsights,
    })

    const result = await getMediaInsights({
      mediaId: 'media-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 200,
      comments: 30,
      saves: 15,
      reach: 1500,
      engagementRate: 16.33, // 245 / 1500 * 100
    })
  })

  it('should handle missing insights gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })

    const result = await getMediaInsights({
      mediaId: 'media-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 0,
      comments: 0,
      saves: 0,
      reach: 0,
      engagementRate: 0,
    })
  })

  it('should throw error if insights request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({
        error: { message: 'Media not found' },
      }),
    })

    await expect(
      getMediaInsights({
        mediaId: 'invalid-media-id',
        accessToken: 'token',
      })
    ).rejects.toThrow('Failed to fetch Instagram insights: Media not found')
  })

  it('should validate media ID is provided', async () => {
    await expect(
      getMediaInsights({
        mediaId: '',
        accessToken: 'token',
      })
    ).rejects.toThrow('Media ID is required')
  })
})

// ============================================================================
// Token Management Tests
// ============================================================================

describe('exchangeForLongLivedToken', () => {
  it('should exchange short-lived token for long-lived token', async () => {
    const mockResponse = {
      access_token: 'long-lived-token',
      expires_in: 5184000,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await exchangeForLongLivedToken('short-lived-token', mockConfig)

    expect(result.access_token).toBe('long-lived-token')
    expect(result.expires_in).toBe(5184000)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('grant_type=ig_exchange_token'),
      expect.any(Object)
    )
  })

  it('should throw error if exchange fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error: { message: 'Invalid token' },
      }),
    })

    await expect(exchangeForLongLivedToken('invalid-token', mockConfig)).rejects.toThrow(
      'Failed to exchange token: Invalid token'
    )
  })
})

describe('refreshAccessToken', () => {
  it('should refresh long-lived token', async () => {
    const mockResponse = {
      access_token: 'refreshed-token',
      expires_in: 5184000,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await refreshAccessToken('long-lived-token')

    expect(result.access_token).toBe('refreshed-token')
    expect(result.expires_in).toBe(5184000)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('grant_type=ig_refresh_token'),
      expect.any(Object)
    )
  })

  it('should throw error if refresh fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({
        error: { message: 'Token expired' },
      }),
    })

    await expect(refreshAccessToken('expired-token')).rejects.toThrow(
      'Failed to refresh token: Token expired'
    )
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'))

    await expect(getInstagramAccountId('page-id', 'token')).rejects.toThrow(
      'Network request failed'
    )
  })

  it('should handle malformed API responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(getInstagramAccountId('page-id', 'token')).rejects.toThrow('Invalid JSON')
  })
})
