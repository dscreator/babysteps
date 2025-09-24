-- Add data synchronization table
CREATE TABLE public.data_sync (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('progress', 'session', 'preferences', 'achievement')),
  data JSONB NOT NULL,
  version BIGINT NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add data backups table
CREATE TABLE public.data_backups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  backup_data JSONB NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental')),
  backup_size INTEGER, -- Size in bytes
  compression_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add offline cache table for client-side caching
CREATE TABLE public.offline_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);

-- Add schema version tracking table
CREATE TABLE public.schema_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  version_number INTEGER NOT NULL UNIQUE,
  version_name TEXT NOT NULL,
  migration_script TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_script TEXT
);

-- Add data migration logs table
CREATE TABLE public.data_migrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  migration_type TEXT NOT NULL,
  from_version INTEGER,
  to_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_data_sync_user_id ON public.data_sync(user_id);
CREATE INDEX idx_data_sync_data_type ON public.data_sync(data_type);
CREATE INDEX idx_data_sync_last_modified ON public.data_sync(last_modified);
CREATE INDEX idx_data_sync_version ON public.data_sync(version);

CREATE INDEX idx_data_backups_user_id ON public.data_backups(user_id);
CREATE INDEX idx_data_backups_created_at ON public.data_backups(created_at);
CREATE INDEX idx_data_backups_backup_type ON public.data_backups(backup_type);

CREATE INDEX idx_offline_cache_user_id ON public.offline_cache(user_id);
CREATE INDEX idx_offline_cache_expires_at ON public.offline_cache(expires_at);
CREATE INDEX idx_offline_cache_cache_key ON public.offline_cache(cache_key);

CREATE INDEX idx_data_migrations_user_id ON public.data_migrations(user_id);
CREATE INDEX idx_data_migrations_status ON public.data_migrations(status);
CREATE INDEX idx_data_migrations_started_at ON public.data_migrations(started_at);

-- Enable RLS on new tables
ALTER TABLE public.data_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_migrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for data_sync
CREATE POLICY "Users can view own sync data" ON public.data_sync
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sync data" ON public.data_sync
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync data" ON public.data_sync
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for data_backups
CREATE POLICY "Users can view own backups" ON public.data_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups" ON public.data_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for offline_cache
CREATE POLICY "Users can view own cache" ON public.offline_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cache" ON public.offline_cache
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for data_migrations
CREATE POLICY "Users can view own migrations" ON public.data_migrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage migrations" ON public.data_migrations
  FOR ALL USING (auth.role() = 'service_role');

-- Schema versions are readable by authenticated users
CREATE POLICY "Authenticated users can read schema versions" ON public.schema_versions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE TRIGGER update_data_sync_updated_at BEFORE UPDATE ON public.data_sync
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_cache_updated_at BEFORE UPDATE ON public.offline_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.offline_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to compress old backups (placeholder for future implementation)
CREATE OR REPLACE FUNCTION compress_old_backups()
RETURNS INTEGER AS $
DECLARE
  compressed_count INTEGER := 0;
BEGIN
  -- Placeholder for backup compression logic
  -- In a real implementation, this would compress backups older than 30 days
  RETURN compressed_count;
END;
$ LANGUAGE plpgsql;

-- Insert initial schema version
INSERT INTO public.schema_versions (version_number, version_name, migration_script)
VALUES (1, 'Initial Data Sync Schema', '20241223_add_data_sync_tables.sql');

-- Function to get current schema version
CREATE OR REPLACE FUNCTION get_current_schema_version()
RETURNS INTEGER AS $
BEGIN
  RETURN (SELECT MAX(version_number) FROM public.schema_versions);
END;
$ LANGUAGE plpgsql;