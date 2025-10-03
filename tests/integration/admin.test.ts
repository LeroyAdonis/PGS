import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Create Supabase admin client for test setup/teardown
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

describe('Admin API Routes', () => {
  const adminEmail = `admin-${Date.now()}@purpleglowsocial.test`
  const adminPassword = 'Admin1234!@#$'
  const userEmail = `user-${Date.now()}@purpleglowsocial.test`
  const userPassword = 'User1234!@#$'

  // Cleanup function
  const cleanupUser = async (email: string) => {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users.users.find((u) => u.email === email)
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    }
  }

  beforeAll(async () => {
    // Cleanup any existing test users
    await cleanupUser(adminEmail)
    await cleanupUser(userEmail)

    // Create admin user
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Admin User',
        role: 'admin',
      },
    })

    if (adminError) throw adminError

    // Insert admin user record
    const { error: adminInsertError } = await supabaseAdmin.from('users').insert({
      id: adminData.user.id,
      email: adminEmail,
      display_name: 'Admin User',
      role: 'admin',
      account_status: 'active',
    })

    if (adminInsertError) throw adminInsertError

    // Create regular user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Test User',
        role: 'user',
      },
    })

    if (userError) throw userError

    // Insert regular user record
    const { error: userInsertError } = await supabaseAdmin.from('users').insert({
      id: userData.user.id,
      email: userEmail,
      display_name: 'Test User',
      role: 'user',
      account_status: 'active',
    })

    if (userInsertError) throw userInsertError

    // Create business profile for regular user
    const { error: profileError } = await supabaseAdmin.from('business_profiles').insert({
      user_id: userData.user.id,
      business_name: 'Test Business',
      industry: 'Technology',
      target_audience: 'Developers',
      tone: 'professional',
      topics: ['AI', 'Development'],
      language: 'en',
    })

    if (profileError) throw profileError

    // Create subscription for regular user
    const { error: subscriptionError } = await supabaseAdmin.from('subscriptions').insert({
      user_id: userData.user.id,
      tier: 'starter',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (subscriptionError) throw subscriptionError
  })

  afterAll(async () => {
    // Cleanup test users
    await cleanupUser(adminEmail)
    await cleanupUser(userEmail)
  })

  describe('GET /api/v1/admin/users', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users`)
      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      // Sign in as regular user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      })
      expect(response.status).toBe(403)
    })

    it('should return paginated user list for admin users', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('pagination')
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users.length).toBeGreaterThan(0)
    })

    it('should filter users by role', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users?role=user`, {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.users.every((user: any) => user.role === 'user')).toBe(true)
    })

    it('should search users by email', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/users?search=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${signInData.session?.access_token}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.users.some((user: any) => user.email === userEmail)).toBe(true)
    })
  })

  describe('POST /api/v1/admin/users/[id]/suspend', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/123/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Test suspension' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      // Sign in as regular user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/123/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
        body: JSON.stringify({ reason: 'Test suspension' }),
      })
      expect(response.status).toBe(403)
    })

    it('should suspend user successfully', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      // Get user ID
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const user = users.users.find((u) => u.email === userEmail)
      if (!user) throw new Error('Test user not found')

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
        body: JSON.stringify({ reason: 'Test suspension for integration test' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data.user.account_status).toBe('suspended')
      expect(data.user.suspension_reason).toBe('Test suspension for integration test')
      expect(data.user.suspended_at).toBeDefined()
    })

    it('should return 404 for non-existent user', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/users/00000000-0000-0000-0000-000000000000/suspend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${signInData.session?.access_token}`,
          },
          body: JSON.stringify({ reason: 'Test suspension' }),
        }
      )
      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/v1/admin/metrics', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/metrics`)
      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      // Sign in as regular user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      })
      expect(response.status).toBe(403)
    })

    it('should return platform metrics for admin users', async () => {
      // Sign in as admin
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
      if (signInError) throw signInError

      const response = await fetch(`${apiBaseUrl}/api/v1/admin/metrics`, {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('userMetrics')
      expect(data).toHaveProperty('subscriptionMetrics')
      expect(data).toHaveProperty('postMetrics')
      expect(data).toHaveProperty('revenueMetrics')
      expect(data).toHaveProperty('engagementMetrics')
      expect(data).toHaveProperty('timestamp')
    })
  })
})
