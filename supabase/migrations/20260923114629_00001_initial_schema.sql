-- Core & Auth

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'agent');

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    role user_role DEFAULT 'agent',
    name VARCHAR,
    email VARCHAR
);

-- Function to handle new user registration sync from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_account_id UUID;
BEGIN
    -- Create a default account for the user if they don't have one
    INSERT INTO public.accounts (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Account')
    RETURNING id INTO new_account_id;

    INSERT INTO public.users (id, account_id, role, name, email)
    VALUES (NEW.id, new_account_id, 'owner', NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- WhatsApp Connection & Business Profile
CREATE TYPE waba_account_status AS ENUM ('approved', 'pending', 'restricted', 'disabled');
CREATE TYPE waba_quality_rating AS ENUM ('green', 'yellow', 'red', 'unknown');
CREATE TYPE fb_verification_status AS ENUM ('verified', 'pending', 'not_started');
CREATE TYPE payment_method_status AS ENUM ('configured', 'action_required');

CREATE TABLE public.waba_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    waba_id VARCHAR,
    phone_number_id VARCHAR,
    display_phone_number VARCHAR,
    business_name VARCHAR,
    message_limit_tier VARCHAR,
    account_status waba_account_status DEFAULT 'pending',
    quality_rating waba_quality_rating DEFAULT 'unknown',
    fb_business_verification_status fb_verification_status DEFAULT 'not_started',
    payment_method_status payment_method_status DEFAULT 'action_required',
    access_token VARCHAR,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waba_account_id UUID UNIQUE REFERENCES public.waba_accounts(id) ON DELETE CASCADE,
    profile_picture_url TEXT,
    email VARCHAR,
    description VARCHAR,
    address TEXT,
    category VARCHAR,
    website_links TEXT[] CHECK (array_length(website_links, 1) <= 2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts / CRM
CREATE TYPE contact_source AS ENUM ('manual', 'excel_upload', 'chat', 'api', 'csv_upload');

CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    name VARCHAR,
    country_code VARCHAR,
    whatsapp_number VARCHAR NOT NULL,
    source contact_source DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    attributes JSONB DEFAULT '{}',
    opted_out BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (account_id, whatsapp_number)
);

-- Message Templates
CREATE TYPE template_category AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');
CREATE TYPE template_header_type AS ENUM ('NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE template_status AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    meta_template_id VARCHAR,
    name VARCHAR NOT NULL,
    language VARCHAR NOT NULL,
    category template_category NOT NULL,
    header_type template_header_type DEFAULT 'NONE',
    header_content TEXT,
    body TEXT NOT NULL,
    footer VARCHAR(60),
    status template_status DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (account_id, name, language)
);

CREATE TABLE public.template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    sample_value VARCHAR NOT NULL
);

CREATE TYPE template_button_type AS ENUM ('QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'FLOW');

CREATE TABLE public.template_buttons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    type template_button_type NOT NULL,
    "order" INTEGER NOT NULL,
    button_text VARCHAR(25) NOT NULL,
    phone_number VARCHAR,
    website_url VARCHAR,
    form_id VARCHAR
);

-- Campaigns
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'cancelled');

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    template_id UUID REFERENCES public.templates(id),
    status campaign_status DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campaign_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID UNIQUE REFERENCES public.campaigns(id) ON DELETE CASCADE,
    filter_config JSONB DEFAULT '{}'
);

CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'replied', 'failed');

CREATE TABLE public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    status delivery_status DEFAULT 'pending',
    meta_message_id VARCHAR,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_reason TEXT
);

-- Messaging & Chats
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'snoozed');

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    status conversation_status DEFAULT 'open',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'document', 'template', 'interactive');
CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    direction message_direction NOT NULL,
    type message_type NOT NULL,
    content JSONB NOT NULL,
    status message_status DEFAULT 'queued',
    wa_message_id VARCHAR UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
