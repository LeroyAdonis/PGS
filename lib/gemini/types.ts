/**
 * TypeScript types for Google Gemini API interactions
 */

export type SupportedLanguage =
  | 'en' // English
  | 'af' // Afrikaans
  | 'zu' // Zulu
  | 'xh' // Xhosa
  | 'nso' // Northern Sotho
  | 'st' // Southern Sotho
  | 'ss' // Swazi
  | 'ts' // Tsonga
  | 'tn' // Tswana
  | 've' // Venda
  | 'nr' // Ndebele

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin'

export interface BusinessProfile {
  name: string
  industry: string
  tone: string
  targetAudience: string
  topics: string[]
}

export interface GeneratePostRequest {
  businessProfile: BusinessProfile
  language: SupportedLanguage
  platform: SocialPlatform
  topic?: string // Optional user override
}

export interface RegeneratePostRequest {
  originalCaption: string
  businessProfile: BusinessProfile
  language: SupportedLanguage
  platform: SocialPlatform
}

export interface GeneratePostResponse {
  caption: string
  hashtags: string[]
  suggestedImagePrompt: string
  language: SupportedLanguage
  platform: SocialPlatform
}

/**
 * Image generation style presets
 */
export type ImageStyle =
  | 'photorealistic' // High-quality photography
  | 'illustration' // Digital illustration/artwork
  | 'minimalist' // Simple, clean design
  | 'product' // Product photography style
  | 'lifestyle' // Lifestyle photography
