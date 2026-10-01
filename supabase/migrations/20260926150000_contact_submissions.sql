CREATE TYPE contact_source AS ENUM ('book_demo', 'talk_to_us');

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    work_email text NOT NULL,
    company_name text NOT NULL,
    phone text,
    message text,
    source contact_source NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to contact_submissions"
    ON public.contact_submissions FOR INSERT
    WITH CHECK (true);
