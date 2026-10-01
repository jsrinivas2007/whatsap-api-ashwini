-- Supabase SQL Schema for Vaartaa Templates Module

CREATE TYPE template_category AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');
CREATE TYPE template_header_type AS ENUM ('NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE template_status AS ENUM ('APPROVED', 'PENDING', 'REJECTED');
CREATE TYPE template_button_type AS ENUM ('QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'FLOW');

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL, -- references accounts(id)
  meta_template_id VARCHAR(255),
  name VARCHAR(512) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  category template_category NOT NULL,
  header_type template_header_type NOT NULL DEFAULT 'NONE',
  header_content TEXT,
  body VARCHAR(1024) NOT NULL,
  footer VARCHAR(60),
  status template_status NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Name must be lowercase, numbers, underscores only
  CONSTRAINT valid_name CHECK (name ~ '^[a-z0-9_]+$'),
  -- Enforce uniqueness per account + language
  UNIQUE(account_id, name, language)
);

CREATE TABLE template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  sample_value TEXT NOT NULL
);

CREATE TABLE template_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type template_button_type NOT NULL,
  render_order INTEGER NOT NULL,
  button_text VARCHAR(25) NOT NULL,
  phone_number VARCHAR(20),
  website_url TEXT,
  form_id VARCHAR(255)
);

-- RLS (Row Level Security) Example Policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_buttons ENABLE ROW LEVEL SECURITY;

-- Note: Ensure proper Role-Based Access Control policies are created
-- allowing SELECT, INSERT, UPDATE, DELETE only where auth.uid() is authorized for account_id

CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'stability', 'gemini', 'custom');

CREATE TABLE user_ai_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider ai_provider NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  custom_endpoint_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_ai_provider_keys ENABLE ROW LEVEL SECURITY;
