-- Add parental consents table for COPPA compliance
CREATE TABLE public.parental_consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_email TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('registration', 'data_collection', 'communication')),
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'phone', 'document')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add data deletion requests table
CREATE TABLE public.data_deletion_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('partial', 'complete')),
  requested_by TEXT NOT NULL CHECK (requested_by IN ('user', 'parent', 'admin')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_date TIMESTAMP WITH TIME ZONE,
  data_types TEXT[],
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add audit logs table for tracking data access and modifications
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add data encryption keys table (for future use)
CREATE TABLE public.encryption_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('data', 'backup', 'export')),
  key_hash TEXT NOT NULL, -- Hashed version of the key
  salt TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add privacy settings table
CREATE TABLE public.privacy_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  data_collection_consent BOOLEAN DEFAULT FALSE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  third_party_sharing BOOLEAN DEFAULT FALSE,
  data_retention_period INTEGER DEFAULT 730, -- days
  auto_delete_inactive BOOLEAN DEFAULT TRUE,
  export_format TEXT DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'xml')),
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_parental_consents_student_id ON public.parental_consents(student_id);
CREATE INDEX idx_parental_consents_parent_email ON public.parental_consents(parent_email);
CREATE INDEX idx_parental_consents_consent_type ON public.parental_consents(consent_type);
CREATE INDEX idx_parental_consents_verification_status ON public.parental_consents(verification_status);

CREATE INDEX idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_request_date ON public.data_deletion_requests(request_date);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

CREATE INDEX idx_encryption_keys_user_id ON public.encryption_keys(user_id);
CREATE INDEX idx_encryption_keys_key_type ON public.encryption_keys(key_type);
CREATE INDEX idx_encryption_keys_is_active ON public.encryption_keys(is_active);

CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- Enable RLS on new tables
ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for parental_consents
CREATE POLICY "Users can view own parental consents" ON public.parental_consents
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.jwt() ->> 'email' = parent_email
  );

CREATE POLICY "Parents can create consents for their children" ON public.parental_consents
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = parent_email);

CREATE POLICY "Parents can update their own consents" ON public.parental_consents
  FOR UPDATE USING (auth.jwt() ->> 'email' = parent_email);

-- RLS policies for data_deletion_requests
CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests" ON public.data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- Allow system to create logs

-- RLS policies for encryption_keys
CREATE POLICY "Users can view own encryption keys" ON public.encryption_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own encryption keys" ON public.encryption_keys
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for privacy_settings
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own privacy settings" ON public.privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_parental_consents_updated_at BEFORE UPDATE ON public.parental_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check COPPA compliance
CREATE OR REPLACE FUNCTION check_coppa_compliance(student_user_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  required_consents TEXT[] := ARRAY['registration', 'data_collection', 'communication'];
  consent_type TEXT;
  consent_count INTEGER := 0;
BEGIN
  -- Check if all required consents are present and verified
  FOREACH consent_type IN ARRAY required_consents
  LOOP
    SELECT COUNT(*) INTO consent_count
    FROM public.parental_consents
    WHERE student_id = student_user_id
      AND consent_type = consent_type
      AND consent_given = TRUE
      AND verification_status = 'verified'
      AND (expires_at IS NULL OR expires_at > NOW());
    
    IF consent_count = 0 THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$ LANGUAGE plpgsql;

-- Function to anonymize user data (for partial deletion)
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID, data_types TEXT[])
RETURNS INTEGER AS $
DECLARE
  anonymized_count INTEGER := 0;
  data_type TEXT;
BEGIN
  FOREACH data_type IN ARRAY data_types
  LOOP
    CASE data_type
      WHEN 'practice_data' THEN
        UPDATE public.practice_sessions
        SET session_data = jsonb_build_object('anonymized', true, 'original_data_removed', NOW())
        WHERE user_id = target_user_id;
        GET DIAGNOSTICS anonymized_count = ROW_COUNT;
        
      WHEN 'chat_data' THEN
        UPDATE public.chat_messages
        SET content = '[Message content removed for privacy]'
        WHERE conversation_id IN (
          SELECT id FROM public.chat_conversations WHERE user_id = target_user_id
        );
        GET DIAGNOSTICS anonymized_count = anonymized_count + ROW_COUNT;
        
      WHEN 'essay_data' THEN
        UPDATE public.essay_submissions
        SET content = '[Essay content removed for privacy]'
        WHERE user_id = target_user_id;
        GET DIAGNOSTICS anonymized_count = anonymized_count + ROW_COUNT;
        
      ELSE
        -- Handle other data types as needed
        NULL;
    END CASE;
  END LOOP;
  
  RETURN anonymized_count;
END;
$ LANGUAGE plpgsql;

-- Function to clean up expired consents
CREATE OR REPLACE FUNCTION cleanup_expired_consents()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.parental_consents
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to generate data export for user
CREATE OR REPLACE FUNCTION generate_user_data_export(target_user_id UUID)
RETURNS JSONB AS $
DECLARE
  user_data JSONB;
  profile_data JSONB;
  progress_data JSONB;
  sessions_data JSONB;
  interactions_data JSONB;
  essays_data JSONB;
BEGIN
  -- Get user profile
  SELECT to_jsonb(u.*) INTO profile_data
  FROM public.users u
  WHERE u.id = target_user_id;
  
  -- Get progress data
  SELECT jsonb_agg(to_jsonb(up.*)) INTO progress_data
  FROM public.user_progress up
  WHERE up.user_id = target_user_id;
  
  -- Get practice sessions (last 100)
  SELECT jsonb_agg(to_jsonb(ps.*)) INTO sessions_data
  FROM (
    SELECT * FROM public.practice_sessions
    WHERE user_id = target_user_id
    ORDER BY created_at DESC
    LIMIT 100
  ) ps;
  
  -- Get AI interactions (last 500)
  SELECT jsonb_agg(to_jsonb(ai.*)) INTO interactions_data
  FROM (
    SELECT * FROM public.ai_interactions
    WHERE user_id = target_user_id
    ORDER BY created_at DESC
    LIMIT 500
  ) ai;
  
  -- Get essay submissions
  SELECT jsonb_agg(to_jsonb(es.*)) INTO essays_data
  FROM public.essay_submissions es
  WHERE es.user_id = target_user_id;
  
  -- Combine all data
  user_data := jsonb_build_object(
    'export_date', NOW(),
    'user_id', target_user_id,
    'profile', profile_data,
    'progress', COALESCE(progress_data, '[]'::jsonb),
    'practice_sessions', COALESCE(sessions_data, '[]'::jsonb),
    'ai_interactions', COALESCE(interactions_data, '[]'::jsonb),
    'essay_submissions', COALESCE(essays_data, '[]'::jsonb)
  );
  
  RETURN user_data;
END;
$ LANGUAGE plpgsql;

-- Insert initial schema version for privacy compliance
INSERT INTO public.schema_versions (version_number, version_name, migration_script)
VALUES (3, 'Privacy Compliance Schema', '20241223_add_privacy_compliance_tables.sql')
ON CONFLICT (version_number) DO NOTHING;