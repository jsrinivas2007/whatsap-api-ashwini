CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    color VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (account_id, name)
);

CREATE TABLE public.attribute_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    key_name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (account_id, key_name)
);
