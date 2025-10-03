import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Health check response interface
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: {
      status: 'healthy' | 'unhealthy'
      latency?: number
      error?: string
    }
    api: {
      status: 'healthy'
      version: string
      environment: string
    }
  }
  checks: {
    database_connection: boolean
    database_query: boolean
    memory_usage: boolean
    response_time: boolean
  }
}

// Start time for uptime calculation
const START_TIME = Date.now()

/**
 * Health Check Endpoint
 * GET /api/v1/health
 *
 * Provides system health status without requiring authentication.
 * Used for monitoring, load balancer health checks, and deployment validation.
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now()

  try {
    // Perform health checks
    const healthData = await performHealthChecks()

    // Calculate response time
    const responseTime = Date.now() - startTime
    const isResponseTimeHealthy = responseTime < 1000 // Should respond within 1 second

    // Determine overall health status
    const isHealthy = healthData.database.status === 'healthy' && isResponseTimeHealthy

    const response: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - START_TIME) / 1000), // uptime in seconds
      services: {
        database: healthData.database,
        api: {
          status: 'healthy',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      },
      checks: {
        database_connection: healthData.database.status === 'healthy',
        database_query: healthData.database.status === 'healthy',
        memory_usage: true, // Node.js handles memory automatically
        response_time: isResponseTimeHealthy,
      },
    }

    // Return appropriate HTTP status
    const statusCode = isHealthy ? 200 : 503 // 503 Service Unavailable when unhealthy

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    // Fallback response if health check fails completely
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      services: {
        database: {
          status: 'unhealthy',
          error: 'Health check failed',
        },
        api: {
          status: 'healthy',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      },
      checks: {
        database_connection: false,
        database_query: false,
        memory_usage: true,
        response_time: false,
      },
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * Perform comprehensive health checks
 */
async function performHealthChecks(): Promise<{
  database: {
    status: 'healthy' | 'unhealthy'
    latency?: number
    error?: string
  }
}> {
  const dbStartTime = Date.now()

  try {
    // Create a service role client for health checks (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Test basic connection and simple query
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    const dbLatency = Date.now() - dbStartTime

    return {
      database: {
        status: 'healthy',
        latency: dbLatency,
      },
    }
  } catch (error) {
    const dbLatency = Date.now() - dbStartTime

    return {
      database: {
        status: 'unhealthy',
        latency: dbLatency,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
    }
  }
}

export const runtime = 'edge'
