CREATE TYPE flow_trigger_type AS ENUM ('message', 'template_button', 'reminder', 'meta_lead_form', 'not_set');
CREATE TYPE flow_status AS ENUM ('active', 'inactive');

CREATE TABLE IF NOT EXISTS public.automation_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type flow_trigger_type DEFAULT 'not_set',
    trigger_config JSONB,
    status flow_status DEFAULT 'inactive',
    trigger_count INT DEFAULT 0,
    flow_definition JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on automation_flows for account members"
    ON public.automation_flows FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow insert on automation_flows for account members"
    ON public.automation_flows FOR INSERT
    WITH CHECK (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow update on automation_flows for account members"
    ON public.automation_flows FOR UPDATE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow delete on automation_flows for account members"
    ON public.automation_flows FOR DELETE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    trigger_event JSONB,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on automation_runs for account members"
    ON public.automation_runs FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));
