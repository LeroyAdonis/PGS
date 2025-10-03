/**
 * Prompt templates for Google Gemini text generation
 * Supports 11 South African official languages
 */

import type { SupportedLanguage, SocialPlatform, BusinessProfile } from './types'

/**
 * Language-specific instructions for culturally appropriate content
 */
const LANGUAGE_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  en: 'Use clear, engaging English suitable for South African audiences. Include local references and cultural context where appropriate.',
  af: 'Skryf in duidelike, vlot Afrikaans wat geskik is vir Suid-Afrikaanse gehore. Sluit plaaslike verwysings en kulturele konteks in waar toepaslik.',
  zu: 'Bhala ngesiZulu esicacile nesihehayo esifanele izethameli zaseNingizimu Afrika. Faka izinkomba zendawo namasiko lapho kufanele.',
  xh: 'Bhala ngesiXhosa esicacileyo nesinomtsalane esifanelekele abaphulaphuli baseMzantsi Afrika. Faka izalathiso zalapha kunye nenkcubeko apho kufanelekile.',
  nso: 'Ngwala ka Sesotho sa Leboa se se kwagalago le se se kgahlišago se se swanetšego bakwedi ba Afrika Borwa. Akaretša ditšhupetšo tša lefelo le polelo ya setšo moo go swanetšego.',
  st: 'Ngola ka Sesotho se hlakileng le se khahlang se loketseng barati ba Afrika Borwa. Kenya ditshupiso tsa lehae le moetlo moo ho lokelang.',
  ss: 'Bhala ngesiSwati lesicacile nelikhangako lelilungele bantfu baseNingizimu Afrika. Faka tinkhombo tetindzawo nemasiko lapho kufanele.',
  ts: 'Tsala hi Xitsonga lexi nga erivalaka na lexi khumbekaka lexi faneleke vayingiseri va Afrika Dzonga. Engetela swikombiso swa laha na ndhavuko laha swi lavekaka.',
  tn: 'Kwala ka Setswana se se utlwalang bonolo le se se kgatlhang se se tshwanetseng badiragatsi ba Aforika Borwa. Tlhoma dintlha tsa mo gae le ngwao fa go tlhokega.',
  ve: 'Ṅwalani nga Tshivenda tshe dzi vhonalaho na tshe dzi tama tshe dzi fanelaho vhafunzi vha Afrika Tshipembe. Dzhenisani zwidodombedzwa zwa fhano na mvelele hu tshi tea.',
  nr: 'Loba ngesiNdebele esicacileyo nesithandekayo esifanele ababukeli baseNingizimu Afrika. Faka izinkomba zalapha namasiko lapho kudingakala.',
}

/**
 * Platform-specific character limits and best practices
 */
const PLATFORM_GUIDELINES: Record<SocialPlatform, { maxLength: number; bestPractice: string }> = {
  facebook: {
    maxLength: 5000,
    bestPractice:
      'Use conversational tone. Posts with 40-80 characters get highest engagement. Include questions to encourage comments.',
  },
  instagram: {
    maxLength: 2200,
    bestPractice:
      'Use emojis strategically. Front-load important content. Use line breaks for readability. Maximum 30 hashtags.',
  },
  twitter: {
    maxLength: 280,
    bestPractice:
      'Be concise and punchy. Use 1-2 hashtags maximum. Leave room for retweets with comments. Include call-to-action.',
  },
  linkedin: {
    maxLength: 3000,
    bestPractice:
      'Professional tone. First 2-3 lines visible in feed - make them count. Use industry-specific language. Include data or insights.',
  },
}

/**
 * Content tone descriptions for prompt clarity
 */
const TONE_DESCRIPTIONS: Record<string, string> = {
  professional:
    'Authoritative, credible, and expert. Use industry terminology. Maintain formality.',
  casual: 'Friendly, relaxed, and approachable. Use everyday language. Feel conversational.',
  friendly: 'Warm, supportive, and personable. Build connections. Show empathy and understanding.',
  formal:
    'Polished, sophisticated, and official. Use proper grammar. Maintain distance and respect.',
  humorous: 'Witty, playful, and entertaining. Use appropriate humor. Keep it light but relevant.',
}

/**
 * Build a comprehensive prompt for text generation
 */
export function buildTextGenerationPrompt(
  businessProfile: BusinessProfile,
  language: SupportedLanguage,
  platform: SocialPlatform,
  topic?: string
): string {
  const platformGuide = PLATFORM_GUIDELINES[platform]
  const languageInstruction = LANGUAGE_INSTRUCTIONS[language]
  const toneDescription = TONE_DESCRIPTIONS[businessProfile.tone] || businessProfile.tone

  return `You are an expert social media content creator specializing in South African businesses.

**Business Context:**
- Business Name: ${businessProfile.name}
- Industry: ${businessProfile.industry}
- Target Audience: ${businessProfile.targetAudience}
- Content Tone: ${toneDescription}
- Key Topics: ${businessProfile.topics.join(', ')}

**Content Requirements:**
- Language: ${language}
- Platform: ${platform}
- Character Limit: ${platformGuide.maxLength}
${topic ? `- Specific Topic: ${topic}` : '- Topic: Choose from the business key topics above'}

**Language Instructions:**
${languageInstruction}

**Platform Best Practices:**
${platformGuide.bestPractice}

**Task:**
Generate a ${platform} post that:
1. Is written in ${language}
2. Follows the ${businessProfile.tone} tone
3. Engages the target audience (${businessProfile.targetAudience})
4. Is between 50-300 words (or within platform limits)
5. Includes 3-10 relevant hashtags (without # prefix)
6. Provides a detailed image prompt for AI image generation
7. Is culturally appropriate for South African audiences
8. Follows platform-specific best practices

**Output Format (JSON only, no additional text):**
{
  "caption": "the post text in ${language}",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggestedImagePrompt": "detailed English description for image generation (mention brand colors, style, mood, key elements)"
}

Generate creative, engaging content that would perform well on ${platform} and resonate with ${businessProfile.targetAudience}.`
}

/**
 * Build a simplified prompt for caption regeneration (keeps same topic/structure)
 */
export function buildRegenerationPrompt(
  originalCaption: string,
  businessProfile: BusinessProfile,
  language: SupportedLanguage,
  platform: SocialPlatform
): string {
  return `Rewrite this ${platform} post while maintaining the same topic and core message but with fresh wording and style.

**Original Post:**
${originalCaption}

**Business Context:**
- Tone: ${businessProfile.tone}
- Industry: ${businessProfile.industry}
- Target Audience: ${businessProfile.targetAudience}

**Requirements:**
- Keep the same language (${language})
- Maintain similar length
- Use different wording and phrases
- Keep it engaging and on-brand
- Include 3-10 hashtags
- Provide an image prompt

**Output Format (JSON only):**
{
  "caption": "the rewritten post text",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggestedImagePrompt": "image generation prompt"
}`
}

/**
 * Build prompt for extracting image prompt from user-provided caption
 */
export function buildImagePromptExtractionPrompt(caption: string, businessName: string): string {
  return `Extract or create a detailed image generation prompt from this social media post caption.

**Business:** ${businessName}
**Caption:** ${caption}

Generate a detailed prompt that would create a visually appealing image to accompany this post. The prompt should:
- Describe the main subject/scene
- Specify style (professional, minimalist, vibrant, etc.)
- Include mood/emotion
- Mention colors if relevant
- Be specific enough for AI image generation

**Output Format (text only, no JSON):**
[your detailed image generation prompt here]`
}

/**
 * Image generation style presets for Gemini 2.5 Flash Image Preview
 * Based on Google's prompt engineering guidelines
 */
export const IMAGE_STYLES = {
  photorealistic: {
    prefix: 'A photorealistic image of',
    style: 'high-quality photography, natural lighting, detailed textures, realistic colors',
  },
  illustration: {
    prefix: 'A digital illustration of',
    style: 'vibrant colors, artistic style, clean lines, professional illustration',
  },
  minimalist: {
    prefix: 'A minimalist design showing',
    style: 'simple composition, clean background, focused subject, modern aesthetic',
  },
  product: {
    prefix: 'A product photography shot of',
    style: 'studio lighting, white background, professional product photo, sharp focus',
  },
  lifestyle: {
    prefix: 'A lifestyle photograph showing',
    style: 'natural setting, authentic moments, warm lighting, relatable scene',
  },
} as const

export type ImageStyle = keyof typeof IMAGE_STYLES

/**
 * Enhances an image prompt with style-specific details for better generation
 * Follows Google's guidelines: "Describe the scene, don't just list keywords"
 */
export function enhanceImagePrompt(
  basePrompt: string,
  style: ImageStyle = 'photorealistic'
): string {
  const styleConfig = IMAGE_STYLES[style]

  // If prompt already starts with style prefix, don't duplicate
  const normalizedPrompt = basePrompt.trim()
  const lowerPrompt = normalizedPrompt.toLowerCase()

  if (
    lowerPrompt.startsWith('a photorealistic') ||
    lowerPrompt.startsWith('a digital illustration') ||
    lowerPrompt.startsWith('a minimalist design') ||
    lowerPrompt.startsWith('a product photography')
  ) {
    // Prompt already has style, just add quality details
    return `${normalizedPrompt}. Style: ${styleConfig.style}`
  }

  // Add style prefix and details
  return `${styleConfig.prefix} ${normalizedPrompt}. Style: ${styleConfig.style}`
}
