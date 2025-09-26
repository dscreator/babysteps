-- Sample data for testing (optional)
-- Run this after the initial schema if you want test data

-- Math problems table
CREATE TABLE IF NOT EXISTS public.math_problems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  hints TEXT[],
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading passages table
CREATE TABLE IF NOT EXISTS public.reading_passages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  subject_area TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay prompts table
CREATE TABLE IF NOT EXISTS public.essay_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt TEXT NOT NULL,
  type TEXT CHECK (type IN ('narrative', 'expository', 'persuasive')),
  grade_level INTEGER CHECK (grade_level BETWEEN 6 AND 8),
  time_limit INTEGER DEFAULT 30,
  rubric JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on content tables
ALTER TABLE public.math_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read content
CREATE POLICY "Authenticated users can read math problems" ON public.math_problems
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read reading passages" ON public.reading_passages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read essay prompts" ON public.essay_prompts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample math problems
INSERT INTO public.math_problems (topic, difficulty, question, options, correct_answer, explanation, hints, grade_level) VALUES
('arithmetic', 2, 'What is 15% of 80?', '["10", "12", "15", "20"]', '12', '15% of 80 = 0.15 × 80 = 12', '["Convert percentage to decimal", "Multiply by the number"]', 7),
('algebra', 3, 'Solve for x: 2x + 5 = 17', '["4", "6", "8", "10"]', '6', '2x + 5 = 17, so 2x = 12, therefore x = 6', '["Subtract 5 from both sides", "Divide by 2"]', 8),
('geometry', 2, 'What is the area of a rectangle with length 8 and width 5?', '["13", "26", "40", "45"]', '40', 'Area = length × width = 8 × 5 = 40', '["Use the formula A = l × w"]', 6);

-- Insert sample reading passages
INSERT INTO public.reading_passages (title, content, grade_level, subject_area, word_count) VALUES
('The Water Cycle', 'The water cycle is the continuous movement of water on, above, and below the surface of the Earth. Water evaporates from oceans, lakes, and rivers, forming water vapor that rises into the atmosphere. As the water vapor cools, it condenses into tiny droplets that form clouds. When these droplets become too heavy, they fall as precipitation in the form of rain, snow, or hail.', 6, 'Science', 65),
('Ancient Civilizations', 'The ancient civilization of Mesopotamia, located between the Tigris and Euphrates rivers, is often called the "cradle of civilization." This region saw the development of the first cities, the invention of writing, and the establishment of complex governments. The Sumerians, who lived in this area around 3500 BCE, created many innovations that we still use today.', 7, 'History', 58);

-- Insert sample essay prompts
INSERT INTO public.essay_prompts (prompt, type, grade_level, time_limit, rubric) VALUES
('Write about a time when you had to overcome a challenge. Describe what happened and how you solved the problem.', 'narrative', 7, 30, '{"structure": 25, "content": 25, "grammar": 25, "creativity": 25}'),
('Explain why reading is important for students your age. Give at least three reasons with examples.', 'expository', 6, 25, '{"organization": 30, "evidence": 30, "clarity": 20, "grammar": 20}'),
('Should students be required to wear uniforms to school? Take a position and support it with reasons and examples.', 'persuasive', 8, 35, '{"argument": 35, "evidence": 25, "organization": 20, "grammar": 20}');