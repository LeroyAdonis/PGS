#!/bin/bash
# Seed database script for Purple Glow Social
# Applies seed.sql to local Supabase database
# Usage: npm run db:seed

set -e  # Exit on error

echo "🌱 Seeding Purple Glow Social database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if local Supabase is running
if ! supabase status &> /dev/null; then
    echo "❌ Error: Local Supabase instance is not running."
    echo "Start it with: supabase start"
    exit 1
fi

# Get database connection string from Supabase CLI
DB_URL=$(supabase status -o json | grep -o '"DB URL": "[^"]*"' | cut -d'"' -f4)

if [ -z "$DB_URL" ]; then
    echo "❌ Error: Could not retrieve database URL from Supabase."
    exit 1
fi

echo "📊 Applying seed data from supabase/seed.sql..."

# Apply seed data using psql
psql "$DB_URL" -f supabase/seed.sql

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Seed data applied successfully!"
    echo ""
    echo "Test Accounts Created:"
    echo "  👤 User: testuser@example.com"
    echo "  🔑 Password: Test1234!"
    echo "  🏢 Business: Joe's Plumbing (Starter tier)"
    echo "  📱 Platforms: Facebook + Instagram"
    echo ""
    echo "  👨‍💼 Admin: admin@purpleglowsocial.com"
    echo "  🔑 Password: Admin1234!"
    echo ""
    echo "You can now run 'npm run dev' and log in with the test account."
else
    echo "❌ Error: Failed to apply seed data."
    exit 1
fi
