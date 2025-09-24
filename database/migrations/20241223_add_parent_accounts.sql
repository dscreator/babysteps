-- Add parent accounts table
CREATE TABLE public.parent_accounts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  notification_preferences JSONB DEFAULT '{
    "progressMilestones": true,
    "studyReminders": true,
    "weeklyReports": true,
    "emailFrequency": "weekly"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update parent_access table to include more fields
ALTER TABLE public.parent_access 
ADD COLUMN IF NOT EXISTS access_code TEXT,
ADD COLUMN IF NOT EXISTS access_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES public.parent_accounts(id) ON DELETE CASCADE;

-- Create index for parent account lookups
CREATE INDEX idx_parent_access_parent_email ON public.parent_access(parent_email);
CREATE INDEX idx_parent_access_student_id ON public.parent_access(student_id);
CREATE INDEX idx_parent_access_parent_account_id ON public.parent_access(parent_account_id);

-- Enable RLS on parent accounts
ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for parent accounts
CREATE POLICY "Parents can view own account" ON public.parent_accounts
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Parents can update own account" ON public.parent_accounts
  FOR UPDATE USING (auth.uid() = id);

-- Update parent access policies to include parent account access
CREATE POLICY "Parent accounts can view their student access" ON public.parent_access
  FOR SELECT USING (
    auth.uid() = parent_account_id OR 
    (auth.jwt() ->> 'email' = parent_email AND access_granted = true)
  );

CREATE POLICY "Parent accounts can update their student access" ON public.parent_access
  FOR UPDATE USING (auth.uid() = parent_account_id);

-- Add trigger for updated_at on parent accounts
CREATE TRIGGER update_parent_accounts_updated_at BEFORE UPDATE ON public.parent_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate access codes
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;