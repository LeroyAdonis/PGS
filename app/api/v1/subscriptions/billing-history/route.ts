import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { billingHistoryFiltersSchema } from '@/lib/validation/subscription'
import type { Database } from '@/lib/supabase/types'

/**
 * GET /api/v1/subscriptions/billing-history
 * Get billing transaction history with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }

    const validation = billingHistoryFiltersSchema.safeParse(filters)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { fromDate, toDate, page, limit } = validation.data

    // Get user's subscription ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Build query for billing transactions
    let query = supabase
      .from('billing_transactions')
      .select('*', { count: 'exact' })
      .eq('subscription_id', subscription.id)
      .order('transaction_date', { ascending: false })

    // Apply date filters
    if (fromDate) {
      query = query.gte('transaction_date', fromDate)
    }
    if (toDate) {
      query = query.lte('transaction_date', toDate)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: transactions, error: txError, count } = await query

    if (txError) {
      logger.error('Failed to fetch billing transactions', {
        userId: user.id,
        subscriptionId: subscription.id,
        error: txError,
      })
      return NextResponse.json(
        { error: 'Query Error', message: 'Failed to fetch billing history' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        fromDate,
        toDate,
      },
    })
  } catch (error) {
    return handleError(error, 'Failed to get billing history')
  }
}
