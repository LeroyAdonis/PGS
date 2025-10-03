import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

// Validation schemas
const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  search: z.string().optional(),
})

export const runtime = 'edge'

// GET /api/v1/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          status: 401,
          title: 'Unauthorized',
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/forbidden',
          status: 403,
          title: 'Forbidden',
          detail: 'Admin access required',
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    }

    const validatedParams = listUsersSchema.parse(queryParams)
    const { page, limit, status, search } = validatedParams

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        display_name,
        role,
        account_status,
        created_at,
        updated_at,
        business_profiles (
          business_name,
          industry,
          subscription_tier,
          automation_eligible_at
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('account_status', status)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      logger.error('Failed to fetch users', { error: usersError, userId: user.id })
      return handleError(usersError, request.url)
    }

    // Get total count for pagination
    let countQuery = supabase.from('users').select('id', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('account_status', status)
    }

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      logger.error('Failed to get user count', { error: countError, userId: user.id })
      return handleError(countError, request.url)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    logger.info('Admin listed users', {
      userId: user.id,
      page,
      limit,
      status,
      search,
      totalUsers: count,
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
