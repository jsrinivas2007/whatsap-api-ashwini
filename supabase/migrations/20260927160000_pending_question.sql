CREATE TABLE IF NOT EXISTS public.pending_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    flow_run_id UUID,
    node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
    expected_reply_type TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
