import { Logger } from '../../utils/logger';
import fetch from 'node-fetch';
import { scraper } from '../twitterClient';

// Interface for Tenor V2 API response
interface TenorResponse {
  results: {
    id: string;
    title: string;
    media_formats: {
      gif: {
        url: string;
        duration: number;
        dims: number[];
        size: number;
      };
      tinygif: {
        url: string;
        duration: number;
        dims: number[];
        size: number;
      };
      mp4: {
        url: string;
        duration: number;
        dims: number[];
        size: number;
      };
    };
    tags: string[];
    content_rating: string;
  }[];
}

// Size limits for GIFs
const MAX_GIF_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const TWITTER_GIF_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB for GIFs
const SAFE_GIF_SIZE_LIMIT = 8 * 1024 * 1024; // 8MB for reliable uploads

// Core search terms for Pingu-themed GIFs
const CORE_SEARCH_TERMS = [
  'pingu',
  'nootnoot',
  'nootnootmfers'
];

// Content filters
const CONTENT_FILTERS = {
  contentfilter: 'off', // Tenor's content filter
  media_filter: 'minimal', // Minimal filtering for better results
  ar_range: 'all', // All aspect ratios
  random: true // Enable random results
};

/**
 * Combines user's search term with core Pingu terms for contextual searches
 * @param userTerm - The user's search term
 * @returns Array of combined search terms
 */
function getContextualSearchTerms(userTerm: string): string[] {
  // Clean user term
  const cleanUserTerm = userTerm.toLowerCase().trim();
  
  // If the user's term already contains one of our core terms, use it as is
  if (CORE_SEARCH_TERMS.some(term => cleanUserTerm.includes(term))) {
    return [cleanUserTerm];
  }
  
  // Otherwise, combine each core term with the user's term
  const contextualTerms = CORE_SEARCH_TERMS.map(coreTerm => 
    `${coreTerm} ${cleanUserTerm}`
  );
  
  Logger.log(`Generated search terms for "${userTerm}":`, contextualTerms);
  return contextualTerms;
}

/**
 * Searches for and retrieves a GIF from Tenor
 * @param searchTerm - The user's search term for contextual GIF search
 * @returns Promise with the GIF URL or null if not found
 */
export async function searchTenorGif(searchTerm: string): Promise<string | null> {
  try {
    // Ensure TENOR_API_KEY is set
    const TENOR_API_KEY = process.env.TENOR_API_KEY;
    if (!TENOR_API_KEY) {
      Logger.log('Error: TENOR_API_KEY not found in environment variables');
      return null;
    }

    // Get contextual search terms
    const searchTerms = getContextualSearchTerms(searchTerm);
    
    // Try each search term until we find a suitable GIF
    for (const searchQuery of searchTerms) {
      Logger.log(`Trying search term: ${searchQuery}`);
      
      // Build V2 API URL with parameters
      const params = new URLSearchParams({
        q: searchQuery,
        key: TENOR_API_KEY,
        client_key: 'nootnoot_twitter_bot',
        limit: '30',
        contentfilter: CONTENT_FILTERS.contentfilter,
        media_filter: CONTENT_FILTERS.media_filter,
        ar_range: CONTENT_FILTERS.ar_range,
        random: CONTENT_FILTERS.random.toString()
      } as Record<string, string>);
      
      const endpoint = `https://tenor.googleapis.com/v2/search?${params}`;
      
      // Fetch GIFs from Tenor
      const response = await fetch(endpoint);
      const data = await response.json() as TenorResponse;

      if (data.results && data.results.length > 0) {
        // Shuffle results for variety
        const shuffledResults = [...data.results].sort(() => Math.random() - 0.5);
        
        // First try: Find a high quality GIF under safe size limit
        for (const result of shuffledResults) {
          // Check if it has appropriate formats
          if (!result.media_formats.gif && !result.media_formats.tinygif) {
            continue;
          }

          // Try gif format first
          if (result.media_formats.gif && result.media_formats.gif.size < SAFE_GIF_SIZE_LIMIT) {
            const sizeMB = Math.round(result.media_formats.gif.size / 1024 / 1024);
            Logger.log(`Found safe-sized high quality GIF (${sizeMB}MB) for search: ${searchQuery}`);
            return result.media_formats.gif.url;
          }

          // Try tinygif as fallback
          if (result.media_formats.tinygif && result.media_formats.tinygif.size < SAFE_GIF_SIZE_LIMIT) {
            const sizeMB = Math.round(result.media_formats.tinygif.size / 1024 / 1024);
            Logger.log(`Found safe-sized tiny GIF (${sizeMB}MB) for search: ${searchQuery}`);
            return result.media_formats.tinygif.url;
          }
        }

        // Second try: Accept larger GIFs under Twitter's limit
        for (const result of shuffledResults) {
          if (result.media_formats.gif && result.media_formats.gif.size < TWITTER_GIF_SIZE_LIMIT) {
            const sizeMB = Math.round(result.media_formats.gif.size / 1024 / 1024);
            Logger.log(`Using larger GIF (${sizeMB}MB) for search: ${searchQuery} - may be less reliable`);
            return result.media_formats.gif.url;
          }
        }
      }
      
      Logger.log(`No suitable GIFs found for search: ${searchQuery}, trying next term`);
    }

    Logger.log('No suitable GIFs found for any search terms');
    return null;

  } catch (error) {
    if (error instanceof Error) {
      Logger.log('Error fetching GIF from Tenor:', error.message);
    } else {
      Logger.log('Unknown error fetching GIF from Tenor');
    }
    return null;
  }
}

/**
 * Downloads a GIF from a URL and returns it as a buffer
 * @param gifUrl - The URL of the GIF to download
 * @returns Promise with the GIF buffer or null if download fails
 */
export async function downloadGif(gifUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(gifUrl);
    if (!response.ok) {
      throw new Error(`Failed to download GIF: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof Error) {
      Logger.log('Error downloading GIF:', error.message);
    } else {
      Logger.log('Unknown error downloading GIF');
    }
    return null;
  }
}

/**
 * Posts a tweet with a Tenor GIF
 * @param tweetText - The text content of the tweet
 * @param searchTerm - The search term to find a GIF
 * @returns Promise with tweet result
 */
export async function postTweetWithTenorGif(
  tweetText: string,
  searchTerm: string
): Promise<{ success: boolean; message: string; tweetId?: string }> {
  try {
    // Search for GIF
    const gifUrl = await searchTenorGif(searchTerm);
    if (!gifUrl) {
      return { success: false, message: 'Failed to find appropriate GIF on Tenor' };
    }

    // Download GIF
    const gifBuffer = await downloadGif(gifUrl);
    if (!gifBuffer) {
      return { success: false, message: 'Failed to download GIF' };
    }

    // Post tweet with media
    const response = await scraper.sendTweet(tweetText, undefined, [{
      data: gifBuffer,
      mediaType: 'image/gif'
    }]);
    const responseData = await response.json();
    const tweetId = responseData?.data?.create_tweet?.tweet_results?.result?.rest_id;

    return {
      success: true,
      message: 'Successfully posted tweet with Tenor GIF',
      tweetId: tweetId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    Logger.log('Error posting tweet with Tenor GIF:', errorMessage);
    return {
      success: false,
      message: `Error posting tweet: ${errorMessage}`
    };
  }
} 