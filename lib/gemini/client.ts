import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Initialize Google Gemini API client
 * Supports both text generation (Gemini 1.5 Pro) and image generation (Gemini 2.5 Flash)
 */
export function createGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable')
  }

  return new GoogleGenerativeAI(apiKey)
}

/**
 * Get text generation model (Gemini 1.5 Pro)
 */
export function getTextModel() {
  const genAI = createGeminiClient()
  return genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })
}

/**
 * Get image generation model (Gemini 2.5 Flash Image Preview)
 */
export function getImageModel() {
  const genAI = createGeminiClient()
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
}
