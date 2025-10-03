/**
 * Unit Tests: Twitter/X API v2 Integration
 *
 * Tests OAuth 2.0 with PKCE, tweet publishing, and metrics fetching.
 */

import {
  generatePKCE,
  generateOAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  uploadMedia,
  publishTweet,
  getTweetMetrics,
  revokeToken,
} from '@/lib/social-media/twitter'

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
  redirectUri: 'https://example.com/callback',
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// PKCE Tests
// ============================================================================

describe('generatePKCE', () => {
  it('should generate PKCE verifier and challenge', () => {
    const { verifier, challenge } = generatePKCE()

    expect(verifier).toBeTruthy()
    expect(challenge).toBeTruthy()
    expect(verifier.length).toBeGreaterThan(40)
  })

  it('should generate unique verifiers on each call', () => {
    const pkce1 = generatePKCE()
    const pkce2 = generatePKCE()

    expect(pkce1.verifier).not.toBe(pkce2.verifier)
  })
})

// ============================================================================
// OAuth Flow Tests
// ============================================================================

describe('generateOAuthUrl', () => {
  it('should generate valid OAuth URL with PKCE', () => {
    const url = generateOAuthUrl(mockConfig, 'test-challenge')

    expect(url).toContain('https://twitter.com/i/oauth2/authorize')
    expect(url).toContain(`client_id=${mockConfig.clientId}`)
    expect(url).toContain('code_challenge=test-challenge')
    expect(url).toContain('code_challenge_method=S256')
    expect(url).toContain('scope=tweet.read+tweet.write+users.read+offline.access')
    expect(url).toContain('state=')
  })
})

describe('exchangeCodeForToken', () => {
  it('should exchange authorization code for access token', async () => {
    const mockResponse = {
      access_token: 'test-access-token',
      token_type: 'bearer',
      expires_in: 7200,
      refresh_token: 'test-refresh-token',
      scope: 'tweet.read tweet.write users.read offline.access',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await exchangeCodeForToken('test-code', 'test-verifier', mockConfig)

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.twitter.com/2/oauth2/token',
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

    await expect(exchangeCodeForToken('invalid-code', 'verifier', mockConfig)).rejects.toThrow(
      'Twitter token exchange failed: Invalid authorization code'
    )
  })
})

describe('refreshAccessToken', () => {
  it('should refresh access token using refresh token', async () => {
    const mockResponse = {
      access_token: 'new-access-token',
      token_type: 'bearer',
      expires_in: 7200,
      refresh_token: 'new-refresh-token',
      scope: 'tweet.read tweet.write users.read offline.access',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await refreshAccessToken('old-refresh-token', mockConfig)

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.twitter.com/2/oauth2/token',
      expect.objectContaining({ method: 'POST' })
    )
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
      'Twitter token refresh failed: Invalid refresh token'
    )
  })
})

// ============================================================================
// Media Upload Tests
// ============================================================================

describe('uploadMedia', () => {
  it('should upload image and return media ID', async () => {
    // Mock image download
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    })

    // Mock media upload
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ media_id_string: '123456789' }),
    })

    const result = await uploadMedia('https://example.com/image.jpg', 'token')

    expect(result).toBe('123456789')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should throw error if image download fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    await expect(uploadMedia('https://example.com/invalid.jpg', 'token')).rejects.toThrow(
      'Failed to download image'
    )
  })

  it('should throw error if upload fails', async () => {
    // Image download succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    })

    // Upload fails
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        errors: [{ message: 'Invalid media' }],
      }),
    })

    await expect(uploadMedia('https://example.com/image.jpg', 'token')).rejects.toThrow(
      'Twitter media upload failed: Invalid media'
    )
  })
})

// ============================================================================
// Tweet Publishing Tests
// ============================================================================

describe('publishTweet', () => {
  it('should publish text-only tweet', async () => {
    // Mock tweet creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: 'tweet-id-123' },
      }),
    })

    // Mock user info fetch
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { username: 'testuser' },
      }),
    })

    const result = await publishTweet({
      accessToken: 'token',
      text: 'Test tweet',
    })

    expect(result.platformPostId).toBe('tweet-id-123')
    expect(result.postUrl).toBe('https://twitter.com/testuser/status/tweet-id-123')
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.twitter.com/2/tweets',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      })
    )
  })

  it('should publish tweet with media', async () => {
    // Mock tweet creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: 'tweet-id-456' },
      }),
    })

    // Mock user info
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { username: 'testuser' },
      }),
    })

    const result = await publishTweet({
      accessToken: 'token',
      text: 'Tweet with image',
      mediaId: 'media-123',
    })

    expect(result.platformPostId).toBe('tweet-id-456')
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.twitter.com/2/tweets',
      expect.objectContaining({
        body: JSON.stringify({
          text: 'Tweet with image',
          media: { media_ids: ['media-123'] },
        }),
      })
    )
  })

  it('should throw validation error for empty text', async () => {
    await expect(
      publishTweet({
        accessToken: 'token',
        text: '',
      })
    ).rejects.toThrow()
  })

  it('should throw validation error for text exceeding 280 characters', async () => {
    await expect(
      publishTweet({
        accessToken: 'token',
        text: 'A'.repeat(281),
      })
    ).rejects.toThrow('Tweet must be 1-280 characters')
  })

  it('should throw error if publish fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
      json: async () => ({
        detail: 'Insufficient permissions',
      }),
    })

    await expect(
      publishTweet({
        accessToken: 'invalid-token',
        text: 'Test',
      })
    ).rejects.toThrow('Twitter publish failed: Insufficient permissions')
  })

  it('should use default username if user info fetch fails', async () => {
    // Mock tweet creation
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: 'tweet-id-789' },
      }),
    })

    // Mock user info failure
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    })

    const result = await publishTweet({
      accessToken: 'token',
      text: 'Test',
    })

    expect(result.postUrl).toBe('https://twitter.com/twitter/status/tweet-id-789')
  })
})

// ============================================================================
// Metrics Tests
// ============================================================================

describe('getTweetMetrics', () => {
  it('should fetch tweet metrics successfully', async () => {
    const mockMetrics = {
      data: {
        public_metrics: {
          like_count: 150,
          retweet_count: 30,
          reply_count: 20,
          impression_count: 2000,
        },
        organic_metrics: {
          impression_count: 1800,
        },
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    })

    const result = await getTweetMetrics({
      tweetId: 'tweet-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 150,
      retweets: 30,
      replies: 20,
      impressions: 1800,
      engagementRate: 11.11, // (150 + 30 + 20) / 1800 * 100
    })
  })

  it('should handle missing metrics gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {},
      }),
    })

    const result = await getTweetMetrics({
      tweetId: 'tweet-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 0,
      retweets: 0,
      replies: 0,
      impressions: 0,
      engagementRate: 0,
    })
  })

  it('should throw error if metrics request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({
        detail: 'Tweet not found',
      }),
    })

    await expect(
      getTweetMetrics({
        tweetId: 'invalid-tweet-id',
        accessToken: 'token',
      })
    ).rejects.toThrow('Failed to fetch tweet metrics: Tweet not found')
  })

  it('should validate tweet ID is provided', async () => {
    await expect(
      getTweetMetrics({
        tweetId: '',
        accessToken: 'token',
      })
    ).rejects.toThrow('Tweet ID is required')
  })
})

// ============================================================================
// Token Revocation Tests
// ============================================================================

describe('revokeToken', () => {
  it('should revoke access token successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await expect(revokeToken('token', mockConfig)).resolves.not.toThrow()

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.twitter.com/2/oauth2/revoke',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should throw error if revocation fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({
        error_description: 'Invalid token',
      }),
    })

    await expect(revokeToken('invalid-token', mockConfig)).rejects.toThrow(
      'Twitter token revocation failed: Invalid token'
    )
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'))

    await expect(
      publishTweet({
        accessToken: 'token',
        text: 'Test',
      })
    ).rejects.toThrow('Network request failed')
  })

  it('should handle malformed API responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(
      publishTweet({
        accessToken: 'token',
        text: 'Test',
      })
    ).rejects.toThrow('Invalid JSON')
  })
})
