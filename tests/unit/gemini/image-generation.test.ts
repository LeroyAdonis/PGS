/**
 * Unit tests for Gemini 2.5 Flash Image Generation Service
 */

import { generateImage, uploadImage, deleteImage } from '@/lib/gemini/image-generation'
import * as supabaseClient from '@/lib/supabase/client'
import * as geminiClient from '@/lib/gemini/client'

// Mock dependencies
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/gemini/client')
jest.mock('@/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Image Generation Service', () => {
  const mockBusinessProfileId = '123e4567-e89b-12d3-a456-426614174000'
  const mockBase64Image =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const mockImageUrl = 'https://storage.supabase.co/post-images/generated-images/123/1234567890.png'

  const mockSupabase = {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  }

  const mockGeminiModel = {
    generateContent: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockCreateClient = supabaseClient.createClient as jest.Mock
    mockCreateClient.mockReturnValue(mockSupabase)
    const mockGetImageModel = geminiClient.getImageModel as jest.Mock
    mockGetImageModel.mockReturnValue(mockGeminiModel)

    // Default successful Gemini response
    mockGeminiModel.generateContent.mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockBase64Image,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      },
    })

    // Default successful Supabase upload
    const mockUpload = jest.fn().mockResolvedValue({
      data: { path: 'generated-images/123/1234567890.png' },
      error: null,
    })
    const mockGetPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: mockImageUrl },
    })
    const mockRemove = jest.fn().mockResolvedValue({ error: null })

    mockSupabase.storage.from = jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    }))
  })

  describe('generateImage', () => {
    test('should generate image using Gemini 2.5 Flash and upload to Supabase', async () => {
      const prompt = 'A vibrant South African landscape with purple sunset'

      const result = await generateImage(prompt, mockBusinessProfileId)

      expect(result).toBe(mockImageUrl)
      expect(geminiClient.getImageModel).toHaveBeenCalled()
      expect(mockGeminiModel.generateContent).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('photorealistic')])
      )
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('post-images')
    })

    test('should enhance prompt with default photorealistic style', async () => {
      const prompt = 'Coffee cup on a wooden table'

      await generateImage(prompt, mockBusinessProfileId)

      const generateCall = mockGeminiModel.generateContent.mock.calls[0]
      const enhancedPrompt = generateCall[0][0]

      expect(enhancedPrompt).toContain('photorealistic')
      expect(enhancedPrompt).toContain(prompt)
      expect(enhancedPrompt).toContain('natural lighting')
    })

    test('should support illustration style', async () => {
      const prompt = 'Happy customer using a product'

      await generateImage(prompt, mockBusinessProfileId, 'illustration')

      const generateCall = mockGeminiModel.generateContent.mock.calls[0]
      const enhancedPrompt = generateCall[0][0]

      expect(enhancedPrompt).toContain('illustration')
      expect(enhancedPrompt).toContain('vibrant colors')
    })

    test('should support minimalist style', async () => {
      const prompt = 'Modern logo design'

      await generateImage(prompt, mockBusinessProfileId, 'minimalist')

      const generateCall = mockGeminiModel.generateContent.mock.calls[0]
      const enhancedPrompt = generateCall[0][0]

      expect(enhancedPrompt).toContain('minimalist')
      expect(enhancedPrompt).toContain('clean background')
    })

    test('should support product photography style', async () => {
      const prompt = 'Professional camera equipment'

      await generateImage(prompt, mockBusinessProfileId, 'product')

      const generateCall = mockGeminiModel.generateContent.mock.calls[0]
      const enhancedPrompt = generateCall[0][0]

      expect(enhancedPrompt).toContain('product photography')
      expect(enhancedPrompt).toContain('studio lighting')
    })

    test('should support lifestyle photography style', async () => {
      const prompt = 'Family enjoying a picnic'

      await generateImage(prompt, mockBusinessProfileId, 'lifestyle')

      const generateCall = mockGeminiModel.generateContent.mock.calls[0]
      const enhancedPrompt = generateCall[0][0]

      expect(enhancedPrompt).toContain('lifestyle')
      expect(enhancedPrompt).toContain('natural setting')
    })

    test('should handle JPEG mime type from Gemini', async () => {
      mockGeminiModel.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: mockBase64Image,
                      mimeType: 'image/jpeg',
                    },
                  },
                ],
              },
            },
          ],
        },
      })

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'generated-images/123/1234567890.jpeg' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockImageUrl },
      })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      await generateImage('test', mockBusinessProfileId)

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpeg$/),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      )
    })

    test('should organize files by business profile ID', async () => {
      await generateImage('Test prompt', mockBusinessProfileId)

      const mockUpload = mockSupabase.storage.from().upload
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining(`generated-images/${mockBusinessProfileId}`),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    test('should handle Gemini API errors', async () => {
      mockGeminiModel.generateContent.mockRejectedValueOnce(new Error('API quota exceeded'))

      await expect(generateImage('test', mockBusinessProfileId)).rejects.toThrow(
        'Failed to generate image'
      )
    })

    test('should handle empty candidates from Gemini', async () => {
      mockGeminiModel.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [],
        },
      })

      await expect(generateImage('test', mockBusinessProfileId)).rejects.toThrow(
        'No image generated by Gemini API'
      )
    })

    test('should handle missing parts in Gemini response', async () => {
      mockGeminiModel.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [],
              },
            },
          ],
        },
      })

      await expect(generateImage('test', mockBusinessProfileId)).rejects.toThrow(
        'No content parts in Gemini API response'
      )
    })

    test('should handle missing inline_data in Gemini response', async () => {
      mockGeminiModel.generateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: 'No image data' }],
              },
            },
          ],
        },
      })

      await expect(generateImage('test', mockBusinessProfileId)).rejects.toThrow(
        'No inline_data found in Gemini API response'
      )
    })

    test('should handle Supabase upload errors', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' },
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      await expect(generateImage('test', mockBusinessProfileId)).rejects.toThrow(
        'Failed to generate image'
      )
    })

    test('should convert base64 to Buffer correctly', async () => {
      await generateImage('test', mockBusinessProfileId)

      const mockUpload = mockSupabase.storage.from().upload
      const uploadedBuffer = mockUpload.mock.calls[0][1]

      expect(uploadedBuffer).toBeInstanceOf(Buffer)
      expect(uploadedBuffer.length).toBeGreaterThan(0)
    })
  })

  describe('uploadImage', () => {
    test('should upload valid JPEG file', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }) // 1MB

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'uploads/123/1234567890.jpg' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockImageUrl },
      })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      const result = await uploadImage(mockFile, mockBusinessProfileId)

      expect(result).toBe(mockImageUrl)
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        mockFile,
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      )
    })

    test('should upload valid PNG file', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 }) // 2MB

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'uploads/123/1234567890.png' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockImageUrl },
      })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      const result = await uploadImage(mockFile, mockBusinessProfileId)

      expect(result).toBe(mockImageUrl)
    })

    test('should upload valid WebP file', async () => {
      const mockFile = new File(['test'], 'test.webp', { type: 'image/webp' })
      Object.defineProperty(mockFile, 'size', { value: 500 * 1024 }) // 500KB

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'uploads/123/1234567890.webp' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: mockImageUrl },
      })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      const result = await uploadImage(mockFile, mockBusinessProfileId)

      expect(result).toBe(mockImageUrl)
    })

    test('should reject invalid file types', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      await expect(uploadImage(mockFile, mockBusinessProfileId)).rejects.toThrow(
        'Invalid file type'
      )
    })

    test('should reject files exceeding 10MB', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(mockFile, 'size', { value: 11 * 1024 * 1024 }) // 11MB

      await expect(uploadImage(mockFile, mockBusinessProfileId)).rejects.toThrow(
        'File size exceeds 10MB limit'
      )
    })

    test('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 })

      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      await expect(uploadImage(mockFile, mockBusinessProfileId)).rejects.toThrow(
        'Failed to upload image'
      )
    })
  })

  describe('deleteImage', () => {
    test('should delete image from Supabase Storage', async () => {
      const imageUrl = 'https://storage.supabase.co/object/public/post-images/uploads/123/test.jpg'

      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } })
      const mockRemove = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      await deleteImage(imageUrl)

      expect(mockRemove).toHaveBeenCalledWith(['uploads/123/test.jpg'])
    })

    test('should handle deletion errors gracefully', async () => {
      const imageUrl = 'https://storage.supabase.co/object/public/post-images/uploads/123/test.jpg'

      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: '' } })
      const mockRemove = jest.fn().mockResolvedValue({
        error: { message: 'File not found' },
      })

      mockSupabase.storage.from = jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }))

      // Should not throw, just log warning
      await expect(deleteImage(imageUrl)).resolves.not.toThrow()
    })

    test('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'not-a-valid-url'

      // Should not throw
      await expect(deleteImage(invalidUrl)).resolves.not.toThrow()
    })
  })
})
