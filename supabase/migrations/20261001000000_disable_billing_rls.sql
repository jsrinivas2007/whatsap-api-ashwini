-- Fix: Widespread write failures (Contacts, Forms, Quick Replies, Tags/Attributes)
-- Root cause: RLS was enabled on the billing tables (plans, plan_limits, plan_features,
-- subscriptions, usage_counters). The backend connects with the anon key, so RLS made
-- these tables invisible: PlanEnforcementService.getActiveSubscription() could not see
-- any subscription nor the 'trial' plan, returned allowed:false, and every write endpoint
-- gated by enforceAction() returned HTTP 403 {"reason":"subscription_inactive"}.
-- This matches the project's established dev-mode RLS policy (see 20260925150000_disable_rls.sql,
-- disable_rls_and_fix.sql, 20260927170000_disable_automation_rls.sql).
-- Disabling RLS only grants the anon role access it previously had; it cannot break any
-- currently-working read/write path.

-- Billing chain (THE root cause of all six failing writes)
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters DISABLE ROW LEVEL SECURITY;

-- Campaigns chain (same wall: campaign creation/audience import would fail next)
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_audiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients DISABLE ROW LEVEL SECURITY;

-- Remaining tables that were also silently walled off (restorative only)
ALTER TABLE business_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_questions DISABLE ROW LEVEL SECURITY;
