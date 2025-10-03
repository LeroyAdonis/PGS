import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/v1/chat/messages/route'
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

describe('/api/v1/chat/messages', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('POST - create message', () => {
    const validMessage = {
      message: 'Generate 3 posts about our new product launch',
      sender: 'user' as const,
      interpreted_command: 'generate_posts',
      command_parameters: { count: 3, topic: 'product launch' },
      resulting_action: 'Posts will be generated with AI',
    }

    it('should create a chat message successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      // Mock message creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'msg_123',
          message_text: validMessage.message,
          sender: validMessage.sender,
          interpreted_command: validMessage.interpreted_command,
          command_parameters: validMessage.command_parameters,
          resulting_action: validMessage.resulting_action,
          created_at: '2025-01-01T10:00:00Z',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'POST',
        body: JSON.stringify(validMessage),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result).toEqual({
        id: 'msg_123',
        message: validMessage.message,
        sender: validMessage.sender,
        interpreted_command: validMessage.interpreted_command,
        command_parameters: validMessage.command_parameters,
        resulting_action: validMessage.resulting_action,
        created_at: '2025-01-01T10:00:00Z',
      })

      // Verify database call
      expect(mockSupabase.from).toHaveBeenCalledWith('chat_messages')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_123',
          message_text: validMessage.message,
          sender: validMessage.sender,
          interpreted_command: validMessage.interpreted_command,
          command_parameters: validMessage.command_parameters,
          resulting_action: validMessage.resulting_action,
        })
      )
    })

    it('should create message with minimal required fields', async () => {
      const minimalMessage = {
        message: 'Hello',
        sender: 'user' as const,
      }

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'msg_124',
          message_text: minimalMessage.message,
          sender: minimalMessage.sender,
          interpreted_command: null,
          command_parameters: null,
          resulting_action: null,
          created_at: '2025-01-01T10:00:00Z',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'POST',
        body: JSON.stringify(minimalMessage),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.message).toBe('Hello')
      expect(result.sender).toBe('user')
    })

    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'POST',
        body: JSON.stringify(validMessage),
        headers: {
          'content-type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.detail).toBe('Authentication required')
    })

    it('should validate message length', async () => {
      const longMessage = {
        message: 'a'.repeat(2001), // Too long
        sender: 'user' as const,
      }

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'POST',
        body: JSON.stringify(longMessage),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400) // Validation error
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'POST',
        body: JSON.stringify(validMessage),
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token123',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500) // Error response
    })
  })

  describe('GET - retrieve messages', () => {
    it('should retrieve chat messages with pagination', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      // Mock count query
      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ count: 5, error: null }),
      })

      // Mock messages query
      const mockMessages = [
        {
          id: 'msg_1',
          message_text: 'Hello',
          sender: 'user',
          interpreted_command: null,
          command_parameters: null,
          resulting_action: null,
          created_at: '2025-01-01T09:00:00Z',
        },
        {
          id: 'msg_2',
          message_text: 'Hi there!',
          sender: 'system',
          interpreted_command: 'greet',
          command_parameters: {},
          resulting_action: 'Greeting sent',
          created_at: '2025-01-01T09:01:00Z',
        },
      ]

      mockSupabase.range.mockResolvedValueOnce({
        data: mockMessages.reverse(), // Reverse for chronological order
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages?limit=10&offset=0', {
        method: 'GET',
        headers: {
          authorization: 'Bearer token123',
        },
      })

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0].message).toBe('Hello')
      expect(result.messages[1].message).toBe('Hi there!')
      expect(result.pagination.total).toBe(5)
      expect(result.pagination.has_more).toBe(false)
    })

    it('should handle empty message history', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ count: 0, error: null }),
      })

      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'GET',
        headers: {
          authorization: 'Bearer token123',
        },
      })

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.messages).toEqual([])
      expect(result.pagination.total).toBe(0)
    })

    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages', {
        method: 'GET',
      })

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.detail).toBe('Authentication required')
    })

    it('should validate pagination parameters', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/chat/messages?limit=150&offset=-1', {
        method: 'GET',
        headers: {
          authorization: 'Bearer token123',
        },
      })

      const response = await GET(request)

      expect(response.status).toBe(400) // Validation error for invalid params
    })
  })
})
