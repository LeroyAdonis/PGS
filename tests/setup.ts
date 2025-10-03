import '@testing-library/jest-dom'

// Some test environments may not support dynamic import of CJS modules as expected.
// Use synchronous require() here and declare it for TypeScript.
declare const require: any

// Load environment variables from .env.local for tests (if present)
try {
  const dotenv = require('dotenv')
  if (dotenv && typeof dotenv.config === 'function') {
    dotenv.config({ path: '.env.local' })
  }
} catch (err) {
  // ignore dotenv errors in CI where env vars are provided differently
}

// Reset in-memory stores used by middleware during tests
try {
  const mod = require('../lib/middleware/rate-limit')
  if (mod && typeof mod._resetRateLimitStoreForTests === 'function') {
    mod._resetRateLimitStoreForTests()
  }
} catch (err) {
  // If the module isn't present or fails to load in the test environment, ignore
}
