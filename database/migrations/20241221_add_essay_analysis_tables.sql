-- Add essay submissions table
CREATE TABLE public.essay_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.essay_prompts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  time_spent INTEGER, -- in minutes
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add essay analyses table
CREATE TABLE public.essay_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.essay_submissions(id) ON DELETE CASCADE NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  structure_score DECIMAL(5,2) NOT NULL CHECK (structure_score >= 0 AND structure_score <= 100),
  grammar_score DECIMAL(5,2) NOT NULL CHECK (grammar_score >= 0 AND grammar_score <= 100),
  content_score DECIMAL(5,2) NOT NULL CHECK (content_score >= 0 AND content_score <= 100),
  vocabulary_score DECIMAL(5,2) NOT NULL CHECK (vocabulary_score >= 0 AND vocabulary_score <= 100),
  feedback JSONB NOT NULL,
  rubric_breakdown JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id) -- One analysis per submission
);

-- Enable RLS on new tables
ALTER TABLE public.essay_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for essay submissions
CREATE POLICY "Users can view own essay submissions" ON public.essay_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own essay submissions" ON public.essay_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own essay submissions" ON public.essay_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for essay analyses
CREATE POLICY "Users can view own essay analyses" ON public.essay_analyses
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM public.essay_submissions 
      WHERE id = essay_analyses.submission_id
    )
  );

CREATE POLICY "Service can create essay analyses" ON public.essay_analyses
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.essay_submissions 
      WHERE id = essay_analyses.submission_id
    )
  );

-- Indexes for performance
CREATE INDEX idx_essay_submissions_user_id ON public.essay_submissions(user_id);
CREATE INDEX idx_essay_submissions_prompt_id ON public.essay_submissions(prompt_id);
CREATE INDEX idx_essay_submissions_submitted_at ON public.essay_submissions(submitted_at);
CREATE INDEX idx_essay_analyses_submission_id ON public.essay_analyses(submission_id);
CREATE INDEX idx_essay_analyses_overall_score ON public.essay_analyses(overall_score);