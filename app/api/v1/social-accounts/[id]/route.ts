/**
 * DELETE /api/v1/social-accounts/[id]
 * Disconnect social media account
 *
 * @tags Social Accounts
 * @security BearerAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { disconnectSocialAccountSchema } from '@/lib/validation/social-account'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'

export const runtime = 'edge'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accountId = params.id

    // Validate account ID
    const validatedData = disconnectSocialAccountSchema.parse({ accountId })

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

    // Get account details and verify ownership
    const { data: account, error: fetchError } = await supabase
      .from('social_media_accounts')
      .select('id, platform, account_name, connection_status')
      .eq('id', validatedData.accountId)
      .eq('owner_user_id', user.id)
      .single()

    if (fetchError || !account) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Social media account not found.',
        },
        { status: 404 }
      )
    }

    // Soft delete by updating status to 'disconnected'
    // In production, you might want to actually delete or mark as deleted
    const { error: updateError } = await supabase
      .from('social_media_accounts')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.accountId)
      .eq('owner_user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Log successful disconnection
    logger.info('Social account disconnected', {
      userId: user.id,
      accountId: validatedData.accountId,
      platform: account.platform,
      accountName: account.account_name,
    })

    // Return success response
    return NextResponse.json({
      message: 'Social media account disconnected successfully.',
      account: {
        id: account.id,
        platform: account.platform,
        account_name: account.account_name,
        connection_status: 'disconnected',
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
