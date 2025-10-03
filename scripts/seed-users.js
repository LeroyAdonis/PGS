#!/usr/bin/env node
/**
 * Seed test users using Supabase Admin API
 * This creates users in both auth.users and public.users tables
 *
 * Usage: node scripts/seed-users.js
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Ensure they are set in .env.local')
  process.exit(1)
}

// Create Supabase Admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedUsers() {
  console.log('🌱 Seeding test users...\n')

  // Test User
  const testUser = {
    email: 'testuser@example.com',
    password: 'Test1234!',
    displayName: 'Test User',
    role: 'business_admin',
  }

  // Admin User
  const adminUser = {
    email: 'admin@purpleglowsocial.com',
    password: 'Admin1234!',
    displayName: 'Admin User',
    role: 'admin',
  }

  const users = [testUser, adminUser]

  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}...`)

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find((u) => u.email === user.email)

      if (existingUser) {
        console.log(`  ⚠️  User ${user.email} already exists (id: ${existingUser.id})`)

        // Update the custom users table to ensure it's in sync
        const { error: updateError } = await supabase.from('users').upsert({
          id: existingUser.id,
          email: user.email,
          display_name: user.displayName,
          role: user.role,
          account_status: 'active',
          email_verified: true,
        })

        if (updateError) {
          console.error(`  ❌ Failed to sync custom users table: ${updateError.message}`)
        } else {
          console.log(`  ✅ Custom users table synced`)
        }
        continue
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          display_name: user.displayName,
          role: user.role,
        },
      })

      if (authError) {
        console.error(`  ❌ Failed to create auth user: ${authError.message}`)
        continue
      }

      console.log(`  ✅ Created auth user (id: ${authData.user.id})`)

      // The trigger should automatically create the custom users table entry
      // But let's ensure it exists with the correct data
      const { error: insertError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email: user.email,
        display_name: user.displayName,
        role: user.role,
        account_status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        notification_preferences: {
          email_enabled: true,
          in_app_enabled: true,
          events: ['post_published', 'analytics_ready', 'billing_reminder'],
        },
      })

      if (insertError) {
        console.error(`  ❌ Failed to create custom user record: ${insertError.message}`)
      } else {
        console.log(`  ✅ Created custom user record`)
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error.message}`)
    }
  }

  console.log('\n✅ User seeding complete!\n')
  console.log('Test Accounts:')
  console.log('  👤 User: testuser@example.com')
  console.log('  🔑 Password: Test1234!')
  console.log('')
  console.log('  👨‍💼 Admin: admin@purpleglowsocial.com')
  console.log('  🔑 Password: Admin1234!')
  console.log('')
  console.log("You can now run 'npm run dev' and log in with these accounts.")
}

// Run the seed function
seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
