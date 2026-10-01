CREATE TABLE IF NOT EXISTS public.whatsapp_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    meta_flow_id VARCHAR,
    name VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'draft',
    flow_json JSONB,
    screens_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_whatsapp_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_flows_timestamp
BEFORE UPDATE ON public.whatsapp_flows
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_flows_updated_at();

ALTER TABLE public.whatsapp_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on whatsapp_flows for account members"
    ON public.whatsapp_flows FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow insert on whatsapp_flows for account members"
    ON public.whatsapp_flows FOR INSERT
    WITH CHECK (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow update on whatsapp_flows for account members"
    ON public.whatsapp_flows FOR UPDATE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow delete on whatsapp_flows for account members"
    ON public.whatsapp_flows FOR DELETE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));
