import { getTextModel } from './client'
import type { GeneratePostRequest, GeneratePostResponse, RegeneratePostRequest } from './types'
import {
  buildTextGenerationPrompt,
  buildRegenerationPrompt,
  buildImagePromptExtractionPrompt,
} from './prompts'

/**
 * Generate social media post caption using Google Gemini 1.5 Pro
 * Supports 11 South African languages with culturally appropriate content
 */
export async function generatePostCaption(
  request: GeneratePostRequest
): Promise<GeneratePostResponse> {
  const model = getTextModel()
  const prompt = buildTextGenerationPrompt(
    request.businessProfile,
    request.language,
    request.platform,
    request.topic
  )

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response (Gemini sometimes wraps in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response: no JSON found in output')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate response structure
    if (!parsed.caption || !parsed.hashtags || !parsed.suggestedImagePrompt) {
      throw new Error('Invalid response structure from Gemini')
    }

    return {
      caption: parsed.caption,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      suggestedImagePrompt: parsed.suggestedImagePrompt,
      language: request.language,
      platform: request.platform,
    }
  } catch (error) {
    console.error('Gemini text generation error:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to generate post caption: ${error.message}`
        : 'Failed to generate post caption'
    )
  }
}

/**
 * Regenerate post caption with fresh wording (same topic)
 * Useful when user wants a different version of the same content
 */
export async function regeneratePostCaption(
  request: RegeneratePostRequest
): Promise<GeneratePostResponse> {
  const model = getTextModel()
  const prompt = buildRegenerationPrompt(
    request.originalCaption,
    request.businessProfile,
    request.language,
    request.platform
  )

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      caption: parsed.caption,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      suggestedImagePrompt: parsed.suggestedImagePrompt,
      language: request.language,
      platform: request.platform,
    }
  } catch (error) {
    console.error('Gemini regeneration error:', error)
    throw new Error('Failed to regenerate post caption')
  }
}

/**
 * Extract or generate an image prompt from a user-provided caption
 * Used when user writes their own caption and needs an AI-generated image
 */
export async function extractImagePrompt(caption: string, businessName: string): Promise<string> {
  const model = getTextModel()
  const prompt = buildImagePromptExtractionPrompt(caption, businessName)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const imagePrompt = response.text().trim()

    return imagePrompt
  } catch (error) {
    console.error('Gemini image prompt extraction error:', error)
    throw new Error('Failed to extract image prompt from caption')
  }
}
