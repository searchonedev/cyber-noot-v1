import { MemorySummaries } from '../supabase/functions/memory/summaries';
import { getRecentMainTweets } from '../supabase/functions/twitter/tweetEntries';

// Initialize variables with default values
let activeSummariesValue: string = 'Loading summaries...';
let recentMainTweetsValue: string = 'Loading recent tweets...';

// Create an initialization promise
const initialization = (async () => {
  try {
    const [summaries, tweets] = await Promise.all([
      MemorySummaries.getFormattedActiveSummaries(),
      getRecentMainTweets()
    ]);
    
    activeSummariesValue = summaries ?? 'No summaries available';
    recentMainTweetsValue = tweets ?? 'No recent tweets available';
  } catch (error) {
    console.error('Error initializing dynamic variables:', 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
})();

// Export functions that check initialization
export async function activeSummaries(): Promise<string> {
  await initialization;
  return activeSummariesValue;
}

export async function recentMainTweets(): Promise<string> {
  await initialization;
  return recentMainTweetsValue;
}