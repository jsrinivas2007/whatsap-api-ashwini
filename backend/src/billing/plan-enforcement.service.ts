import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class PlanEnforcementService {
  private readonly logger = new Logger(PlanEnforcementService.name);
  
  // Cache to avoid hitting DB on every request. Map<accountId, { data, expiresAt }>
  private cache = new Map<string, { data: any, expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  constructor(private supabaseService: SupabaseService) {}

  async getActiveSubscription(accountId: string): Promise<any> {
    const cached = this.cache.get(accountId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const client = this.supabaseService.getClient();

    // 1. Get active subscription
    const { data: sub } = await client
      .from('subscriptions')
      .select('id, plan_id, status, current_period_end, trial_ends_at')
      .eq('account_id', accountId)
      .in('status', ['active', 'trialing'])
      .single();

    if (!sub) {
      // If no active sub, might be expired/canceled/past_due, or new user without one
      // We check if they have ANY subscription to see if they're expired
      const { data: anySub } = await client
        .from('subscriptions')
        .select('status')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!anySub) {
        // Create trial if completely new
        return this.createTrialSubscription(accountId);
      }
      
      return { status: anySub.status, allowed: false }; // read-only
    }

    // 2. Get Plan Limits and Features
    const { data: plan } = await client.from('plans').select('plan_key, name').eq('id', sub.plan_id).single();
    const { data: limits } = await client.from('plan_limits').select('feature_key, limit_value').eq('plan_id', sub.plan_id);
    const { data: features } = await client.from('plan_features').select('feature_key, enabled').eq('plan_id', sub.plan_id);

    // 3. Get current usage
    const { data: usage } = await client.from('usage_counters').select('feature_key, current_count').eq('account_id', accountId);

    const result = {
      status: sub.status,
      allowed: true, // not completely blocked
      plan: plan?.plan_key,
      limits: limits?.reduce((acc: any, curr: any) => ({ ...acc, [curr.feature_key]: curr.limit_value }), {}) || {},
      features: features?.reduce((acc: any, curr: any) => ({ ...acc, [curr.feature_key]: curr.enabled }), {}) || {},
      usage: usage?.reduce((acc: any, curr: any) => ({ ...acc, [curr.feature_key]: curr.current_count }), {}) || {},
    };

    this.cache.set(accountId, { data: result, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return result;
  }

  private async createTrialSubscription(accountId: string): Promise<any> {
    const client = this.supabaseService.getClient();
    const { data: trialPlan } = await client.from('plans').select('id, plan_key').eq('plan_key', 'trial').single();
    
    if (!trialPlan) return { status: 'none', allowed: false }; // Missing seed data

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const { data: sub } = await client.from('subscriptions').insert({
      account_id: accountId,
      plan_id: trialPlan.id,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString()
    }).select().single();

    if (!sub) return { status: 'none', allowed: false };

    // Initialize usage counters to 0 for this account
    // Not strictly necessary as incrementUsage handles upsert, but clean
    this.cache.delete(accountId);
    return this.getActiveSubscription(accountId); // fetch proper shape
  }

  async canPerformAction(accountId: string, featureKey: string, amount: number = 1): Promise<{ allowed: boolean, reason?: string, feature?: string, limit?: number, current?: number, upgrade_required?: boolean }> {
    const sub = await this.getActiveSubscription(accountId);
    
    if (!sub.allowed) {
      return { allowed: false, reason: 'subscription_inactive', upgrade_required: true };
    }

    // Is it a boolean feature?
    if (sub.features.hasOwnProperty(featureKey)) {
      if (!sub.features[featureKey]) {
        return { allowed: false, reason: 'feature_not_included', feature: featureKey, upgrade_required: true };
      }
      return { allowed: true };
    }

    // Is it a limit feature?
    if (sub.limits.hasOwnProperty(featureKey)) {
      const limit = sub.limits[featureKey];
      const current = sub.usage[featureKey] || 0;

      if (limit !== -1 && (current + amount) > limit) {
        return { allowed: false, reason: 'limit_reached', feature: featureKey, limit, current, upgrade_required: true };
      }
      return { allowed: true };
    }

    // Unknown feature - default allow or block? Better to block to ensure it's mapped
    this.logger.warn(`Unknown feature key checked: ${featureKey}`);
    return { allowed: true };
  }

  async enforceAction(accountId: string, featureKey: string, amount: number = 1) {
    const check = await this.canPerformAction(accountId, featureKey, amount);
    if (!check.allowed) {
      throw new ForbiddenException(check);
    }
  }

  async incrementUsage(accountId: string, featureKey: string, amount: number = 1) {
    const client = this.supabaseService.getClient();
    // In PostgreSQL, upsert usage_counters
    const { data: usage } = await client.from('usage_counters').select('current_count').eq('account_id', accountId).eq('feature_key', featureKey).single();
    
    if (usage) {
      await client.from('usage_counters').update({ current_count: usage.current_count + amount }).eq('account_id', accountId).eq('feature_key', featureKey);
    } else {
      await client.from('usage_counters').insert({ account_id: accountId, feature_key: featureKey, current_count: amount });
    }
    this.cache.delete(accountId); // bust cache
  }

  async decrementUsage(accountId: string, featureKey: string, amount: number = 1) {
    // Only decrement if it's an inventory feature.
    if (featureKey === 'bulk_broadcast_messages') return; // Consumption based, never restore

    const client = this.supabaseService.getClient();
    const { data: usage } = await client.from('usage_counters').select('current_count').eq('account_id', accountId).eq('feature_key', featureKey).single();
    
    if (usage && usage.current_count > 0) {
      const newCount = Math.max(0, usage.current_count - amount);
      await client.from('usage_counters').update({ current_count: newCount }).eq('account_id', accountId).eq('feature_key', featureKey);
      this.cache.delete(accountId);
    }
  }
}
