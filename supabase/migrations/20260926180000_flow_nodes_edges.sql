CREATE TYPE flow_node_type AS ENUM (
    'starting_step',
    'text_button',
    'media',
    'audio',
    'list',
    'template',
    'ask_question',
    'whatsapp_form',
    'payment',
    'save_attribute',
    'add_tag',
    'google_sheet',
    'meta_conversion_api',
    'time_delay',
    'webhook',
    'condition'
);

CREATE TABLE IF NOT EXISTS public.flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
    type flow_node_type NOT NULL,
    config JSONB DEFAULT '{}',
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
    source_handle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flow_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_edges DISABLE ROW LEVEL SECURITY;
