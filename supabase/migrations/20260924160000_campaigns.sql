CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    template VARCHAR(255) NOT NULL,
    contacts_count INTEGER DEFAULT 0,
    type VARCHAR(50) DEFAULT 'BROADCAST',
    status VARCHAR(50) DEFAULT 'Draft',
    delivered INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaigns_timestamp ON campaigns;
CREATE TRIGGER update_campaigns_timestamp
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaigns_timestamp();
