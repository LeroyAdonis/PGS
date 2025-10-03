import { test, expect } from '@playwright/test'

/**
 * Performance test for dashboard load time
 * Target: <500ms p95 latency for dashboard load
 */

test.describe('Dashboard Load Performance', () => {
  const SAMPLE_SIZE = 100
  const P95_TARGET_MS = 500 // 500 milliseconds
  const loadTimes: number[] = []

  test('should measure dashboard load time for multiple requests', async ({ browser }) => {
    test.setTimeout(SAMPLE_SIZE * 10000) // Allow enough time for all requests

    console.log(`\n🚀 Starting dashboard load performance test (${SAMPLE_SIZE} requests)...`)

    for (let i = 0; i < SAMPLE_SIZE; i++) {
      // Create new context for each request to simulate fresh load
      const context = await browser.newContext()
      const page = await context.newPage()

      try {
        // Login
        await page.goto('/auth/login')
        await page.fill('input[name="email"]', 'testuser@example.com')
        await page.fill('input[name="password"]', 'Test1234!')
        await page.click('button[type="submit"]')
        await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

        // Measure dashboard load time
        const startTime = Date.now()

        // Navigate to dashboard (reload to measure fresh load)
        await page.goto('/dashboard')

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForSelector('h1, [data-testid="dashboard"]', { timeout: 5000 })

        const endTime = Date.now()
        const loadTime = endTime - startTime
        loadTimes.push(loadTime)

        console.log(`Request ${i + 1}/${SAMPLE_SIZE}: ${loadTime}ms`)

        // Brief pause between requests
        await page.waitForTimeout(50)
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error)
        // Record max timeout as load time for failed requests
        loadTimes.push(10000)
      }

      await context.close()
    }

    // Calculate p95 load time
    const sortedLoadTimes = [...loadTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedLoadTimes.length * 0.95)
    const p95LoadTime = sortedLoadTimes[p95Index]
    const avgLoadTime = loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length

    console.log('\n📊 Performance Results:')
    console.log(`   Average load time: ${avgLoadTime.toFixed(0)}ms`)
    console.log(`   P95 load time: ${p95LoadTime}ms`)
    console.log(`   Min load time: ${sortedLoadTimes[0]}ms`)
    console.log(`   Max load time: ${sortedLoadTimes[sortedLoadTimes.length - 1]}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${p95LoadTime <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    // Assert p95 load time is under target
    expect(p95LoadTime).toBeLessThanOrEqual(P95_TARGET_MS)
  })

  test('should measure API response time for dashboard data', async ({ page }) => {
    test.setTimeout(30000)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    const apiLoadTimes: number[] = []

    console.log('\n📡 Measuring API response times...')

    // Measure individual API calls
    const endpoints = [
      '/api/v1/posts?limit=5&status=recent',
      '/api/v1/analytics/summary',
      '/api/v1/posts?status=scheduled&limit=7',
    ]

    for (const endpoint of endpoints) {
      const startTime = Date.now()

      const response = await page.request.get(endpoint)

      const endTime = Date.now()
      const loadTime = endTime - startTime
      apiLoadTimes.push(loadTime)

      console.log(`   ${endpoint}: ${loadTime}ms`)

      expect(response.ok()).toBeTruthy()
    }

    const totalApiTime = apiLoadTimes.reduce((sum, t) => sum + t, 0)
    console.log(`\n   Total API time: ${totalApiTime}ms`)
    console.log(`   Average per endpoint: ${(totalApiTime / apiLoadTimes.length).toFixed(0)}ms`)

    // Total API time should be reasonable (not a strict requirement)
    expect(totalApiTime).toBeLessThan(2000)
  })

  test('should measure time to first contentful paint', async ({ page }) => {
    test.setTimeout(30000)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Navigate to dashboard and measure performance metrics
    await page.goto('/dashboard')

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      const paintEntries = window.performance.getEntriesByType('paint')

      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
      }
    })

    console.log('\n⚡ Performance Metrics:')
    console.log(`   First Paint: ${metrics.firstPaint.toFixed(0)}ms`)
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`)
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`)
    console.log(`   Load Complete: ${metrics.loadComplete.toFixed(0)}ms`)

    // First Contentful Paint should be under target
    expect(metrics.firstContentfulPaint).toBeLessThanOrEqual(P95_TARGET_MS)
  })

  test('should measure dashboard load time with cached assets', async ({ page }) => {
    test.setTimeout(30000)

    // First load - warm up cache
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Second load - measure with cache
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    await page.waitForSelector('h1, [data-testid="dashboard"]', { timeout: 5000 })

    const endTime = Date.now()
    const cachedLoadTime = endTime - startTime

    console.log(`\n💾 Cached dashboard load time: ${cachedLoadTime}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${cachedLoadTime <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    // Cached load should be even faster
    expect(cachedLoadTime).toBeLessThanOrEqual(P95_TARGET_MS)
  })

  test('should measure posts list page load time', async ({ page }) => {
    test.setTimeout(30000)

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'testuser@example.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Measure posts page load
    const startTime = Date.now()

    await page.goto('/posts')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    await page.waitForSelector('[data-testid="post-card"], .post-card', { timeout: 5000 })

    const endTime = Date.now()
    const loadTime = endTime - startTime

    console.log(`\n📄 Posts list page load time: ${loadTime}ms`)
    console.log(`   Target: <${P95_TARGET_MS}ms`)
    console.log(`   Status: ${loadTime <= P95_TARGET_MS ? '✅ PASS' : '❌ FAIL'}`)

    expect(loadTime).toBeLessThanOrEqual(P95_TARGET_MS)
  })
})
