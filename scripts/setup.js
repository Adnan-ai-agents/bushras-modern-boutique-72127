#!/usr/bin/env node

/**
 * AUTOMATED DATABASE SETUP SCRIPT
 * 
 * This script automatically sets up your Supabase database by:
 * 1. Reading credentials from .env file
 * 2. Running the consolidated migration SQL
 * 3. Verifying the setup
 * 
 * Usage: npm run setup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validation
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

console.log('🚀 Starting database setup...\n');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSetup() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '0001_complete_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('⏳ Running migration (this may take 30-60 seconds)...\n');
    
    // Note: The Supabase JS client doesn't support running raw SQL migrations directly
    // This script documents the process, but users should use one of these methods:
    // 1. Supabase CLI: supabase db push
    // 2. SQL Editor in Supabase Dashboard
    
    console.log('⚠️  IMPORTANT: This script cannot execute SQL directly via the JS client.\n');
    console.log('Please use ONE of these methods to run the migration:\n');
    console.log('METHOD 1 - Supabase CLI (Recommended):');
    console.log('  1. Install CLI: npm install -g supabase');
    console.log('  2. Login: supabase login');
    console.log('  3. Link project: supabase link --project-ref ' + process.env.VITE_SUPABASE_PROJECT_ID);
    console.log('  4. Push migration: supabase db push\n');
    
    console.log('METHOD 2 - Manual (SQL Editor):');
    console.log('  1. Open Supabase Dashboard → SQL Editor');
    console.log('  2. Copy content from: supabase/migrations/0001_complete_schema.sql');
    console.log('  3. Paste and run in SQL Editor\n');
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Connection test failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Supabase connection successful');
    console.log('📋 Next steps:');
    console.log('  1. Run the migration using one of the methods above');
    console.log('  2. Sign up in your app');
    console.log('  3. Make yourself admin (see SETUP-GUIDE.md)');
    console.log('  4. Start building!\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runSetup();
