import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { POST } from '@/app/api/webhooks/paystack/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('/api/webhooks/paystack', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    process.env.PAYSTACK_WEBHOOK_SECRET = 'test-secret'
  })

  describe('POST - charge.success', () => {
    const chargeSuccessEvent = {
      event: 'charge.success',
      data: {
        reference: 'ref_123',
        amount: 49900, // R499 in kobo
        customer: {
          customer_code: 'CUS_abc123',
          email: 'test@example.com',
        },
        metadata: {
          subscription_id: 'sub_123',
        },
      },
    }

    it('should process successful charge and activate pending subscription', async () => {
      // Mock subscription lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'sub_123',
          owner_user_id: 'user_123',
          tier: 'starter',
          status: 'pending_payment',
        },
        error: null,
      })

      // Mock subscription update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      // Mock billing transaction insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null,
      })

      const body = JSON.stringify(chargeSuccessEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual({ status: 'success' })

      // Verify subscription was updated to active
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          updated_at: expect.any(String),
        })
      )

      // Verify billing transaction was created
      expect(mockSupabase.from).toHaveBeenCalledWith('billing_transactions')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_id: 'sub_123',
          owner_user_id: 'user_123',
          paystack_reference: 'ref_123',
          amount: 499,
          currency: 'ZAR',
          status: 'completed',
          transaction_type: 'subscription_payment',
        })
      )
    })

    it('should create billing transaction for active subscription', async () => {
      // Mock subscription lookup (already active)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'sub_123',
          owner_user_id: 'user_123',
          tier: 'starter',
          status: 'active',
        },
        error: null,
      })

      // Mock billing transaction insert
      mockSupabase.insert.mockResolvedValueOnce({
        error: null,
      })

      const body = JSON.stringify(chargeSuccessEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual({ status: 'success' })

      // Verify no subscription update for active subscription
      expect(mockSupabase.update).not.toHaveBeenCalled()

      // Verify billing transaction was still created
      expect(mockSupabase.from).toHaveBeenCalledWith('billing_transactions')
    })

    it('should handle subscription not found', async () => {
      // Mock subscription lookup failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const body = JSON.stringify(chargeSuccessEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500) // Error response
    })
  })

  describe('POST - subscription.create', () => {
    const subscriptionCreateEvent = {
      event: 'subscription.create',
      data: {
        customer: {
          customer_code: 'CUS_abc123',
          email: 'test@example.com',
        },
        subscription_code: 'SUB_123',
        plan: {
          name: 'Starter Plan',
        },
      },
    }

    it('should update subscription with Paystack details', async () => {
      // Mock subscription update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      const body = JSON.stringify(subscriptionCreateEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual({ status: 'success' })

      // Verify subscription was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          paystack_subscription_code: 'SUB_123',
          status: 'active',
          updated_at: expect.any(String),
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('paystack_customer_code', 'CUS_abc123')
    })
  })

  describe('POST - subscription.disable', () => {
    const subscriptionDisableEvent = {
      event: 'subscription.disable',
      data: {
        subscription_code: 'SUB_123',
      },
    }

    it('should cancel subscription', async () => {
      // Mock subscription update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      const body = JSON.stringify(subscriptionDisableEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual({ status: 'success' })

      // Verify subscription was cancelled
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelled_at: expect.any(String),
          updated_at: expect.any(String),
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('paystack_subscription_code', 'SUB_123')
    })
  })

  describe('POST - unhandled events', () => {
    it('should return success for unhandled events', async () => {
      const unknownEvent = {
        event: 'unknown.event',
        data: { some: 'data' },
      }

      const body = JSON.stringify(unknownEvent)
      const signature = createSignature(body)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': signature,
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual({ status: 'ignored' })
    })
  })

  describe('POST - signature verification', () => {
    it('should reject requests with invalid signature', async () => {
      const event = { event: 'charge.success', data: {} }
      const body = JSON.stringify(event)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'x-paystack-signature': 'invalid-signature',
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result).toEqual({ error: 'Invalid signature' })
    })

    it('should reject requests without signature', async () => {
      const event = { event: 'charge.success', data: {} }
      const body = JSON.stringify(event)

      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body,
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result).toEqual({ error: 'Invalid signature' })
    })
  })

  describe('POST - error handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'x-paystack-signature': 'dummy',
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500) // Error response
    })
  })
})

// Helper function to create valid Paystack signature
function createSignature(body: string): string {
  return crypto.createHmac('sha512', 'test-secret').update(body).digest('hex')
}
