-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  exam_date DATE,
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  parent_email TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'english', 'essay')),
  overall_score DECIMAL(5,2) DEFAULT 0,
  topic_scores JSONB DEFAULT '{}',
  streak_days INTEGER DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0, -- in minutes
  last_practice_date DATE,
  weak_areas TEXT[],
  strong_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject)
);

-- Parent access table
CREATE TABLE public.parent_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_email TEXT NOT NULL,
  access_granted BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Math problems content
CREATE TABLE public.math_problems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  options JSONB, -- for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  hints TEXT[],
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading passages
CREATE TABLE public.reading_passages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  subject_area TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading questions
CREATE TABLE public.reading_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  passage_id UUID REFERENCES public.reading_passages(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT CHECK (question_type IN ('main_idea', 'detail', 'inference', 'vocabulary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary words
CREATE TABLE public.vocabulary_words (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  example_sentence TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay prompts
CREATE TABLE public.essay_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt TEXT NOT NULL,
  type TEXT CHECK (type IN ('narrative', 'expository', 'persuasive')),
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  time_limit INTEGER DEFAULT 30, -- in minutes
  rubric JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practice sessions
CREATE TABLE public.practice_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'english', 'essay')),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  topics TEXT[],
  difficulty_level INTEGER,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI interactions
CREATE TABLE public.ai_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('hint', 'explanation', 'feedback', 'chat')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress snapshots for historical tracking
CREATE TABLE public.progress_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'english', 'essay')),
  performance_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date, subject)
);

-- Achievements and badges
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Practice sessions policies
CREATE POLICY "Users can view own sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- AI interactions policies
CREATE POLICY "Users can view own interactions" ON public.ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions" ON public.ai_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress snapshots policies
CREATE POLICY "Users can view own snapshots" ON public.progress_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own snapshots" ON public.progress_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Parent access policies
CREATE POLICY "Parents can view granted access" ON public.parent_access
  FOR SELECT USING (
    auth.jwt() ->> 'email' = parent_email AND access_granted = true
  );

-- Content tables are readable by all authenticated users
CREATE POLICY "Authenticated users can read math problems" ON public.math_problems
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read reading passages" ON public.reading_passages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read reading questions" ON public.reading_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read vocabulary" ON public.vocabulary_words
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read essay prompts" ON public.essay_prompts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();