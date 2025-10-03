import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Mock Paystack client
jest.mock('@/lib/paystack/subscriptions', () => ({
  initializeSubscriptionPayment: jest.fn(),
}))

import { initializeSubscriptionPayment } from '@/lib/paystack/subscriptions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Subscriptions API', () => {
  let testUser: any
  let testSubscription: any
  let authToken: string

  beforeAll(async () => {
    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-subscription@example.com',
      password: 'testpassword123',
      email_confirm: true,
    })

    if (userError) throw userError
    testUser = user.user

    // Create test business profile
    await supabase.from('business_profiles').insert({
      owner_user_id: testUser.id,
      business_name: 'Test Business',
      industry: 'Technology',
      target_audience: 'Developers',
      content_tone: 'professional',
      content_topics: ['AI', 'Development'],
      preferred_language: 'en',
      posting_frequency: 'weekly',
    })

    // Create test subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: testUser.id,
        tier: 'starter',
        status: 'active',
        billing_cycle_start: new Date().toISOString().split('T')[0],
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        posts_limit: 30,
        platforms_limit: 2,
        team_members_limit: 1,
        storage_limit_mb: 2048,
      })
      .select()
      .single()

    if (subError) throw subError
    testSubscription = subscription

    // Sign in to get auth token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test-subscription@example.com',
      password: 'testpassword123',
    })

    if (authError) throw authError
    authToken = authData.session?.access_token!
  })

  afterAll(async () => {
    // Clean up test data
    await supabase.from('billing_transactions').delete().eq('subscription_id', testSubscription.id)
    await supabase.from('subscriptions').delete().eq('user_id', testUser.id)
    await supabase.from('business_profiles').delete().eq('owner_user_id', testUser.id)
    await supabase.auth.admin.deleteUser(testUser.id)
  })

  describe('GET /api/v1/subscriptions/me', () => {
    it('should return current user subscription with usage', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.subscription).toBeDefined()
      expect(data.subscription.tier).toBe('starter')
      expect(data.subscription.status).toBe('active')
      expect(data.usage).toBeDefined()
      expect(data.usage.postsUsed).toBeDefined()
      expect(data.usage.postsLimit).toBe(30)
      expect(data.usage.platformsLimit).toBe(2)
      expect(data.limits).toBeDefined()
      expect(data.limits.postsRemaining).toBeDefined()
    })

    it('should return 401 for unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/me')

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/v1/subscriptions/upgrade', () => {
    it('should initiate subscription upgrade', async () => {
      const mockPaymentResponse = {
        status: true,
        data: {
          authorization_url: 'https://paystack.com/pay/test-ref',
          reference: 'test-ref-123',
          amount: 99900,
        },
      }

      ;(
        initializeSubscriptionPayment as jest.MockedFunction<typeof initializeSubscriptionPayment>
      ).mockResolvedValue(mockPaymentResponse)

      const response = await fetch('http://localhost:3000/api/v1/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: 'growth' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.paymentUrl).toBe('https://paystack.com/pay/test-ref')
      expect(data.reference).toBe('test-ref-123')
      expect(data.tier).toBe('growth')
      expect(data.amount).toBe(999)
    })

    it('should reject upgrade to same tier', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: 'starter' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid Upgrade')
    })

    it('should validate request body', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: 'invalid' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation Error')
    })
  })

  describe('POST /api/v1/subscriptions/cancel', () => {
    it('should cancel subscription', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Test cancellation' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.message).toBe('Subscription cancelled successfully')
      expect(data.subscription.status).toBe('cancelled')
      expect(data.subscription.cancelledAt).toBeDefined()
      expect(data.subscription.accessUntil).toBeDefined()
    })

    it('should cancel subscription without reason', async () => {
      // First create a new subscription for this test
      const { data: newSub } = await supabase
        .from('subscriptions')
        .insert({
          user_id: testUser.id,
          tier: 'growth',
          status: 'active',
          billing_cycle_start: new Date().toISOString().split('T')[0],
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          posts_limit: 120,
          platforms_limit: 4,
          team_members_limit: 3,
          storage_limit_mb: 10240,
        })
        .select()
        .single()

      const response = await fetch('http://localhost:3000/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Clean up
      if (newSub) {
        await supabase.from('subscriptions').delete().eq('id', newSub.id)
      }
    })

    it('should reject cancellation of already cancelled subscription', async () => {
      const response = await fetch('http://localhost:3000/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Already cancelled' }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Already Cancelled')
    })
  })

  describe('GET /api/v1/subscriptions/billing-history', () => {
    beforeAll(async () => {
      // Create test billing transactions
      await supabase.from('billing_transactions').insert([
        {
          subscription_id: testSubscription.id,
          paystack_transaction_id: 'test-tx-1',
          amount: 499.0,
          currency: 'ZAR',
          transaction_type: 'charge',
          status: 'successful',
          transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { tier: 'starter' },
        },
        {
          subscription_id: testSubscription.id,
          paystack_transaction_id: 'test-tx-2',
          amount: 499.0,
          currency: 'ZAR',
          transaction_type: 'charge',
          status: 'successful',
          transaction_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 60 * 1000).toISOString(),
          metadata: { tier: 'starter' },
        },
      ])
    })

    it('should return billing history with pagination', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/subscriptions/billing-history?page=1&limit=10',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.transactions).toBeDefined()
      expect(Array.isArray(data.transactions)).toBe(true)
      expect(data.transactions.length).toBeGreaterThan(0)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.total).toBeDefined()
    })

    it('should filter by date range', async () => {
      const fromDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      const toDate = new Date().toISOString()

      const response = await fetch(
        `http://localhost:3000/api/v1/subscriptions/billing-history?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.transactions).toBeDefined()
      expect(data.filters.fromDate).toBe(fromDate)
      expect(data.filters.toDate).toBe(toDate)
    })

    it('should validate pagination parameters', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/subscriptions/billing-history?page=0&limit=200',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation Error')
    })
  })
})
