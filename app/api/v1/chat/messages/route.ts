import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { logger } from '@/lib/logging/logger'
import { z } from 'zod'

// Validation schemas
const createMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sender: z.enum(['user', 'system']).default('user'),
  interpreted_command: z.string().max(100).optional(),
  command_parameters: z.record(z.any()).optional(),
  resulting_action: z.string().optional(),
})

const getMessagesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export const runtime = 'edge'

/**
 * POST /api/v1/chat/messages
 *
 * Creates a new chat message in the conversation.
 * Used by CopilotKit to store user and assistant messages.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Create chat message
    const { data: message, error: insertError } = await (supabase as any)
      .from('chat_messages')
      .insert({
        user_id: user.id,
        message_text: validatedData.message,
        sender: validatedData.sender,
        interpreted_command: validatedData.interpreted_command,
        command_parameters: validatedData.command_parameters,
        resulting_action: validatedData.resulting_action,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Failed to create chat message', {
        userId: user.id,
        error: insertError,
      })
      throw insertError
    }

    if (!message) {
      throw new Error('Failed to create message')
    }

    logger.info('Chat message created', {
      userId: user.id,
      messageId: (message as any).id,
      sender: validatedData.sender,
      messageLength: validatedData.message.length,
    })

    return NextResponse.json(
      {
        id: (message as any).id,
        message: (message as any).message_text,
        sender: (message as any).sender,
        interpreted_command: (message as any).interpreted_command,
        command_parameters: (message as any).command_parameters,
        resulting_action: (message as any).resulting_action,
        created_at: (message as any).created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error, request.url)
  }
}

/**
 * GET /api/v1/chat/messages
 *
 * Retrieves chat message history for the authenticated user.
 * Supports pagination for efficient loading.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          type: 'https://api.purpleglowsocial.co.za/errors/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    }

    const validatedParams = getMessagesSchema.parse(queryParams)

    // Get total count for pagination metadata
    const { count: totalCount, error: countError } = await (supabase as any)
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      logger.error('Failed to get chat messages count', {
        userId: user.id,
        error: countError,
      })
      throw countError
    }

    // Get paginated messages
    const { data: messages, error: fetchError } = await (supabase as any)
      .from('chat_messages')
      .select(
        'id, message_text, sender, interpreted_command, command_parameters, resulting_action, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)

    if (fetchError) {
      logger.error('Failed to fetch chat messages', {
        userId: user.id,
        error: fetchError,
      })
      throw fetchError
    }

    // Reverse to show chronological order (oldest first)
    const chronologicalMessages = messages?.reverse() || []

    logger.info('Chat messages retrieved', {
      userId: user.id,
      count: chronologicalMessages.length,
      totalCount,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    })

    return NextResponse.json({
      messages: chronologicalMessages.map((msg: any) => ({
        id: msg.id,
        message: msg.message_text,
        sender: msg.sender,
        interpreted_command: msg.interpreted_command,
        command_parameters: msg.command_parameters,
        resulting_action: msg.resulting_action,
        created_at: msg.created_at,
      })),
      pagination: {
        total: totalCount || 0,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        has_more: validatedParams.offset + validatedParams.limit < (totalCount || 0),
      },
    })
  } catch (error) {
    return handleError(error, request.url)
  }
}
