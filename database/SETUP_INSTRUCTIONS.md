# Supabase Database Setup Instructions

## Quick Setup (5 minutes)

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### 2. Run the Initial Schema
1. Copy the contents of `database/migrations/001_initial_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the query
4. You should see "Success. No rows returned" message

### 3. (Optional) Add Sample Data
1. Copy the contents of `database/migrations/002_sample_data.sql`
2. Paste it into a new query in the SQL Editor
3. Click "Run" to execute
4. This adds sample math problems, reading passages, and essay prompts

### 4. Verify Tables Were Created
1. Go to "Table Editor" in the left sidebar
2. You should see these tables:
   - `users`
   - `user_progress`
   - `practice_sessions`
   - `math_problems` (if you ran sample data)
   - `reading_passages` (if you ran sample data)
   - `essay_prompts` (if you ran sample data)

### 5. Configure Environment Variables
Add these to your Vercel project settings:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find these values:**
1. Go to Settings → API in your Supabase dashboard
2. Copy "Project URL" as `VITE_SUPABASE_URL`
3. Copy "anon public" key as `VITE_SUPABASE_ANON_KEY`

### 6. Test the Setup
1. After adding environment variables, Vercel will automatically redeploy
2. Visit your app and try creating a profile
3. The "Failed to save profile" error should be resolved

## Troubleshooting

### If you get permission errors:
- Make sure Row Level Security (RLS) policies are enabled
- The schema includes all necessary policies for user access

### If tables don't appear:
- Check the SQL Editor for any error messages
- Make sure you're running the queries in the correct order
- Refresh the Table Editor page

### If the app still shows mock authentication:
- Verify environment variables are set correctly in Vercel
- Check that the Supabase URL and key are valid
- Redeploy the application after adding environment variables

## What This Schema Includes

### Core Tables:
- **users**: User profiles with exam dates and preferences
- **user_progress**: Track performance across subjects
- **practice_sessions**: Record of all practice activities

### Security:
- Row Level Security (RLS) enabled on all user data tables
- Users can only access their own data
- Proper authentication checks

### Performance:
- Indexes on frequently queried columns
- Automatic timestamp updates
- Optimized for the app's query patterns

## Next Steps After Setup

1. **Test Profile Creation**: Try completing the profile setup in the app
2. **Add More Content**: Use the sample data structure to add more practice problems
3. **Monitor Usage**: Check the Supabase dashboard for database activity
4. **Scale as Needed**: Supabase automatically handles scaling for you

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all environment variables are set correctly
3. Ensure the SQL queries ran without errors
4. Test with a fresh user registration