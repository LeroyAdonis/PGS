import { test, expect } from '@playwright/test'

/**
 * Performance test for AI post generation
 * Target: <2s p95 latency for AI generation
 */

test.describe('AI Generation Performance', () => {
  const SAMPLE_SIZE = 100
  const P95_TARGET_MS = 2000 // 2 seconds
  const latencies: number[] = []

  test.beforeAll(async ({ browser }) => {
    // Login once for all tests
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    await context.close()
  })

  test('should measure AI generation latency for multiple requests', async ({ browser }) => {
    test.setTimeout(SAMPLE_SIZE * 10000) // Allow enough time for all requests

    console.log(`\n🚀 Starting AI generation performance test (${SAMPLE_SIZE} requests)...`)

    // Create a new context with authentication
    const context = await browser.newContext()
    const page = await context.newPage()

    // Login
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Measure generation time for multiple requests
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const startTime = Date.now()

      try {
        // Navigate to post generation
        await page.goto('/posts')

        // Fill in post generation form
        await page.click('button:has-text("Generate Post"), button:has-text("Create Post")')
        await page.fill(
          'input[name="topic"], textarea[name="topic"]',
          `Performance test topic ${i}`
        )

        // Select platform
        const facebookCheckbox = page.locator('input[type="checkbox"][value="facebook"]')
        if (await facebookCheckbox.isVisible({ timeout: 1000 })) {
          await facebookCheckbox.check()
        }

        // Click generate and wait for completion
        await page.click('button:has-text("Generate"), button[type="submit"]')

        // Wait for generation to complete
        await page.waitForSelector('text=/generating|loading/i', { timeout: 5000 })
        await page.waitForSelector('text=/generating|loading/i', {
          state: 'hidden',
          timeout: 30000,
        })

        const endTime = Date.now()
        const latency = endTime - startTime
        latencies.push(latency)

        console.log(`Request ${i + 1}/${SAMPLE_SIZE}: ${latency}ms`)

        // Brief pause between requests to avoid rate limiting
        await page.waitForTimeout(100)
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error)
        // Record max timeout as latency for failed requests
        latencies.push(30000)
      }
    }

    await context.close()

    // Calculate p95 latency
    const sortedLatencies = [...latencies].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedLatencies.length * 0.95)
    const p95Latency = sortedLatencies[p95Index]
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length

    console.log('\n📊 Performance Results:')
    console.log(`   Average latency: ${avgLatency.toFixed(0)}ms`)
    console.log(`   P95 latency: ${p95Latency}ms`)
    console.log(`   Min latency: ${sortedLatencies[0]}ms`)
    console.log(`   Max latency: ${sortedLatencies[sortedLatencies.length - 1]}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${p95Latency <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    // Assert p95 latency is under target
    expect(p95Latency).toBeLessThanOrEqual(P95_TARGET_MS)
  })

  test('should measure text generation latency only', async ({ page }) => {
    test.setTimeout(30000)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Measure API call directly
    const startTime = Date.now()

    const response = await page.request.post('/api/v1/posts', {
      data: {
        topic: 'Performance test - text generation only',
        platform_targets: ['facebook'],
        generate_image: false, // Skip image generation
      },
    })

    const endTime = Date.now()
    const latency = endTime - startTime

    console.log(`\n📝 Text generation latency: ${latency}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${latency <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    expect(response.ok()).toBeTruthy()
    expect(latency).toBeLessThanOrEqual(P95_TARGET_MS)
  })

  test('should measure image generation latency only', async ({ page }) => {
    test.setTimeout(30000)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // First generate a post with text
    const postResponse = await page.request.post('/api/v1/posts', {
      data: {
        topic: 'Performance test - image generation',
        platform_targets: ['facebook'],
        generate_image: false,
      },
    })

    expect(postResponse.ok()).toBeTruthy()
    const post = await postResponse.json()

    // Measure image generation separately
    const startTime = Date.now()

    const imageResponse = await page.request.post(`/api/v1/posts/${post.id}/regenerate-image`, {
      data: {},
    })

    const endTime = Date.now()
    const latency = endTime - startTime

    console.log(`\n🖼️  Image generation latency: ${latency}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${latency <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    expect(imageResponse.ok()).toBeTruthy()
    expect(latency).toBeLessThanOrEqual(P95_TARGET_MS)
  })
})
