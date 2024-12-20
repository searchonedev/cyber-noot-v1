import { scraper } from '../twitterClient';
import { prepareMediaData } from '../utils/mediaUtils';
import { logTweet } from '../../supabase/functions/twitter/tweetEntries';
import { Logger } from '../../utils/logger';
import { addMainTweet } from '../../memory/addMemories';

/**
 * Validates tweet text length based on Twitter Blue status
 * @param text - The tweet text to validate
 * @returns {boolean} True if valid, false if too long
 */
function validateTweetLength(text: string): boolean {
  // Twitter Blue allows up to 25,000 characters
  const TWITTER_BLUE_LIMIT = 25000;
  return text.length <= TWITTER_BLUE_LIMIT;
}

/**
 * Sends a main tweet with optional media and logs it to the database.
 * @param text - The text content of the tweet
 * @param mediaUrls - Optional array of media URLs
 * @returns The ID of the sent tweet, or null if failed
 */
export async function sendTweet(
  text: string,
  mediaUrls?: string[]
): Promise<string | null> {
  try {
    // Validate tweet length first
    if (!validateTweetLength(text)) {
      throw new Error(`Tweet exceeds character limit (${text.length}/25,000 characters)`);
    }

    Logger.log('Preparing to send tweet with text:', text);
    if (mediaUrls?.length) {
      Logger.log('Media URLs to process:', mediaUrls);
    }

    // Prepare media data for Twitter API
    let mediaData;
    if (mediaUrls?.length) {
      Logger.log('Preparing media data...');
      mediaData = await prepareMediaData(mediaUrls);
      Logger.log('Media data prepared:', mediaData.length, 'items');
    }

    // Send the tweet using the Twitter client
    Logger.log('Sending tweet to Twitter...');
    const response = await scraper.sendTweet(text, undefined, mediaData);
    const responseData = await response.json();
    Logger.log('Twitter API response:', responseData);

    const tweetId = responseData?.data?.create_tweet?.tweet_results?.result?.rest_id;

    if (tweetId) {
      Logger.log(`Tweet sent successfully (ID: ${tweetId})`);

      // Log the tweet to the database with prepared media data
      const logResult = await logTweet({
        tweet_id: tweetId,
        text: text,
        tweet_type: 'main',
        has_media: !!mediaData,
        created_at: new Date().toISOString()
      }, mediaData);

      if (logResult) {
        Logger.log(`Tweet logged with ID: ${logResult}`);
      } else {
        Logger.log('Failed to log tweet to Supabase.');
      }

      // Add the main tweet text to memory
      await addMainTweet([{ role: 'user', content: text }]);
      Logger.log('Main tweet text added to memory.');

      return tweetId;
    } else {
      Logger.log('Failed to retrieve tweet ID from response:', responseData);
      return null;
    }
  } catch (error) {
    Logger.log('Error sending tweet:', error);
    if (error.response) {
      Logger.log('Twitter API error response:', await error.response.json());
    }
    return null;
  }
}
