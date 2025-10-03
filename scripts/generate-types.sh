#!/bin/bash

# Script to generate TypeScript types from Supabase database schema
# Usage: npm run db:types
# Requires: Supabase CLI installed and local instance running

echo "🔄 Generating TypeScript types from Supabase schema..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

# Check if local Supabase is running
if ! supabase status &> /dev/null; then
    echo "⚠️  Local Supabase is not running"
    echo "🚀 Start it with: supabase start"
    exit 1
fi

# Generate types from local database
supabase gen types typescript --local > lib/supabase/types.ts

if [ $? -eq 0 ]; then
    echo "✅ TypeScript types generated successfully at lib/supabase/types.ts"
    echo "📊 Types generated for:"
    echo "   - 10 tables (users, business_profiles, social_media_accounts, posts, etc.)"
    echo "   - 2 views (v_content_calendar, v_analytics_summary)"
    echo "   - 14 enums (role, status, platform, tier, etc.)"
else
    echo "❌ Error: Failed to generate types"
    exit 1
fi
