import axios, { type AxiosInstance } from 'axios'

/**
 * Paystack API client for ZAR billing and subscription management
 * API Documentation: https://paystack.com/docs/api/
 */
export class PaystackClient {
  private client: AxiosInstance
  private secretKey: string

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || ''

    if (!this.secretKey) {
      throw new Error('Missing PAYSTACK_SECRET_KEY environment variable')
    }

    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Initialize a transaction (payment)
   */
  async initializeTransaction(params: {
    email: string
    amount: number // Amount in cents (kobo for ZAR)
    reference: string
    callback_url?: string
    metadata?: Record<string, unknown>
  }) {
    const response = await this.client.post('/transaction/initialize', params)
    return response.data
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string) {
    const response = await this.client.get(`/transaction/verify/${reference}`)
    return response.data
  }

  /**
   * Create a subscription plan
   */
  async createPlan(params: {
    name: string
    amount: number
    interval: 'monthly' | 'annually'
    currency?: string
  }) {
    const response = await this.client.post('/plan', {
      ...params,
      currency: params.currency || 'ZAR',
    })
    return response.data
  }

  /**
   * Subscribe a customer to a plan
   */
  async createSubscription(params: { customer: string; plan: string; authorization: string }) {
    const response = await this.client.post('/subscription', params)
    return response.data
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(code: string, token: string) {
    const response = await this.client.post('/subscription/disable', {
      code,
      token,
    })
    return response.data
  }

  /**
   * Get customer details
   */
  async getCustomer(emailOrCode: string) {
    const response = await this.client.get(`/customer/${emailOrCode}`)
    return response.data
  }
}

/**
 * Singleton instance of Paystack client
 */
export const paystackClient = new PaystackClient()
