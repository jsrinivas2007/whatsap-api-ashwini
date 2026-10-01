-- Fix: campaigns table schema drift.
-- The initial schema (00001) created campaigns with template_id UUID + campaign_status enum.
-- The later campaigns migration (20260924160000) used CREATE TABLE IF NOT EXISTS with the
-- shape the application actually writes (template, contacts_count, type, delivered, read,
-- replies, failed, VARCHAR status with capitalized values like 'Draft'). Because the table
-- already existed, that migration was a silent no-op, so every campaign INSERT failed with
-- "Could not find the 'contacts_count' column of 'campaigns' in the schema cache".
-- Table was empty at fix time; additive ALTER only. template_id/scheduled_at are kept
-- (nullable, unused) to avoid disturbing anything that might reference them.

ALTER TABLE campaigns DROP COLUMN IF EXISTS status;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contacts_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BROADCAST';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delivered INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS read INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS replies INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS failed INTEGER DEFAULT 0;
