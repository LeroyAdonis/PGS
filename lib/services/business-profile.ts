/**
 * Business Profile Service
 * Handles CRUD operations for business profiles with Supabase integration
 */

import { createClient } from '@/lib/supabase/server';
import { 
  CreateBusinessProfileInput, 
  UpdateBusinessProfileInput,
  createBusinessProfileSchema 
} from '@/lib/validations/business-profile.schema';
import type { Database } from '@/lib/supabase/database.types';

type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];
type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert'];
type BusinessProfileUpdate = Database['public']['Tables']['business_profiles']['Update'];

/**
 * Create a new business profile for the authenticated user
 */
export async function createBusinessProfile(
  userId: string,
  data: CreateBusinessProfileInput
): Promise<BusinessProfile> {
  const supabase = await createClient();

  // Validate data
  const validated = createBusinessProfileSchema.parse(data);

  const profileData: BusinessProfileInsert = {
    user_id: userId,
    business_name: validated.business_name,
    industry: validated.industry,
    description: validated.description,
    target_audience: validated.target_audience,
    target_demographics: validated.target_demographics || [],
    services: validated.services,
    service_areas: validated.service_areas || [],
    preferred_languages: validated.preferred_languages,
    content_tone: validated.content_tone || 'professional',
    brand_colors: validated.brand_colors || [],
    brand_keywords: validated.brand_keywords || [],
    confidence_score: 0.00,
    automation_enabled: false,
  };

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create business profile: ${error.message}`);
  }

  // Also create confidence_scores entry
  const { error: scoreError } = await supabase
    .from('confidence_scores')
    .insert({
      user_id: userId,
      business_profile_id: profile.id,
      total_posts_generated: 0,
      posts_approved_no_edit: 0,
      posts_with_minor_edits: 0,
      posts_with_major_edits: 0,
      posts_rejected: 0,
      confidence_score: 0.00,
      automation_threshold: 80.00,
    });

  if (scoreError) {
    console.error('Failed to create confidence score:', scoreError);
    // Non-fatal, continue
  }

  return profile;
}

/**
 * Get business profile for the authenticated user
 */
export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get business profile: ${error.message}`);
  }

  return profile;
}

/**
 * Update business profile for the authenticated user
 */
export async function updateBusinessProfile(
  userId: string,
  data: UpdateBusinessProfileInput
): Promise<BusinessProfile> {
  const supabase = await createClient();

  const updateData: BusinessProfileUpdate = {};

  if (data.business_name !== undefined) updateData.business_name = data.business_name;
  if (data.industry !== undefined) updateData.industry = data.industry;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.target_audience !== undefined) updateData.target_audience = data.target_audience;
  if (data.target_demographics !== undefined) updateData.target_demographics = data.target_demographics;
  if (data.services !== undefined) updateData.services = data.services;
  if (data.service_areas !== undefined) updateData.service_areas = data.service_areas;
  if (data.preferred_languages !== undefined) updateData.preferred_languages = data.preferred_languages;
  if (data.content_tone !== undefined) updateData.content_tone = data.content_tone;
  if (data.brand_colors !== undefined) updateData.brand_colors = data.brand_colors;
  if (data.brand_keywords !== undefined) updateData.brand_keywords = data.brand_keywords;

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update business profile: ${error.message}`);
  }

  return profile;
}

/**
 * Enable or disable automation for a business profile
 */
export async function updateAutomationSettings(
  userId: string,
  enabled: boolean
): Promise<BusinessProfile> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('business_profiles')
    .update({ automation_enabled: enabled })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update automation settings: ${error.message}`);
  }

  // Update confidence_scores table if enabling automation
  if (enabled) {
    await supabase
      .from('confidence_scores')
      .update({ automation_accepted_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return profile;
}

/**
 * Get confidence score for a business profile
 */
export async function getConfidenceScore(userId: string) {
  const supabase = await createClient();

  const { data: score, error } = await supabase
    .from('confidence_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get confidence score: ${error.message}`);
  }

  return score;
}
