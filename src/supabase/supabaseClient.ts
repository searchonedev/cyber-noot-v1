// Supabase client initialization with service role key for backend operations

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from './types/database.types';  // We'll need to generate this

// Load environment variables
dotenv.config();

// Debug log
console.log('Checking Supabase env vars:', {
  url: process.env.SUPABASE_URL ? 'exists' : 'missing',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing'
});

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client with service role key for full database access
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false  // Since this is running server-side
    },
    db: {
      schema: 'public'
    }
  }
);

// Verify connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Error initializing Supabase client:', error.message);
    throw error;
  }
  console.log('Supabase client initialized successfully');
});

// Test connection with a simple query
const testConnection = async () => {
  try {
    // Use a simpler query that PostgREST can handle
    const { data, error } = await supabase
      .from('short_term_terminal_history')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return;
    }
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Supabase connection test failed:', error);
  }
};

// Run the test immediately
testConnection();