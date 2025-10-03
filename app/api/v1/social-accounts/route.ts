/**
 * GET /api/v1/social-accounts
 * List connected social media accounts
 *
 * @tags Social Accounts
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { listSocialAccountsFiltersSchema } from '@/lib/validation/social-account'
import { handleError } from '@/lib/errors/handler'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      platform: searchParams.get('platform') || undefined,
      status: searchParams.get('status') || undefined,
    }

    // Validate filters
    const validatedFilters = listSocialAccountsFiltersSchema.parse(filters)

    // Initialize Supabase client

    const supabase = createRouteClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required.',
        },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('social_media_accounts')
      .select(
        `
        id,
        platform,
        account_name,
        account_username,
        account_id,
        connection_status,
        connected_at,
        token_expires_at,
        created_at,
        updated_at
      `
      )
      .eq('owner_user_id', user.id)

    // Apply filters
    if (validatedFilters.platform) {
      query = query.eq('platform', validatedFilters.platform)
    }

    if (validatedFilters.status) {
      query = query.eq('connection_status', validatedFilters.status)
    }

    // Execute query
    const { data: accounts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Return accounts list
    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        account_name: account.account_name,
        account_username: account.account_username,
        account_id: account.account_id,
        connection_status: account.connection_status,
        connected_at: account.connected_at,
        token_expires_at: account.token_expires_at,
        created_at: account.created_at,
        updated_at: account.updated_at,
      })),
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
