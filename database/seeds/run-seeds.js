#!/usr/bin/env node

/**
 * Database Seeding Script for ISEE AI Tutor
 * 
 * This script populates the database with practice content including:
 * - Math problems across all ISEE topics and difficulty levels
 * - Reading passages with comprehension questions for grades 6-8
 * - Vocabulary words with definitions, synonyms, and examples
 * - Essay prompts for narrative, expository, and persuasive writing
 * 
 * Usage:
 *   node database/seeds/run-seeds.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL or SUPABASE_DB_URL
 */

const fs = require('fs');
const path = require('path');

// Check if we're in a Node.js environment with database access
if (typeof process === 'undefined') {
  console.error('This script must be run in a Node.js environment');
  process.exit(1);
}

// Database connection setup (adjust based on your setup)
let dbClient;

async function connectToDatabase() {
  try {
    // For Supabase, you might use the Supabase client
    // For direct PostgreSQL, you might use pg client
    // This is a placeholder - adjust based on your actual database setup
    
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!databaseUrl) {
      throw new Error('Database URL not found. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.');
    }
    
    console.log('Connecting to database...');
    
    // If using pg (PostgreSQL client)
    if (require.resolve('pg')) {
      const { Client } = require('pg');
      dbClient = new Client({ connectionString: databaseUrl });
      await dbClient.connect();
    } else {
      throw new Error('PostgreSQL client (pg) not found. Please install it: npm install pg');
    }
    
    console.log('Connected to database successfully');
    return dbClient;
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
}

async function runSeedFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running seed file: ${filename}`);
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await dbClient.query(statement);
      }
    }
    
    console.log(`✓ Completed: ${filename}`);
  } catch (error) {
    console.error(`✗ Error in ${filename}:`, error.message);
    throw error;
  }
}

async function runAllSeeds() {
  try {
    await connectToDatabase();
    
    console.log('Starting database seeding process...\n');
    
    // Clear existing data first
    console.log('Clearing existing practice content...');
    await dbClient.query('DELETE FROM public.reading_questions');
    await dbClient.query('DELETE FROM public.reading_passages');
    await dbClient.query('DELETE FROM public.math_problems');
    await dbClient.query('DELETE FROM public.vocabulary_words');
    await dbClient.query('DELETE FROM public.essay_prompts');
    console.log('✓ Cleared existing data\n');
    
    // Run seed files in order
    const seedFiles = [
      '01_math_problems.sql',
      '02_reading_passages.sql',
      '03_reading_questions.sql',
      '04_vocabulary_words.sql',
      '05_essay_prompts.sql'
    ];
    
    for (const seedFile of seedFiles) {
      await runSeedFile(seedFile);
    }
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    
    const summaryQuery = `
      SELECT 'Math Problems' as content_type, COUNT(*) as count FROM public.math_problems
      UNION ALL
      SELECT 'Reading Passages' as content_type, COUNT(*) as count FROM public.reading_passages
      UNION ALL
      SELECT 'Reading Questions' as content_type, COUNT(*) as count FROM public.reading_questions
      UNION ALL
      SELECT 'Vocabulary Words' as content_type, COUNT(*) as count FROM public.vocabulary_words
      UNION ALL
      SELECT 'Essay Prompts' as content_type, COUNT(*) as count FROM public.essay_prompts
      ORDER BY content_type
    `;
    
    const result = await dbClient.query(summaryQuery);
    
    result.rows.forEach(row => {
      console.log(`${row.content_type}: ${row.count} items`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
}

// Run the seeding process
if (require.main === module) {
  runAllSeeds();
}

module.exports = { runAllSeeds };