/**
 * Integration tests for posts API routes
 *
 * Tests:
 * - GET /api/v1/posts - List posts with filtering and pagination
 * - POST /api/v1/posts - Create new post with AI generation
 * - GET /api/v1/posts/[id] - Get single post
 * - PUT /api/v1/posts/[id] - Update post
 * - DELETE /api/v1/posts/[id] - Delete post
 */

import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { GET, POST } from '@/app/api/v1/posts/route'
import { GET as getPost, PUT, DELETE } from '@/app/api/v1/posts/[id]/route'
import { generatePostCaption } from '@/lib/gemini/text-generation'
import { generateImage } from '@/lib/gemini/image-generation'

// Mock external dependencies
jest.mock('@supabase/auth-helpers-nextjs')
jest.mock('@/lib/gemini/text-generation')
jest.mock('@/lib/gemini/image-generation')
jest.mock('@/lib/logging/logger')

const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<
  typeof createRouteHandlerClient
>
const mockGeneratePostCaption = generatePostCaption as jest.MockedFunction<
  typeof generatePostCaption
>
const mockGenerateImage = generateImage as jest.MockedFunction<typeof generateImage>

// Test helper functions
const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
})

const createTestBusinessProfile = (userId: string) => ({
  id: 'test-business-profile-id',
  owner_user_id: userId,
  name: 'Test Business',
  description: 'Test business description',
  tone: 'professional',
  topics: ['technology', 'business'],
  target_audience: 'professionals',
  created_at: new Date().toISOString(),
})

const cleanupTestData = async () => {
  // Cleanup logic would go here in a real implementation
}

describe('/api/v1/posts', () => {
  let testUser: any
  let testBusinessProfile: any
  let mockSupabase: any

  beforeEach(async () => {
    // Create test user and business profile
    testUser = createTestUser()
    testBusinessProfile = createTestBusinessProfile(testUser.id)

    // Create a more realistic mock that chains properly
    const createMockQuery = (result: any = null, error: any = null) => ({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: result, error }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: testUser }, error: null }),
      },
      from: jest.fn(() => createMockQuery()),
    }

    mockCreateRouteHandlerClient.mockReturnValue(mockSupabase as any)

    // Mock AI services
    mockGeneratePostCaption.mockResolvedValue({
      caption: 'Test AI generated caption',
      hashtags: ['#test', '#ai'],
      suggestedImagePrompt: 'Test image prompt',
      language: 'en',
      platform: 'facebook',
    })
    mockGenerateImage.mockResolvedValue('https://example.com/test-image.png')
  })

  afterEach(async () => {
    await cleanupTestData()
    jest.clearAllMocks()
  })

  describe('GET /api/v1/posts', () => {
    it('should return posts for authenticated user', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          business_profile_id: testBusinessProfile.id,
          caption: 'Test post 1',
          language: 'en',
          image_url: 'https://example.com/image1.png',
          hashtags: ['#test'],
          platform_targets: ['facebook'],
          status: 'draft',
          scheduled_time: null,
          published_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          business_profiles: { owner_user_id: testUser.id },
        },
      ]

      // Mock the business profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: testBusinessProfile, error: null }),
          }),
        }),
      })

      // Mock the posts query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockReturnValueOnce({
                  range: jest.fn().mockResolvedValueOnce({ data: mockPosts, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.posts).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      const request = new NextRequest('http://localhost:3000/api/v1/posts')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.title).toBe('Unauthorized')
    })

    it('should filter posts by status', async () => {
      // Mock the business profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: testBusinessProfile, error: null }),
          }),
        }),
      })

      // Mock the posts query with status filter
      const mockQuery = {
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockReturnValueOnce({
                  range: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/v1/posts?status=draft')
      await GET(request)

      expect(mockQuery.select).toHaveBeenCalled()
    })

    it('should filter posts by platform', async () => {
      // Mock the business profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: testBusinessProfile, error: null }),
          }),
        }),
      })

      // Mock the posts query with platform filter
      const mockQuery = {
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                limit: jest.fn().mockReturnValueOnce({
                  range: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/v1/posts?platform=facebook')
      await GET(request)

      expect(mockQuery.select).toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/posts', () => {
    it('should create post with AI generation', async () => {
      const mockCreatedPost = {
        id: 'new-post-id',
        business_profile_id: testBusinessProfile.id,
        caption: 'Test AI generated caption',
        language: 'en',
        image_url: 'https://example.com/test-image.png',
        hashtags: ['#test', '#ai'],
        platform_targets: ['facebook', 'instagram'],
        status: 'draft',
        scheduled_time: null,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_edits: [],
        ai_model_version: 'gemini-1.5-pro-latest',
        generation_prompt: 'Test prompt',
      }

      // Mock business profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: testBusinessProfile, error: null }),
          }),
        }),
      })

      // Mock subscription limit check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: { count: 0 }, error: null }),
            }),
          }),
        }),
      })

      // Mock post creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: mockCreatedPost, error: null }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({
          businessProfileId: testBusinessProfile.id,
          topic: 'Test topic',
          language: 'en',
          platforms: ['facebook', 'instagram'],
          generateImage: true,
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.post.id).toBe('new-post-id')
      expect(result.post.caption).toBe('Test AI generated caption')
      expect(mockGeneratePostCaption).toHaveBeenCalled()
      expect(mockGenerateImage).toHaveBeenCalled()
    })

    it('should return 400 for invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should enforce subscription limits', async () => {
      // Mock business profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: testBusinessProfile, error: null }),
          }),
        }),
      })

      // Mock subscription limit check (at limit)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: { count: 30 }, error: null }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({
          businessProfileId: testBusinessProfile.id,
          topic: 'Test topic',
          language: 'en',
          platforms: ['facebook'],
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(429)
      expect(result.title).toBe('Too Many Requests')
    })
  })

  describe('GET /api/v1/posts/[id]', () => {
    it('should return single post', async () => {
      const mockPost = {
        id: 'post-1',
        business_profile_id: testBusinessProfile.id,
        caption: 'Test post',
        language: 'en',
        image_url: 'https://example.com/image.png',
        hashtags: ['#test'],
        platform_targets: ['facebook'],
        status: 'draft',
        scheduled_time: null,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_edits: [],
        ai_model_version: 'gemini-1.5-pro-latest',
        generation_prompt: 'Test prompt',
        business_profiles: [{ owner_user_id: testUser.id }],
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: mockPost, error: null }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/post-1')
      const response = await getPost(request, { params: { id: 'post-1' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.post.id).toBe('post-1')
    })

    it('should return 404 for non-existent post', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/non-existent')
      const response = await getPost(request, { params: { id: 'non-existent' } })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.title).toBe('Not Found')
    })
  })

  describe('PUT /api/v1/posts/[id]', () => {
    it('should update post successfully', async () => {
      const currentPost = {
        id: 'post-1',
        business_profile_id: testBusinessProfile.id,
        caption: 'Old caption',
        language: 'en',
        image_url: 'https://example.com/old-image.png',
        hashtags: ['#old'],
        platform_targets: ['facebook'],
        status: 'draft',
        scheduled_time: null,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_edits: [],
        business_profiles: [{ owner_user_id: testUser.id }],
      }

      const updatedPost = { ...currentPost, caption: 'New caption', user_edits: [] }

      // Mock get current post
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: currentPost, error: null }),
            }),
          }),
        }),
      })

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: updatedPost, error: null }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/post-1', {
        method: 'PUT',
        body: JSON.stringify({
          caption: 'New caption',
        }),
      })

      const response = await PUT(request, { params: { id: 'post-1' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.post.caption).toBe('New caption')
    })

    it('should track user edits', async () => {
      const currentPost = {
        id: 'post-1',
        business_profile_id: testBusinessProfile.id,
        caption: 'Old caption',
        language: 'en',
        image_url: 'https://example.com/old-image.png',
        hashtags: ['#old'],
        platform_targets: ['facebook'],
        status: 'draft',
        scheduled_time: null,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_edits: [],
        business_profiles: [{ owner_user_id: testUser.id }],
      }

      // Mock get current post
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: currentPost, error: null }),
            }),
          }),
        }),
      })

      // Mock update
      const mockUpdate = jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: { ...currentPost, user_edits: [] }, error: null }),
          }),
        }),
      })

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/post-1', {
        method: 'PUT',
        body: JSON.stringify({
          caption: 'New caption',
        }),
      })

      await PUT(request, { params: { id: 'post-1' } })

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_edits: expect.arrayContaining([
            expect.objectContaining({
              field: 'caption',
              old_value: 'Old caption',
              new_value: 'New caption',
            }),
          ]),
        })
      )
    })
  })

  describe('DELETE /api/v1/posts/[id]', () => {
    it('should soft delete draft post', async () => {
      const currentPost = {
        id: 'post-1',
        business_profile_id: testBusinessProfile.id,
        status: 'draft',
        business_profiles: [{ owner_user_id: testUser.id }],
      }

      // Mock get current post
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: currentPost, error: null }),
            }),
          }),
        }),
      })

      // Mock update
      const mockUpdate = jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({ error: null }),
        }),
      })

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/post-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'post-1' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Post deleted successfully')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }))
    })

    it('should not delete published post', async () => {
      const currentPost = {
        id: 'post-1',
        business_profile_id: testBusinessProfile.id,
        status: 'published',
        business_profiles: [{ owner_user_id: testUser.id }],
      }

      // Mock get current post
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: currentPost, error: null }),
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/posts/post-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'post-1' } })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.detail).toBe('Cannot delete published posts.')
    })
  })
})
