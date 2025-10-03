'use client'

import Link from 'next/link'

export default function Home() {
  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            Purple Glow Social
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl">
            AI-Powered Social Media Manager for South African Businesses
          </p>
          <div className="flex gap-4 mt-8">
            <Link href="/onboarding">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Get Started
              </button>
            </Link>
            <button
              onClick={handleLearnMore}
              className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
            >
              Learn More
            </button>
          </div>
          <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-600">AI Content Generation</h3>
              <p className="text-gray-600">
                Generate engaging posts in 11 South African languages with AI-created images
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-600">
                Multi-Platform Publishing
              </h3>
              <p className="text-gray-600">
                Post to Facebook, Instagram, X/Twitter, and LinkedIn simultaneously
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-purple-600">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Track engagement metrics and optimize your social media strategy
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
