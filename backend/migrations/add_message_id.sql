-- Run this in Supabase SQL Editor to add webhook support

-- 1. Add message_id column to messages table for deduplication
-- (This prevents duplicate messages when Meta retries webhooks)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_id TEXT UNIQUE;

-- 2. Create index for faster deduplication lookups
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);

-- 3. Ensure contacts table has needed columns
-- (These should already exist, but just in case)
-- ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- 4. Verify your tables exist (run these SELECT queries to check)
-- SELECT count(*) FROM contacts;
-- SELECT count(*) FROM conversations;
-- SELECT count(*) FROM messages;
-- SELECT count(*) FROM waba_accounts;
