/**
 * Unit Tests: LinkedIn Marketing API Integration
 *
 * Tests OAuth flows, UGC post publishing with image upload, and analytics.
 */

import {
  generateOAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserProfile,
  publishPost,
  getPostAnalytics,
} from '@/lib/social-media/linkedin'

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
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'https://example.com/callback',
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// OAuth Flow Tests
// ============================================================================

describe('generateOAuthUrl', () => {
  it('should generate valid OAuth URL with LinkedIn scopes', () => {
    const url = generateOAuthUrl(mockConfig)

    expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization')
    expect(url).toContain(`client_id=${mockConfig.clientId}`)
    expect(url).toContain('scope=w_member_social+r_liteprofile+r_emailaddress')
    expect(url).toContain('response_type=code')
    expect(url).toContain('state=')
  })
})

describe('exchangeCodeForToken', () => {
  it('should exchange authorization code for access token', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      expires_in: 5184000,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await exchangeCodeForToken('test-code', mockConfig)

    expect(result.access_token).toBe('test-access-token')
    expect(result.expires_in).toBe(5184000)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.linkedin.com/oauth/v2/accessToken',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    )
  })

  it('should throw error if token exchange fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error_description: 'Invalid authorization code',
      }),
    })

    await expect(exchangeCodeForToken('invalid-code', mockConfig)).rejects.toThrow(
      'LinkedIn token exchange failed: Invalid authorization code'
    )
  })
})

describe('refreshAccessToken', () => {
  it('should refresh access token using refresh token', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      expires_in: 5184000,
      refresh_token: 'new-refresh-token',
      refresh_token_expires_in: 31536000,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await refreshAccessToken('old-refresh-token', mockConfig)

    expect(result).toEqual(mockResponse)
  })

  it('should throw error if token refresh fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({
        error_description: 'Invalid refresh token',
      }),
    })

    await expect(refreshAccessToken('invalid-token', mockConfig)).rejects.toThrow(
      'LinkedIn token refresh failed: Invalid refresh token'
    )
  })
})

// ============================================================================
// User Profile Tests
// ============================================================================

describe('getUserProfile', () => {
  it('should retrieve user profile and person URN', async () => {
    const mockResponse = {
      id: 'abc123',
      localizedFirstName: 'John',
      localizedLastName: 'Doe',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getUserProfile('access-token')

    expect(result).toEqual({
      personUrn: 'urn:li:person:abc123',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.linkedin.com/v2/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer access-token' },
      })
    )
  })

  it('should throw error if profile request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({
        message: 'Invalid access token',
      }),
    })

    await expect(getUserProfile('invalid-token')).rejects.toThrow(
      'Failed to get LinkedIn profile: Invalid access token'
    )
  })
})

// ============================================================================
// Post Publishing Tests
// ============================================================================

describe('publishPost', () => {
  it('should publish text-only post', async () => {
    // Mock UGC post creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map([['x-restli-id', 'urn:li:share:123456']]),
      json: async () => ({}),
    })

    const result = await publishPost({
      personUrn: 'urn:li:person:abc123',
      accessToken: 'token',
      text: 'Test LinkedIn post',
    })

    expect(result.platformPostId).toBe('urn:li:share:123456')
    expect(result.postUrl).toBe('https://www.linkedin.com/feed/update/urn:li:share:123456')
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.linkedin.com/v2/ugcPosts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'X-Restli-Protocol-Version': '2.0.0',
        }),
      })
    )
  })

  it('should publish post with image', async () => {
    // Mock image upload registration
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://upload.linkedin.com/test',
            },
          },
          asset: 'urn:li:digitalmediaAsset:test-asset-id',
        },
      }),
    })

    // Mock image download
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    })

    // Mock image upload
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    // Mock post creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map([['x-restli-id', 'urn:li:share:789']]),
      json: async () => ({}),
    })

    const result = await publishPost({
      personUrn: 'urn:li:person:abc123',
      accessToken: 'token',
      text: 'Post with image',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.platformPostId).toBe('urn:li:share:789')
    expect(global.fetch).toHaveBeenCalledTimes(4)

    // Verify upload registration
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/assets?action=registerUpload'),
      expect.any(Object)
    )

    // Verify image upload
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      'https://upload.linkedin.com/test',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should throw validation error for empty text', async () => {
    await expect(
      publishPost({
        personUrn: 'urn:li:person:abc123',
        accessToken: 'token',
        text: '',
      })
    ).rejects.toThrow()
  })

  it('should throw validation error for text exceeding 3000 characters', async () => {
    await expect(
      publishPost({
        personUrn: 'urn:li:person:abc123',
        accessToken: 'token',
        text: 'A'.repeat(3001),
      })
    ).rejects.toThrow('Text must be 1-3000 characters')
  })

  it('should throw error if post creation fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
      json: async () => ({
        message: 'Insufficient permissions',
      }),
    })

    await expect(
      publishPost({
        personUrn: 'urn:li:person:abc123',
        accessToken: 'invalid-token',
        text: 'Test',
      })
    ).rejects.toThrow('LinkedIn publish failed: Insufficient permissions')
  })

  it('should throw error if no share ID returned', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Map(), // No x-restli-id header
      json: async () => ({}),
    })

    await expect(
      publishPost({
        personUrn: 'urn:li:person:abc123',
        accessToken: 'token',
        text: 'Test',
      })
    ).rejects.toThrow('LinkedIn publish succeeded but no share ID returned')
  })

  it('should throw error if image download fails', async () => {
    // Mock upload registration success
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://upload.linkedin.com/test',
            },
          },
          asset: 'urn:li:digitalmediaAsset:test',
        },
      }),
    })

    // Mock image download failure
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    await expect(
      publishPost({
        personUrn: 'urn:li:person:abc123',
        accessToken: 'token',
        text: 'Test',
        imageUrl: 'https://example.com/invalid.jpg',
      })
    ).rejects.toThrow('Failed to download image')
  })
})

// ============================================================================
// Analytics Tests
// ============================================================================

describe('getPostAnalytics', () => {
  it('should fetch post analytics successfully', async () => {
    const mockAnalytics = {
      elements: [
        {
          likesSummary: { totalLikes: 250 },
          commentsSummary: { totalComments: 40 },
          sharesSummary: { totalShares: 15 },
        },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalytics,
    })

    const result = await getPostAnalytics({
      shareUrn: 'urn:li:share:123',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 250,
      comments: 40,
      shares: 15,
      impressions: 0, // LinkedIn doesn't provide impressions via social actions
      engagementRate: 0,
    })
  })

  it('should handle missing analytics gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ elements: [] }),
    })

    const result = await getPostAnalytics({
      shareUrn: 'urn:li:share:123',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      engagementRate: 0,
    })
  })

  it('should throw error if analytics request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({
        message: 'Share not found',
      }),
    })

    await expect(
      getPostAnalytics({
        shareUrn: 'urn:li:share:invalid',
        accessToken: 'token',
      })
    ).rejects.toThrow('Failed to fetch LinkedIn analytics: Share not found')
  })

  it('should validate share URN is provided', async () => {
    await expect(
      getPostAnalytics({
        shareUrn: '',
        accessToken: 'token',
      })
    ).rejects.toThrow('Share URN is required')
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'))

    await expect(getUserProfile('token')).rejects.toThrow('Network request failed')
  })

  it('should handle malformed API responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(getUserProfile('token')).rejects.toThrow('Invalid JSON')
  })
})
