# Database Seed Setup Instructions

## Prerequisites

Before running the seed data, ensure you have:

1. **Supabase Project**: Either local or hosted Supabase instance
2. **Database Schema**: The schema from `database/schema.sql` must be applied
3. **Environment Variables**: Proper Supabase credentials configured

## Setup Steps

### 1. Database Schema
First, ensure your database has the required tables:

```bash
# If using Supabase CLI locally
supabase start
supabase db reset

# Or apply the schema manually
psql -d your_database -f database/schema.sql
```

### 2. Environment Configuration

Update your environment variables in `backend/.env`:

```env
# For local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# For hosted Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Seeds

Once the database is properly configured:

```bash
# From the backend directory
npm run db:seed
```

## Seed Data Summary

The seed process will populate your database with:

- **30+ Math Problems**: Covering arithmetic, algebra, geometry, and data analysis
- **6 Reading Passages**: Science, social studies, and English topics
- **24+ Reading Questions**: Main idea, detail, inference, and vocabulary questions
- **25+ Vocabulary Words**: Progressive difficulty with definitions and examples
- **12+ Essay Prompts**: Narrative, expository, and persuasive writing prompts

## Verification

After seeding, verify the data was loaded correctly:

```sql
SELECT 
  'Math Problems' as content_type, 
  COUNT(*) as count 
FROM public.math_problems
UNION ALL
SELECT 'Reading Passages', COUNT(*) FROM public.reading_passages
UNION ALL
SELECT 'Reading Questions', COUNT(*) FROM public.reading_questions
UNION ALL
SELECT 'Vocabulary Words', COUNT(*) FROM public.vocabulary_words
UNION ALL
SELECT 'Essay Prompts', COUNT(*) FROM public.essay_prompts
ORDER BY content_type;
```

Expected results:
- Math Problems: 30+ items
- Reading Passages: 6 items  
- Reading Questions: 24+ items
- Vocabulary Words: 25+ items
- Essay Prompts: 12+ items

## Troubleshooting

### Connection Issues
- Verify Supabase is running (if local)
- Check environment variables are correct
- Ensure service role key has proper permissions

### Data Issues
- Confirm database schema is applied
- Check for foreign key constraint violations
- Verify JSON format in seed data

### Permission Issues
- Use service role key, not anon key
- Ensure RLS policies allow data insertion
- Check table permissions

## Manual Seed Alternative

If the automated script fails, you can run the SQL files manually:

```bash
# Run each file in order
psql -d your_database -f database/seeds/01_math_problems.sql
psql -d your_database -f database/seeds/02_reading_passages.sql
psql -d your_database -f database/seeds/03_reading_questions.sql
psql -d your_database -f database/seeds/04_vocabulary_words.sql
psql -d your_database -f database/seeds/05_essay_prompts.sql
```

Or use the master seed file:
```bash
psql -d your_database -f database/seeds/seed_all.sql
```