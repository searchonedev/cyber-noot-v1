import { Logger } from '../../utils/logger';
import fetch from 'node-fetch';
import { scraper } from '../twitterClient';

// Interface for Tenor API response
interface TenorResponse {
  results: {
    id: string;
    media_formats: {
      gif: {
        url: string;
        duration: number;
        dims: number[];
        size: number;
      };
      // Add tinygif format which is usually smaller
      tinygif: {
        url: string;
        duration: number;
        dims: number[];
        size: number;
      };
    };
    title: string;
  }[];
}

const MAX_GIF_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Array of Pingu-themed search variations to add variety
const PINGU_VARIATIONS = [
  'pingu noot noot',
  'noot noot',
  'pingu angry',
  'pingu happy',
  'pingu dance',
  'pingu excited',
  'pingu confused',
  'nootnootmfers',
  'penguin pingu'
];

/**
 * Enhances search term with random Pingu variations
 * @param searchTerm - Original search term
 * @returns Enhanced search term
 */
function enhanceSearchTerm(searchTerm: string): string {
  // If it's already a Pingu-related term, use it directly
  if (PINGU_VARIATIONS.some(term => searchTerm.toLowerCase().includes(term))) {
    return searchTerm;
  }
  // Otherwise, combine with a random Pingu variation
  const randomVariation = PINGU_VARIATIONS[Math.floor(Math.random() * PINGU_VARIATIONS.length)];
  return `${randomVariation} ${searchTerm}`;
}

/**
 * Searches for and retrieves a GIF from Tenor
 * @param searchTerm - The search term to find a GIF
 * @returns Promise with the GIF URL or null if not found
 */
export async function searchTenorGif(searchTerm: string): Promise<string | null> {
  try {
    // Ensure TENOR_API_KEY is set in environment variables
    const TENOR_API_KEY = process.env.TENOR_API_KEY;
    if (!TENOR_API_KEY) {
      Logger.log('Error: TENOR_API_KEY not found in environment variables');
      return null;
    }

    // Enhance search term and construct Tenor API endpoint
    const enhancedTerm = enhanceSearchTerm(searchTerm);
    const endpoint = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(enhancedTerm)}&key=${TENOR_API_KEY}&limit=10`;
    
    // Fetch GIF from Tenor
    const response = await fetch(endpoint);
    const data = await response.json() as TenorResponse;

    if (data.results && data.results.length > 0) {
      // Shuffle results for more variety
      const shuffledResults = [...data.results].sort(() => Math.random() - 0.5);
      
      // Try to find a GIF that's under the size limit
      for (const result of shuffledResults) {
        // First try the regular gif format
        if (result.media_formats.gif && result.media_formats.gif.size < MAX_GIF_SIZE) {
          return result.media_formats.gif.url;
        }
        // If regular gif is too large, try the tinygif format
        if (result.media_formats.tinygif) {
          return result.media_formats.tinygif.url;
        }
      }
      // If no suitable size found, use the first tinygif or return null
      return shuffledResults[0].media_formats.tinygif?.url || null;
    }

    Logger.log('No suitable GIF results found for search term:', searchTerm);
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
      return { success: false, message: 'Failed to find GIF on Tenor' };
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