/**
 * Unit Tests: Facebook Graph API Integration
 *
 * Tests OAuth flows, post publishing, and analytics fetching.
 */

import {
  generateOAuthUrl,
  exchangeCodeForToken,
  getPageAccessToken,
  getUserPages,
  publishPost,
  getPostInsights,
} from '@/lib/social-media/facebook'

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
  it('should generate valid OAuth URL with correct parameters', () => {
    const url = generateOAuthUrl(mockConfig)

    expect(url).toContain('https://www.facebook.com/v18.0/dialog/oauth')
    expect(url).toContain(`client_id=${mockConfig.appId}`)
    expect(url).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`)
    expect(url).toContain('scope=pages_manage_posts%2Cpages_read_engagement')
    expect(url).toContain('response_type=code')
    expect(url).toContain('state=')
  })

  it('should include state parameter for CSRF protection', () => {
    const url = generateOAuthUrl(mockConfig)
    const stateMatch = url.match(/state=([a-f0-9]{32})/)

    expect(stateMatch).toBeTruthy()
    expect(stateMatch![1]).toHaveLength(32)
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
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('oauth/access_token'),
      expect.objectContaining({ method: 'GET' })
    )
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
      'Facebook token exchange failed: Invalid authorization code'
    )
  })

  it('should use default expiration if not provided', async () => {
    const mockResponse = {
      access_token: 'test-token',
      // expires_in not provided
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await exchangeCodeForToken('test-code', mockConfig)

    expect(result.expires_in).toBe(5184000) // Default 60 days
  })
})

describe('getPageAccessToken', () => {
  it('should retrieve long-lived page access token', async () => {
    const mockResponse = {
      access_token: 'page-access-token',
      id: 'page-id',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getPageAccessToken('user-token', 'page-id')

    expect(result.accessToken).toBe('page-access-token')
    expect(result.expiresAt.getFullYear()).toBeGreaterThan(new Date().getFullYear() + 9)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page-id?fields=access_token'),
      expect.any(Object)
    )
  })

  it('should throw error if page token request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      json: async () => ({
        error: { message: 'Page not found' },
      }),
    })

    await expect(getPageAccessToken('user-token', 'invalid-page')).rejects.toThrow(
      'Failed to get page token: Page not found'
    )
  })
})

describe('getUserPages', () => {
  it('should fetch list of user-managed pages', async () => {
    const mockResponse = {
      data: [
        { id: 'page-1', name: 'Test Page 1', access_token: 'token-1' },
        { id: 'page-2', name: 'Test Page 2', access_token: 'token-2' },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getUserPages('user-token')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'page-1',
      name: 'Test Page 1',
      accessToken: 'token-1',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me/accounts?access_token=user-token'),
      expect.any(Object)
    )
  })

  it('should return empty array if no pages found', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })

    const result = await getUserPages('user-token')

    expect(result).toEqual([])
  })
})

// ============================================================================
// Post Publishing Tests
// ============================================================================

describe('publishPost', () => {
  it('should publish text-only post to Facebook Page', async () => {
    const mockResponse = {
      id: 'page-id_post-id',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await publishPost({
      pageId: 'page-id',
      accessToken: 'page-token',
      caption: 'Test post caption',
    })

    expect(result.platformPostId).toBe('page-id_post-id')
    expect(result.postUrl).toBe('https://www.facebook.com/page-id_post-id')
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/page-id/feed'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    )
  })

  it('should publish post with image to Facebook Page', async () => {
    const mockResponse = {
      post_id: 'page-id_photo-post-id',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await publishPost({
      pageId: 'page-id',
      accessToken: 'page-token',
      caption: 'Test post with image',
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(result.platformPostId).toBe('page-id_photo-post-id')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/page-id/photos'),
      expect.any(Object)
    )
  })

  it('should throw validation error for missing page ID', async () => {
    await expect(
      publishPost({
        pageId: '',
        accessToken: 'token',
        caption: 'Test',
      })
    ).rejects.toThrow('Page ID is required')
  })

  it('should throw validation error for caption exceeding 5000 characters', async () => {
    await expect(
      publishPost({
        pageId: 'page-id',
        accessToken: 'token',
        caption: 'A'.repeat(5001),
      })
    ).rejects.toThrow('Caption must be 1-5000 characters')
  })

  it('should throw error if publish request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
      json: async () => ({
        error: { message: 'Insufficient permissions' },
      }),
    })

    await expect(
      publishPost({
        pageId: 'page-id',
        accessToken: 'invalid-token',
        caption: 'Test',
      })
    ).rejects.toThrow('Facebook publish failed: Insufficient permissions')
  })
})

// ============================================================================
// Analytics Tests
// ============================================================================

describe('getPostInsights', () => {
  it('should fetch post analytics successfully', async () => {
    const mockMetrics = {
      reactions: { summary: { total_count: 150 } },
      comments: { summary: { total_count: 25 } },
      shares: { count: 10 },
    }

    const mockInsights = {
      data: [
        {
          name: 'post_impressions_unique',
          values: [{ value: 1000 }],
        },
      ],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights,
      })

    const result = await getPostInsights({
      postId: 'post-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 150,
      comments: 25,
      shares: 10,
      reach: 1000,
      engagementRate: 18.5, // (150 + 25 + 10) / 1000 * 100
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle missing metrics gracefully', async () => {
    const mockMetrics = {} // No reactions, comments, shares
    const mockInsights = { data: [] } // No reach data

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights,
      })

    const result = await getPostInsights({
      postId: 'post-id',
      accessToken: 'token',
    })

    expect(result).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      engagementRate: 0,
    })
  })

  it('should calculate engagement rate correctly', async () => {
    const mockMetrics = {
      reactions: { summary: { total_count: 50 } },
      comments: { summary: { total_count: 30 } },
      shares: { count: 20 },
    }

    const mockInsights = {
      data: [{ values: [{ value: 500 }] }],
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockMetrics })
      .mockResolvedValueOnce({ ok: true, json: async () => mockInsights })

    const result = await getPostInsights({
      postId: 'post-id',
      accessToken: 'token',
    })

    // (50 + 30 + 20) / 500 * 100 = 20%
    expect(result.engagementRate).toBe(20)
  })

  it('should throw error if metrics request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: async () => ({
        error: { message: 'Invalid access token' },
      }),
    })

    await expect(
      getPostInsights({
        postId: 'post-id',
        accessToken: 'invalid-token',
      })
    ).rejects.toThrow('Failed to fetch post metrics: Invalid access token')
  })

  it('should throw error if insights request fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reactions: { summary: { total_count: 10 } } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
        json: async () => ({
          error: { message: 'Insufficient permissions' },
        }),
      })

    await expect(
      getPostInsights({
        postId: 'post-id',
        accessToken: 'token',
      })
    ).rejects.toThrow('Failed to fetch post insights: Insufficient permissions')
  })

  it('should validate post ID is provided', async () => {
    await expect(
      getPostInsights({
        postId: '',
        accessToken: 'token',
      })
    ).rejects.toThrow('Post ID is required')
  })
})

// ============================================================================
// Edge Cases & Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'))

    await expect(
      publishPost({
        pageId: 'page-id',
        accessToken: 'token',
        caption: 'Test',
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
      publishPost({
        pageId: 'page-id',
        accessToken: 'token',
        caption: 'Test',
      })
    ).rejects.toThrow('Invalid JSON')
  })
})
