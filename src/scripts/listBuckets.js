import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create a new Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listBuckets() {
  try {
    console.log('Listing storage buckets...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      throw error;
    }

    console.log('Available buckets:', buckets);
  } catch (error) {
    console.error('Exception in listBuckets:', error);
    throw error;
  }
}

// Run the function
listBuckets()
  .then(() => {
    console.log('Bucket listing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Bucket listing failed:', error);
    process.exit(1);
  }); 