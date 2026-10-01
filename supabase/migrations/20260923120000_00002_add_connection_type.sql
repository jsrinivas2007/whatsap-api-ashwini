-- Add connection_type to waba_accounts

CREATE TYPE waba_connection_type AS ENUM ('new_number', 'existing_number', 'migrated');

ALTER TABLE public.waba_accounts
ADD COLUMN connection_type waba_connection_type;
