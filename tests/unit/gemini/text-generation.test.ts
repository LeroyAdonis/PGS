/**
 * Unit tests for Google Gemini text generation service
 * Tests all 11 South African languages and platform-specific generation
 */

import {
  generatePostCaption,
  regeneratePostCaption,
  extractImagePrompt,
} from '@/lib/gemini/text-generation'
import type {
  GeneratePostRequest,
  RegeneratePostRequest,
  SupportedLanguage,
} from '@/lib/gemini/types'
import * as geminiClient from '@/lib/gemini/client'

// Mock the Gemini client module
jest.mock('@/lib/gemini/client')

describe('Gemini Text Generation Service', () => {
  const mockBusinessProfile = {
    name: "Joe's Plumbing",
    industry: 'Plumbing Services',
    tone: 'professional',
    targetAudience: 'Homeowners in Johannesburg',
    topics: ['emergency repairs', 'drain cleaning', 'water heater installation'],
  }

  const mockGenerateContent = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(geminiClient.getTextModel as jest.Mock).mockReturnValue({
      generateContent: mockGenerateContent,
    })
  })

  describe('generatePostCaption', () => {
    const languages: SupportedLanguage[] = [
      'en',
      'af',
      'zu',
      'xh',
      'nso',
      'st',
      'ss',
      'ts',
      'tn',
      've',
      'nr',
    ]

    test.each(languages)(
      'should generate post caption in %s language',
      async (language: SupportedLanguage) => {
        // Mock Gemini API response
        mockGenerateContent.mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                caption: `Test caption in ${language}`,
                hashtags: ['plumbing', 'emergency', 'joburg'],
                suggestedImagePrompt: 'Professional plumber fixing pipes',
              }),
          },
        })

        const request: GeneratePostRequest = {
          businessProfile: mockBusinessProfile,
          language,
          platform: 'facebook',
          topic: 'emergency plumbing services',
        }

        const result = await generatePostCaption(request)

        expect(result).toMatchObject({
          caption: expect.stringContaining('Test caption'),
          hashtags: expect.arrayContaining(['plumbing', 'emergency', 'joburg']),
          suggestedImagePrompt: expect.stringContaining('plumber'),
          language,
          platform: 'facebook',
        })
        expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(language))
      }
    )

    test('should generate platform-specific content for Facebook', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: 'Engaging Facebook post with questions to encourage comments',
              hashtags: ['plumbing', 'joburg', 'homeowners'],
              suggestedImagePrompt: 'Friendly plumber smiling',
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      const result = await generatePostCaption(request)

      expect(result.caption).toBeTruthy()
      expect(result.hashtags.length).toBeGreaterThan(0)
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('facebook'))
    })

    test('should generate platform-specific content for Instagram', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: '💧 Quality plumbing services\n\n✅ Emergency repairs\n✅ Fast response',
              hashtags: ['plumbing', 'joburg', 'homeowners', 'emergency', 'repairs'],
              suggestedImagePrompt: 'Modern plumbing tools on clean background',
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'instagram',
      }

      const result = await generatePostCaption(request)

      expect(result.caption).toBeTruthy()
      expect(result.hashtags.length).toBeLessThanOrEqual(30)
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('instagram'))
    })

    test('should generate platform-specific content for Twitter', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: '🚨 Emergency plumbing? We respond fast! 24/7 service in JHB. Call now! ☎️',
              hashtags: ['plumbing', 'joburg'],
              suggestedImagePrompt: 'Plumber with tools',
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'twitter',
      }

      const result = await generatePostCaption(request)

      expect(result.caption.length).toBeLessThanOrEqual(280)
      expect(result.hashtags.length).toBeLessThanOrEqual(2)
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('twitter'))
    })

    test('should generate platform-specific content for LinkedIn', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption:
                'Professional plumbing insights: The importance of preventative maintenance for commercial properties...',
              hashtags: ['plumbing', 'commercialservices', 'maintenance'],
              suggestedImagePrompt: 'Professional plumber in commercial setting',
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'linkedin',
      }

      const result = await generatePostCaption(request)

      expect(result.caption).toBeTruthy()
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('linkedin'))
    })

    test('should handle user-specified topic override', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: 'Winter is coming! Get your water heater checked now.',
              hashtags: ['waterheater', 'winter', 'plumbing'],
              suggestedImagePrompt: 'Water heater maintenance',
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
        topic: 'winter water heater maintenance',
      }

      const result = await generatePostCaption(request)

      expect(result.caption).toContain('water heater')
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('winter water heater maintenance')
      )
    })

    test('should validate response structure and throw error if invalid', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: 'Test caption',
              // Missing hashtags and suggestedImagePrompt
            }),
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      await expect(generatePostCaption(request)).rejects.toThrow('Invalid response structure')
    })

    test('should handle JSON parsing errors', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON',
        },
      })

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      await expect(generatePostCaption(request)).rejects.toThrow('no JSON found')
    })

    test('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API rate limit exceeded'))

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      await expect(generatePostCaption(request)).rejects.toThrow('Failed to generate post caption')
    })
  })

  describe('regeneratePostCaption', () => {
    test('should regenerate caption with fresh wording', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: 'Fresh version of the same topic',
              hashtags: ['plumbing', 'emergency'],
              suggestedImagePrompt: 'Professional plumber at work',
            }),
        },
      })

      const request: RegeneratePostRequest = {
        originalCaption: 'Original caption about emergency plumbing',
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      const result = await regeneratePostCaption(request)

      expect(result.caption).toBeTruthy()
      expect(result.hashtags.length).toBeGreaterThan(0)
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Original caption'))
    })

    test('should maintain same language when regenerating', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caption: 'Nuwe weergawe van dieselfde onderwerp',
              hashtags: ['loodgieterswerk', 'noodgeval'],
              suggestedImagePrompt: 'Loodgieter by werk',
            }),
        },
      })

      const request: RegeneratePostRequest = {
        originalCaption: 'Oorspronklike onderskrif oor noodloodgieterswerk',
        businessProfile: mockBusinessProfile,
        language: 'af',
        platform: 'facebook',
      }

      const result = await regeneratePostCaption(request)

      expect(result.language).toBe('af')
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('af'))
    })
  })

  describe('extractImagePrompt', () => {
    test('should extract detailed image prompt from caption', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            'A professional plumber in blue uniform fixing a leaking pipe under a sink, bright modern kitchen, natural lighting, professional photography style',
        },
      })

      const caption = 'Emergency plumbing services available 24/7! 💧 We fix leaks fast.'
      const result = await extractImagePrompt(caption, "Joe's Plumbing")

      expect(result).toContain('plumber')
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(caption))
    })

    test('should handle errors during extraction', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'))

      await expect(extractImagePrompt('Test caption', 'Business')).rejects.toThrow(
        'Failed to extract image prompt'
      )
    })
  })

  describe('Performance', () => {
    test('should complete text generation within 2 seconds', async () => {
      // Simulate realistic API delay (500ms)
      mockGenerateContent.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                response: {
                  text: () =>
                    JSON.stringify({
                      caption: 'Fast generated caption',
                      hashtags: ['fast', 'efficient'],
                      suggestedImagePrompt: 'Quick image',
                    }),
                },
              })
            }, 500)
          })
      )

      const request: GeneratePostRequest = {
        businessProfile: mockBusinessProfile,
        language: 'en',
        platform: 'facebook',
      }

      const startTime = Date.now()
      await generatePostCaption(request)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(2000) // <2s p95 requirement
    }, 3000)
  })
})
