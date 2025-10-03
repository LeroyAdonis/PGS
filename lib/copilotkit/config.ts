/**
 * CopilotKit Configuration
 * 
 * This file configures the CopilotKit provider for the Purple Glow Social application.
 * CopilotKit provides an AI-powered chat assistant to help users with social media tasks.
 */

/**
 * CopilotKit API Configuration
 */
export const copilotConfig = {
  /**
   * API endpoint for chat messages
   * This endpoint handles the conversational AI requests
   */
  apiEndpoint: '/api/v1/chat/messages',

  /**
   * Max tokens for AI responses
   */
  maxTokens: 500,

  /**
   * Temperature for AI model (0-1)
   * Lower = more focused, Higher = more creative
   */
  temperature: 0.7,

  /**
   * System prompt for the AI assistant
   */
  systemPrompt: `You are an AI assistant for Purple Glow Social, a social media management platform for South African businesses.
Your role is to help users:
- Generate engaging social media post captions
- Suggest relevant hashtags
- Provide social media strategy advice
- Answer questions about platform features
- Help with content scheduling

Always be helpful, professional, and culturally aware of the South African context.
Support all 11 official languages when appropriate.`,

  /**
   * Feature flags
   */
  features: {
    /**
     * Enable post generation suggestions
     */
    postGeneration: true,

    /**
     * Enable hashtag suggestions
     */
    hashtagSuggestions: true,

    /**
     * Enable scheduling assistance
     */
    schedulingAssistance: true,

    /**
     * Enable analytics insights
     */
    analyticsInsights: true,
  },
}

/**
 * Available chat actions
 * These are special commands the AI can execute
 */
export const chatActions = {
  GENERATE_POST: 'generate_post',
  SUGGEST_HASHTAGS: 'suggest_hashtags',
  SCHEDULE_POST: 'schedule_post',
  GET_ANALYTICS: 'get_analytics',
  CONNECT_ACCOUNT: 'connect_account',
} as const

export type ChatAction = typeof chatActions[keyof typeof chatActions]

/**
 * Chat message interface
 */
export interface ChatMessageData {
  id: string
  message: string
  sender: 'user' | 'system'
  timestamp: Date
  action?: ChatAction
  metadata?: Record<string, unknown>
}
