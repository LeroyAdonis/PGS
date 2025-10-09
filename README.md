# 💜 Purple Glow Social

**AI-Powered Social Media Management for South African SMBs**

Purple Glow Social is an intelligent social media management platform designed specifically for South African small and medium businesses. Powered by Google Gemini AI, it helps you create engaging, multilingual content across Facebook, Instagram, Twitter, and LinkedIn—all while staying authentically South African.

## ✨ Key Features

- 🤖 **AI Content Generation** - Smart text and image generation using Google Gemini 1.5 Pro
- 🌍 **11 SA Languages** - Full support for all official South African languages
- 📱 **4 Social Platforms** - Facebook, Instagram, Twitter (X), and LinkedIn integration
- 🎨 **Brand Consistency** - Learns your brand voice, colors, and style
- 📊 **Smart Analytics** - Track performance and get AI-powered insights
- 🚀 **Progressive Automation** - Builds confidence over time for hands-free posting
- 💳 **Local Billing** - Pay in ZAR via Paystack

## 🚀 Quick Start

For detailed setup instructions, see [specs/001-purple-glow-social/quickstart.md](./specs/001-purple-glow-social/quickstart.md).

### Prerequisites

- Node.js 20+ and npm
- Supabase account (free tier works)
- Google Gemini API key
- Social platform developer accounts (Facebook, Instagram, Twitter, LinkedIn)
- Paystack account for payments

### Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Run database migrations:**

   ```bash
   # Set up Supabase locally or use cloud
   supabase link --project-ref your-project-ref
   supabase db push
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 📦 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5+ (strict mode)
- **Styling:** Tailwind CSS 4 with custom Purple Glow theme
- **UI Library:** Shadcn UI + Radix UI primitives
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Google Gemini 1.5 Pro (text) + 2.5 Flash (images)
- **State Management:** TanStack Query (React Query)
- **Validation:** Zod
- **Payments:** Paystack (ZAR)
- **Testing:** Vitest (unit/integration) + Playwright (E2E)

## 🎨 Purple Glow Theme

Our custom design system features:

- **Primary:** `hsl(258 90% 66%)` - Deep purple with signature glow effects
- **Secondary:** `hsl(330 81% 60%)` - Vibrant pink accent
- **Dark Mode:** Full support via `prefers-color-scheme`
- **Custom Utilities:** `.glow-primary`, `.glow-secondary`, `.text-glow-primary`, `.text-glow-secondary`

## 🛠️ Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript compiler check
npm test             # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
```

## 📚 Documentation

- **Feature Specification:** [specs/001-purple-glow-social/spec.md](./specs/001-purple-glow-social/spec.md)
- **Implementation Plan:** [specs/001-purple-glow-social/plan.md](./specs/001-purple-glow-social/plan.md)
- **Data Model:** [specs/001-purple-glow-social/data-model.md](./specs/001-purple-glow-social/data-model.md)
- **API Reference:** [specs/001-purple-glow-social/contracts/openapi.yaml](./specs/001-purple-glow-social/contracts/openapi.yaml)
- **Research Notes:** [specs/001-purple-glow-social/research.md](./specs/001-purple-glow-social/research.md)

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                # Shadcn UI components
├── lib/                   # Core utilities and clients
│   ├── supabase/         # Supabase client and helpers
│   ├── ai/               # Google Gemini AI integration
│   ├── social/           # Social platform APIs
│   ├── payments/         # Paystack integration
│   ├── validations/      # Zod schemas
│   ├── utils/            # Utility functions
│   └── constants/        # App constants and enums
├── supabase/              # Database migrations and Edge Functions
│   ├── migrations/       # SQL migration files
│   └── functions/        # Edge Functions
├── specs/                 # Feature specifications
│   └── 001-purple-glow-social/
└── tests/                 # Test files
```

## 🔐 Security

- **Row Level Security (RLS)** enabled on all Supabase tables
- **Zero-trust architecture** - all data access verified
- **Secure credential storage** - encrypted OAuth tokens
- **Rate limiting** per platform and subscription tier
- **Input validation** with Zod schemas

## 🌍 South African Focus

Purple Glow Social is built for SA businesses:

- Support for all 11 official languages
- ZAR billing via Paystack
- SA business hours and cultural context
- Local hosting options
- POPIA compliance ready

## 📄 License

Copyright © 2025 Purple Glow Social. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or support, contact the development team.

---

**Made with 💜 in South Africa**
