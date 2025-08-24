-- Master Seed Script for ISEE AI Tutor
-- This script populates the database with practice content for all subjects

-- Clear existing data (in reverse order of dependencies)
DELETE FROM public.reading_questions;
DELETE FROM public.reading_passages;
DELETE FROM public.math_problems;
DELETE FROM public.vocabulary_words;
DELETE FROM public.essay_prompts;

-- Reset sequences if needed
-- Note: UUID primary keys don't use sequences, so this is mainly for reference

-- Seed Math Problems
\i database/seeds/01_math_problems.sql

-- Seed Reading Passages
\i database/seeds/02_reading_passages.sql

-- Seed Reading Questions (depends on passages)
\i database/seeds/03_reading_questions.sql

-- Seed Vocabulary Words
\i database/seeds/04_vocabulary_words.sql

-- Seed Essay Prompts
\i database/seeds/05_essay_prompts.sql

-- Display summary of seeded data
SELECT 'Math Problems' as content_type, COUNT(*) as count FROM public.math_problems
UNION ALL
SELECT 'Reading Passages' as content_type, COUNT(*) as count FROM public.reading_passages
UNION ALL
SELECT 'Reading Questions' as content_type, COUNT(*) as count FROM public.reading_questions
UNION ALL
SELECT 'Vocabulary Words' as content_type, COUNT(*) as count FROM public.vocabulary_words
UNION ALL
SELECT 'Essay Prompts' as content_type, COUNT(*) as count FROM public.essay_prompts
ORDER BY content_type;