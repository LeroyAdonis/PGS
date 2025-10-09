/**
 * Health Check API Route
 * 
 * Tests environment configuration and Supabase connection
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      geminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
      paystackPublic: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      paystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
      facebookId: !!process.env.FACEBOOK_CLIENT_ID,
      instagramId: !!process.env.INSTAGRAM_CLIENT_ID,
      twitterId: !!process.env.TWITTER_CLIENT_ID,
      linkedinId: !!process.env.LINKEDIN_CLIENT_ID,
    };

    // Test Supabase connection
    const supabase = await createClient();
    
    // Try a simple query to verify database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();

    const dbConnected = !error || error.code === 'PGRST116'; // PGRST116 = no rows found, which is OK

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        variables: envCheck,
      },
      database: {
        connected: dbConnected,
        error: error ? error.message : null,
      },
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
