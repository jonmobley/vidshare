-- VidShare Supabase Setup Script
-- Run this in your new Supabase project's SQL editor

-- 1. Create config table for storing settings
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create galleries table for storing gallery information
CREATE TABLE IF NOT EXISTS galleries (
    id SERIAL PRIMARY KEY,
    short_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    folder_url TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create function to get configuration values
CREATE OR REPLACE FUNCTION get_config(config_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT value FROM config WHERE key = config_key LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to save galleries
CREATE OR REPLACE FUNCTION save_gallery(
    p_short_code TEXT,
    p_name TEXT,
    p_folder_url TEXT,
    p_config JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    INSERT INTO galleries (short_code, name, folder_url, config)
    VALUES (p_short_code, p_name, p_folder_url, p_config)
    ON CONFLICT (short_code) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        folder_url = EXCLUDED.folder_url,
        config = EXCLUDED.config,
        updated_at = NOW()
    RETURNING to_jsonb(galleries.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable Row Level Security (RLS) but allow all operations for now
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- 6. Create policies to allow all operations (you can restrict these later)
CREATE POLICY "Allow all operations on config" ON config
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on galleries" ON galleries
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Insert your Dropbox token (replace with your actual token)
INSERT INTO config (key, value) 
VALUES ('dropbox_token', 'YOUR_DROPBOX_TOKEN_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verification queries
SELECT 'Config table created' as status;
SELECT 'Galleries table created' as status;
SELECT 'Functions created' as status;
SELECT 'Sample config row:', * FROM config WHERE key = 'dropbox_token'; 