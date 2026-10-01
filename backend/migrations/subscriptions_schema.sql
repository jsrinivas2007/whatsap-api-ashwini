-- 1. Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Plan Limits Table
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  limit_value INT NOT NULL DEFAULT -1,
  UNIQUE(plan_id, feature_key)
);

-- 3. Plan Features Table
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(plan_id, feature_key)
);

-- 4. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL, -- Assuming WabaAccount ID or Auth User ID is used as account_id
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, expired
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 5. Usage Counters Table
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(account_id, feature_key)
);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL, -- success, failed, pending
  gateway_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_payment_account_id ON payment_transactions(account_id);

-- SEED DATA --

-- Insert Plans
INSERT INTO plans (plan_key, name, price, sort_order) VALUES
('trial', '7-Day Free Trial', 0.00, 1),
('starter', 'Starter', 999.00, 2),
('growth', 'Growth', 1999.00, 3),
('enterprise', 'Enterprise', 2999.00, 4)
ON CONFLICT (plan_key) DO UPDATE SET price = EXCLUDED.price;

-- Function to safely insert limits
CREATE OR REPLACE FUNCTION seed_plan_limits(p_key VARCHAR, f_key VARCHAR, l_value INT) RETURNS VOID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM plans WHERE plan_key = p_key;
  IF FOUND THEN
    INSERT INTO plan_limits (plan_id, feature_key, limit_value) VALUES (v_plan_id, f_key, l_value)
    ON CONFLICT (plan_id, feature_key) DO UPDATE SET limit_value = EXCLUDED.limit_value;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert features
CREATE OR REPLACE FUNCTION seed_plan_features(p_key VARCHAR, f_key VARCHAR, is_enabled BOOLEAN) RETURNS VOID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM plans WHERE plan_key = p_key;
  IF FOUND THEN
    INSERT INTO plan_features (plan_id, feature_key, enabled) VALUES (v_plan_id, f_key, is_enabled)
    ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- TRIAL Plan Limits
SELECT seed_plan_limits('trial', 'contacts', 100);
SELECT seed_plan_limits('trial', 'bulk_broadcast_messages', 100);
SELECT seed_plan_limits('trial', 'templates', 3);
SELECT seed_plan_limits('trial', 'quick_replies', 5);
SELECT seed_plan_limits('trial', 'automation_flows', 1);
SELECT seed_plan_limits('trial', 'whatsapp_forms', 1);
SELECT seed_plan_limits('trial', 'tags_attributes', 3);
SELECT seed_plan_limits('trial', 'users', 1);
SELECT seed_plan_features('trial', 'opt_in_out', true);
SELECT seed_plan_features('trial', 'customer_support', true);
SELECT seed_plan_features('trial', 'campaign_scheduler', false);

-- STARTER Plan Limits
SELECT seed_plan_limits('starter', 'contacts', 1000);
SELECT seed_plan_limits('starter', 'bulk_broadcast_messages', 5000);
SELECT seed_plan_limits('starter', 'templates', 10);
SELECT seed_plan_limits('starter', 'quick_replies', 20);
SELECT seed_plan_limits('starter', 'automation_flows', 3);
SELECT seed_plan_limits('starter', 'whatsapp_forms', 3);
SELECT seed_plan_limits('starter', 'tags_attributes', -1);
SELECT seed_plan_limits('starter', 'users', 2);
SELECT seed_plan_features('starter', 'opt_in_out', true);
SELECT seed_plan_features('starter', 'customer_support', true);
SELECT seed_plan_features('starter', 'campaign_scheduler', false);

-- GROWTH Plan Limits (Assuming 10000 for contacts as requested)
SELECT seed_plan_limits('growth', 'contacts', 10000);
SELECT seed_plan_limits('growth', 'bulk_broadcast_messages', 25000);
SELECT seed_plan_limits('growth', 'templates', -1);
SELECT seed_plan_limits('growth', 'quick_replies', -1);
SELECT seed_plan_limits('growth', 'automation_flows', -1);
SELECT seed_plan_limits('growth', 'whatsapp_forms', -1);
SELECT seed_plan_limits('growth', 'tags_attributes', -1);
SELECT seed_plan_limits('growth', 'users', 10);
SELECT seed_plan_features('growth', 'opt_in_out', true);
SELECT seed_plan_features('growth', 'customer_support', true);
SELECT seed_plan_features('growth', 'campaign_scheduler', true);

-- ENTERPRISE Plan Limits
SELECT seed_plan_limits('enterprise', 'contacts', -1);
SELECT seed_plan_limits('enterprise', 'bulk_broadcast_messages', -1);
SELECT seed_plan_limits('enterprise', 'templates', -1);
SELECT seed_plan_limits('enterprise', 'quick_replies', -1);
SELECT seed_plan_limits('enterprise', 'automation_flows', -1);
SELECT seed_plan_limits('enterprise', 'whatsapp_forms', -1);
SELECT seed_plan_limits('enterprise', 'tags_attributes', -1);
SELECT seed_plan_limits('enterprise', 'users', -1);
SELECT seed_plan_features('enterprise', 'opt_in_out', true);
SELECT seed_plan_features('enterprise', 'customer_support', true);
SELECT seed_plan_features('enterprise', 'campaign_scheduler', true);

-- Enable RLS (Assuming users will run disable scripts or use service roles for backend)
-- We will leave RLS disabled for these new tables to avoid breaking the local dev flow as discussed earlier
