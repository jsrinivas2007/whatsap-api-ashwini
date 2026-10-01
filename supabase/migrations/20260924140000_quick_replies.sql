CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    shortcut TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT quick_replies_shortcut_unique UNIQUE (account_id, shortcut)
);

CREATE OR REPLACE FUNCTION update_quick_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quick_replies_timestamp
BEFORE UPDATE ON public.quick_replies
FOR EACH ROW
EXECUTE FUNCTION update_quick_replies_updated_at();

-- RLS policies
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on quick_replies for account members"
    ON public.quick_replies FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow insert on quick_replies for account members"
    ON public.quick_replies FOR INSERT
    WITH CHECK (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow update on quick_replies for account members"
    ON public.quick_replies FOR UPDATE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Allow delete on quick_replies for account members"
    ON public.quick_replies FOR DELETE
    USING (account_id IN (
        SELECT account_id FROM public.users WHERE id = auth.uid()
    ));
