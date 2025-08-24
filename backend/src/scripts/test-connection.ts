#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key starts with:', supabaseServiceKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      
      // Check if it's a table doesn't exist error
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n❌ Database tables do not exist. You need to run the schema first.');
        console.log('Run: supabase db push or apply database/schema.sql');
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('Data:', data);
    }
    
    // Test if we can list tables
    console.log('\n2. Testing table access...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.log('Tables error:', tablesError.message);
    } else {
      console.log('Available tables:', tables?.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();