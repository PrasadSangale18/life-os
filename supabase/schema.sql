-- Life OS Supabase Schema
-- Strict User Isolation with Row Level Security (RLS)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: items (Complete parity with LifeOS Item interface)
CREATE TABLE items (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    type text NOT NULL,
    title text NOT NULL,
    body text,
    raw_text text,
    cleaned_title text,
    cleaned_body text,
    pillar text,
    domain_id text,
    quadrant text,
    difficulty text,
    est_minutes integer,
    deadline bigint,
    status text,
    project_id text,
    goal_id text,
    delegated_to text,
    category text,
    color text,
    pinned boolean DEFAULT false,
    tags text[] DEFAULT '{}',
    links text[] DEFAULT '{}',
    is_private boolean DEFAULT false,
    split_from_id uuid,
    is_archived boolean DEFAULT false,
    is_priority boolean DEFAULT false,
    import_batch_id text,
    import_source text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    deleted_at bigint
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items owner isolation" ON items 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Enforce server timestamp on updated_at (ignoring device clock)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (extract(epoch from now()) * 1000)::bigint;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_items
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- 2. Table: tags (Optional normalized lookup / tag metadata)
CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tag text NOT NULL,
    created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags owner isolation" ON tags 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);


-- 3. Table: links (Normalized wiki link / edge tracking)
CREATE TABLE links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    source_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    target_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Links owner isolation" ON links 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);


-- 4. Table: device_sync (Per-device sync cursor tracking)
CREATE TABLE device_sync (
    device_id text PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    last_sync_at bigint NOT NULL
);

ALTER TABLE device_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Device sync owner isolation" ON device_sync 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
