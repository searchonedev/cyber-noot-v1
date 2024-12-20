import { createClient } from '@supabase/supabase-js';
import { Logger } from '../utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  Logger.log('Missing required environment variables');
  process.exit(1);
}

// Create a new Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createMediaBucket() {
  try {
    Logger.log('Attempting to create media bucket...');
    
    // Create the media bucket
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/*', 'video/*']
    });

    if (error) {
      Logger.log('Error creating media bucket:', error);
      throw error;
    }

    Logger.log('Successfully created media bucket:', data);
    
    // Verify bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      Logger.log('Error listing buckets:', listError);
    } else {
      Logger.log('Available buckets:', buckets);
    }
  } catch (error) {
    Logger.log('Exception in createMediaBucket:', error);
    throw error;
  }
}

// Run the function
createMediaBucket()
  .then(() => {
    Logger.log('Media bucket creation completed');
    process.exit(0);
  })
  .catch((error) => {
    Logger.log('Media bucket creation failed:', error);
    process.exit(1);
  }); 