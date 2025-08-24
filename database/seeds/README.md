# Database Seed Data for ISEE AI Tutor

This directory contains seed data to populate the database with practice content for the ISEE AI Tutor application.

## Content Overview

The seed data includes:

### Math Problems (`01_math_problems.sql`)
- **30+ problems** covering all ISEE math topics:
  - Arithmetic (basic operations, fractions, decimals, percentages)
  - Algebra (solving equations, functions)
  - Geometry (area, perimeter, volume, angles)
  - Data Analysis (mean, median, mode, probability)
- **Difficulty levels 1-5** appropriate for grades 6-8
- **Multiple choice format** with detailed explanations
- **Progressive hints** to guide student learning

### Reading Passages (`02_reading_passages.sql`)
- **6 passages** across different subjects:
  - Science (The Amazing Octopus, The Science of Sleep, Climate Change)
  - Social Studies (The History of Pizza, The Underground Railroad)
  - English (The Power of Persuasion in Advertising)
- **Grade-appropriate content** for levels 6-8
- **Varied word counts** (185-342 words)
- **Diverse topics** to maintain student engagement

### Reading Questions (`03_reading_questions.sql`)
- **24+ comprehension questions** linked to passages
- **Four question types**:
  - Main Idea: Understanding central themes
  - Detail: Identifying specific information
  - Inference: Drawing conclusions from text
  - Vocabulary: Understanding words in context
- **Multiple choice format** with explanations

### Vocabulary Words (`04_vocabulary_words.sql`)
- **25+ words** with increasing difficulty
- **Complete definitions** with part of speech
- **Example sentences** showing proper usage
- **Synonyms and antonyms** for deeper understanding
- **Grade-level appropriate** progression (6-8)

### Essay Prompts (`05_essay_prompts.sql`)
- **12+ prompts** across three types:
  - Narrative: Personal stories and experiences
  - Expository: Informational and explanatory writing
  - Persuasive: Argumentative and opinion pieces
- **Detailed rubrics** for each prompt
- **30-minute time limits** matching ISEE format
- **Age-appropriate topics** for middle school students

## Running the Seeds

### Method 1: Using the Backend Script (Recommended)
```bash
# From the backend directory
cd backend
npm run db:seed
```

### Method 2: Using Node.js Script
```bash
# From the project root
node database/seeds/run-seeds.js
```

### Method 3: Using SQL Files Directly
```bash
# Using Supabase CLI
supabase db reset
psql -d your_database -f database/seeds/seed_all.sql

# Or run individual files
psql -d your_database -f database/seeds/01_math_problems.sql
psql -d your_database -f database/seeds/02_reading_passages.sql
# ... etc
```

## Environment Variables Required

Make sure these environment variables are set:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Content Standards

All seed content follows these standards:

### Educational Alignment
- **ISEE-aligned**: Content matches Independent School Entrance Examination format
- **Grade-appropriate**: Vocabulary and concepts suitable for grades 6-8
- **Progressive difficulty**: Content increases in complexity appropriately

### Quality Assurance
- **Accurate information**: All facts and explanations are verified
- **Clear explanations**: Step-by-step solutions for math problems
- **Engaging content**: Topics chosen to maintain student interest
- **Inclusive examples**: Diverse characters and situations in passages

### Technical Standards
- **Proper formatting**: JSON arrays for multiple choice options
- **Consistent structure**: All records follow the same schema
- **Referential integrity**: Reading questions properly link to passages
- **Data validation**: All content meets database constraints

## Customizing Seed Data

To add or modify content:

1. **Edit the SQL files** directly for simple changes
2. **Update the TypeScript seed script** (`backend/src/scripts/seed.ts`) for complex changes
3. **Follow the existing patterns** for consistency
4. **Test thoroughly** before deploying to production

### Adding New Math Problems
```sql
INSERT INTO public.math_problems (topic, difficulty, question, options, correct_answer, explanation, hints, grade_level) VALUES
('your_topic', difficulty_level, 'Your question?', '["Option A", "Option B", "Option C", "Option D"]', 'Correct Answer', 'Detailed explanation', '["Hint 1", "Hint 2"]', grade_level);
```

### Adding New Vocabulary Words
```sql
INSERT INTO public.vocabulary_words (word, definition, part_of_speech, difficulty_level, example_sentence, synonyms, antonyms, grade_level) VALUES
('word', 'definition', 'part_of_speech', difficulty, 'Example sentence.', '["synonym1", "synonym2"]', '["antonym1", "antonym2"]', grade);
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you're using the service role key, not the anon key
2. **Foreign Key Violations**: Run passages before questions
3. **JSON Format Errors**: Validate JSON arrays for options, synonyms, etc.
4. **Connection Issues**: Check your Supabase URL and credentials

### Verification Queries

After seeding, verify the data:

```sql
-- Check record counts
SELECT 'Math Problems' as type, COUNT(*) as count FROM math_problems
UNION ALL
SELECT 'Reading Passages', COUNT(*) FROM reading_passages
UNION ALL
SELECT 'Reading Questions', COUNT(*) FROM reading_questions
UNION ALL
SELECT 'Vocabulary Words', COUNT(*) FROM vocabulary_words
UNION ALL
SELECT 'Essay Prompts', COUNT(*) FROM essay_prompts;

-- Check data integrity
SELECT p.title, COUNT(q.id) as question_count 
FROM reading_passages p 
LEFT JOIN reading_questions q ON p.id = q.passage_id 
GROUP BY p.id, p.title;
```

## Contributing

When adding new seed data:

1. **Follow naming conventions**: Use descriptive, consistent names
2. **Include proper metadata**: Grade levels, difficulty, topics
3. **Provide quality explanations**: Help students learn from mistakes
4. **Test thoroughly**: Verify all data loads correctly
5. **Document changes**: Update this README if needed

## Data Sources

All content is original or adapted from public domain educational materials. No copyrighted content is included without proper attribution.