import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v1/health/route'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn(),
}

const mockCreateClient = require('@supabase/supabase-js').createClient

describe('/api/v1/health', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env }

    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.npm_package_version = '1.0.0'

    // Reset mocks
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('GET /api/v1/health', () => {
    it('should return healthy status when database is accessible', async () => {
      // Mock successful database query
      mockSupabaseClient.select.mockResolvedValue({
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services.database.status).toBe('healthy')
      expect(data.services.api.status).toBe('healthy')
      expect(data.checks.database_connection).toBe(true)
      expect(data.checks.database_query).toBe(true)
      expect(data.checks.response_time).toBe(true)
      expect(data.version).toBe('1.0.0')
      expect(data.services.api.environment).toBe('test')
      expect(typeof data.uptime).toBe('number')
      expect(typeof data.services.database.latency).toBe('number')
    })

    it('should return unhealthy status when database query fails', async () => {
      // Mock database query failure
      mockSupabaseClient.select.mockResolvedValue({
        error: new Error('Database connection failed'),
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.services.database.status).toBe('unhealthy')
      expect(data.services.database.error).toBe('Database connection failed')
      expect(data.services.api.status).toBe('healthy')
      expect(data.checks.database_connection).toBe(false)
      expect(data.checks.database_query).toBe(false)
    })

    it('should return unhealthy status when database throws exception', async () => {
      // Mock database exception
      mockSupabaseClient.select.mockRejectedValue(new Error('Connection timeout'))

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.services.database.status).toBe('unhealthy')
      expect(data.services.database.error).toBe('Connection timeout')
      expect(data.checks.database_connection).toBe(false)
    })

    it('should return unhealthy status when response time is too slow', async () => {
      // Mock successful but slow database query
      mockSupabaseClient.select.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 1500))
      )

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.services.database.status).toBe('healthy')
      expect(data.checks.response_time).toBe(false)
    })

    it('should include proper cache control headers', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle missing environment variables gracefully', async () => {
      // Mock createClient to throw error when env vars are missing
      mockCreateClient.mockImplementationOnce(() => {
        throw new Error('Missing Supabase configuration')
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.services.database.status).toBe('unhealthy')
      expect(data.services.database.error).toContain('Missing Supabase configuration')
    })

    it('should include timestamp in ISO format', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should use default version when npm_package_version is not set', async () => {
      delete process.env.npm_package_version

      mockSupabaseClient.select.mockResolvedValue({
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/health')
      const response = await GET(request)
      const data = await response.json()

      expect(data.version).toBe('1.0.0')
      expect(data.services.api.version).toBe('1.0.0')
    })
  })
})
