-- Run this in Supabase SQL Editor to disable RLS for testing!
-- This will allow your backend and webhook to write to the DB using the anon key.

ALTER TABLE waba_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_buttons DISABLE ROW LEVEL SECURITY;

-- Also ensure the message_id column exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
