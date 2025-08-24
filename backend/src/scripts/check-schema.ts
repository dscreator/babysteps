#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');
    
    // Try to query the database directly with SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.log('RPC Error:', error.message);
      
      // Try alternative approach - check if we can create a simple table
      console.log('\nTrying to check if we can access the database...');
      const { data: testData, error: testError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
        
      if (testError) {
        console.log('Alternative check failed:', testError.message);
        console.log('\n❌ Database access failed. The schema may not be set up.');
        console.log('\nYou need to apply the database schema first:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of database/schema.sql');
      } else {
        console.log('✅ Database accessible');
        console.log('Tables found:', testData?.map(t => t.tablename));
      }
    } else {
      console.log('✅ Schema check successful');
      console.log('Tables found:', data);
    }
    
  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkSchema();