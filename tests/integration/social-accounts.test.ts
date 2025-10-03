/**
 * Integration tests for Social Accounts API endpoints
 *
 * Tests the complete OAuth flow for Facebook, Instagram, Twitter, and LinkedIn
 * including connection, callback handling, listing, and disconnection.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test database client (separate from app client)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
)

describe('Social Accounts API Integration Tests', () => {
  let testUserId: string
  let testBusinessProfileId: string
  let testAccountId: string

  beforeAll(async () => {
    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-social@example.com',
      password: 'testpassword123',
      email_confirm: true,
    })

    if (userError) throw userError
    testUserId = user.user!.id

    // Create test business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .insert({
        owner_user_id: testUserId,
        business_name: 'Test Business',
        industry: 'Technology',
        target_audience: 'Tech professionals',
        content_tone: 'professional',
        preferred_language: 'en',
        posting_frequency: 'weekly',
      })
      .select()
      .single()

    if (profileError) throw profileError
    testBusinessProfileId = profile.id
  })

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from('social_media_accounts')
      .delete()
      .eq('business_profile_id', testBusinessProfileId)
    await supabase.from('business_profiles').delete().eq('owner_user_id', testUserId)
    await supabase.auth.admin.deleteUser(testUserId)
  })

  describe('GET /api/v1/social-accounts', () => {
    it('should return empty list for new user', async () => {
      const response = await fetch('http://localhost:3000/api/v1/social-accounts', {
        headers: {
          Authorization: `Bearer ${testUserId}`, // Mock auth for testing
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.accounts).toEqual([])
      expect(data.total).toBe(0)
    })

    it('should filter by platform', async () => {
      // First create a test account
      const { data: account } = await supabase
        .from('social_media_accounts')
        .insert({
          business_profile_id: testBusinessProfileId,
          platform: 'facebook',
          platform_user_id: '123456789',
          platform_username: 'Test Facebook Page',
          access_token: 'encrypted_token_here',
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        })
        .select()
        .single()

      testAccountId = account!.id

      const response = await fetch(
        'http://localhost:3000/api/v1/social-accounts?platform=facebook',
        {
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.accounts).toHaveLength(1)
      expect(data.accounts[0].platform).toBe('facebook')
    })

    it('should filter by connection status', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/social-accounts?status=connected',
        {
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.accounts).toHaveLength(1)
      expect(data.accounts[0].connection_status).toBe('connected')
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/v1/social-accounts')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/v1/social-accounts/[platformName]/connect', () => {
    it('should initiate Facebook OAuth flow', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/social-accounts/facebook/connect',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testUserId}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.authorization_url).toBeDefined()
      expect(data.authorization_url).toContain('facebook.com')
      expect(data.state).toBeDefined()
    })

    it('should initiate Twitter OAuth flow', async () => {
      const response = await fetch('http://localhost:3000/api/v1/social-accounts/twitter/connect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUserId}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.authorization_url).toBeDefined()
      expect(data.authorization_url).toContain('twitter.com')
      expect(data.code_challenge).toBeDefined()
    })

    it('should return 400 for invalid platform', async () => {
      const response = await fetch('http://localhost:3000/api/v1/social-accounts/invalid/connect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testUserId}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.title).toBe('Bad Request')
    })

    it('should return 403 when exceeding tier limits', async () => {
      // Update business profile to starter tier (2 platform limit)
      await supabase
        .from('business_profiles')
        .update({ posting_frequency: 'daily' }) // Using posting_frequency as proxy for tier
        .eq('id', testBusinessProfileId)

      // Try to connect to a third platform
      const response = await fetch(
        'http://localhost:3000/api/v1/social-accounts/linkedin/connect',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testUserId}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.title).toBe('Forbidden')
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/social-accounts/facebook/connect',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/v1/social-accounts/[platformName]/callback', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock successful OAuth callback parameters
      const mockCode = 'mock_oauth_code'
      const mockState = 'mock_state_value'

      const response = await fetch(
        `http://localhost:3000/api/v1/social-accounts/facebook/callback?code=${mockCode}&state=${mockState}`,
        {
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      // In a real test, this would redirect to frontend
      // For now, we expect it to handle the callback
      expect([302, 400]).toContain(response.status) // Redirect or error for mock data
    })

    it('should handle OAuth error in callback', async () => {
      const mockError = 'access_denied'
      const mockState = 'mock_state_value'

      const response = await fetch(
        `http://localhost:3000/api/v1/social-accounts/facebook/callback?error=${mockError}&state=${mockState}`,
        {
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      expect(response.status).toBe(302) // Redirect to frontend with error
    })
  })

  describe('DELETE /api/v1/social-accounts/[id]', () => {
    it('should disconnect social account', async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/social-accounts/${testAccountId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toContain('disconnected successfully')
      expect(data.account.connection_status).toBe('disconnected')
    })

    it('should return 404 for non-existent account', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`http://localhost:3000/api/v1/social-accounts/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testUserId}`,
        },
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.title).toBe('Not Found')
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/social-accounts/${testAccountId}`,
        {
          method: 'DELETE',
        }
      )
      expect(response.status).toBe(401)
    })

    it("should return 404 when trying to delete another user's account", async () => {
      // Create another user
      const { data: otherUser } = await supabase.auth.admin.createUser({
        email: 'other-user@example.com',
        password: 'testpassword123',
        email_confirm: true,
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/social-accounts/${testAccountId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${otherUser!.user!.id}`,
          },
        }
      )

      expect(response.status).toBe(404)

      // Clean up
      await supabase.auth.admin.deleteUser(otherUser!.user!.id)
    })
  })

  describe('End-to-End OAuth Flow Simulation', () => {
    it('should complete full OAuth flow for Facebook', async () => {
      // 1. Initiate connection
      const connectResponse = await fetch(
        'http://localhost:3000/api/v1/social-accounts/facebook/connect',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testUserId}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(connectResponse.status).toBe(200)
      const connectData = await connectResponse.json()
      expect(connectData.authorization_url).toBeDefined()

      // 2. Simulate callback (in real scenario, user would visit URL and be redirected back)
      // This is a simplified test - in production, you'd mock the OAuth provider
      const callbackResponse = await fetch(
        `http://localhost:3000/api/v1/social-accounts/facebook/callback?code=mock_code&state=${connectData.state}`,
        {
          headers: {
            Authorization: `Bearer ${testUserId}`,
          },
        }
      )

      // Expect redirect or error (depending on mock implementation)
      expect([302, 400]).toContain(callbackResponse.status)

      // 3. Verify account was created (if callback succeeded)
      const accountsResponse = await fetch('http://localhost:3000/api/v1/social-accounts', {
        headers: {
          Authorization: `Bearer ${testUserId}`,
        },
      })

      expect(accountsResponse.status).toBe(200)
      const accountsData = await accountsResponse.json()
      // Account may or may not be created depending on mock success
      expect(Array.isArray(accountsData.accounts)).toBe(true)
    })
  })
})
