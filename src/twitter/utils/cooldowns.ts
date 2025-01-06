import { supabase } from '../../supabase/supabaseClient';
import { Logger } from '../../utils/logger';
import { COOLDOWN_OVERRIDE } from '../../cli';

export type TweetType = 'main' | 'quote' | 'retweet' | 'media' | 'reply';

// Cooldown duration in minutes for each tweet type
const COOLDOWN_DURATIONS: { [key in TweetType]: number } = {
  main: 120,    // 2 hours (range: 1.5-3 hours between tweets)
  quote: 720,   // 12 hours between quotes
  retweet: 720, // 12 hours between retweets
  media: 360,   // 6 hours (range: 4-8 hours)
  reply: 0      // No cooldown for replies
};

/**
 * Parses a timestamp string from the database and returns a Date object in UTC.
 */
function parseTimestampToUTC(timestamp: string): Date {
  const formattedTimestamp = timestamp.replace(' ', 'T') + 'Z';
  return new Date(formattedTimestamp);
}

interface TweetRecord {
  created_at: Date;
  text: string;
}

async function getLastTweetDetails(tweetType: TweetType): Promise<TweetRecord | null> {
  const { data, error } = await supabase
    .from('twitter_tweets')
    .select('created_at, text')
    .eq('tweet_type', tweetType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    Logger.log(`Error fetching last tweet details for type ${tweetType}:`, error.message);
    return null;
  }

  if (data && data.created_at) {
    const createdAtUTC = parseTimestampToUTC(data.created_at);
    return {
      created_at: createdAtUTC,
      text: data.text || ''
    };
  }
  return null;
}

/**
 * Checks if the cooldown is active for a specific tweet type.
 */
export async function isCooldownActive(tweetType: TweetType): Promise<{ isActive: boolean; remainingTime: number | null }> {
  if (COOLDOWN_OVERRIDE === true) {
    Logger.log(`Cooldown override is active - bypassing cooldown check for ${tweetType}`);
    return { isActive: false, remainingTime: null };
  }

  if (tweetType === 'reply') {
    Logger.log('Replies have no cooldown restrictions');
    return { isActive: false, remainingTime: null };
  }

  const lastTweetDetails = await getLastTweetDetails(tweetType);
  if (!lastTweetDetails) {
    Logger.log(`No previous tweets of type ${tweetType}. Cooldown not active.`);
    return { isActive: false, remainingTime: null };
  }

  const lastTweetTime = lastTweetDetails.created_at;
  const currentTime = new Date();
  let timeSinceLastTweet = currentTime.getTime() - lastTweetTime.getTime();
  const cooldownPeriod = COOLDOWN_DURATIONS[tweetType] * 60 * 1000;

  // Handle future lastTweetTime
  if (timeSinceLastTweet < 0) {
    Logger.log(`Warning: Last tweet time is in the future. Adjusting timeSinceLastTweet to 0.`);
    timeSinceLastTweet = 0;
  }

  const isActive = timeSinceLastTweet < cooldownPeriod;
  const remainingTime = isActive ? Math.ceil((cooldownPeriod - timeSinceLastTweet) / (60 * 1000)) : null;

  Logger.log(`Cooldown status for ${tweetType}:`, { isActive, remainingTime });
  return { isActive, remainingTime };
}

/**
 * Gets the current cooldown status for all tweet types.
 */
export async function getCooldownStatus(): Promise<string> {
  if (COOLDOWN_OVERRIDE === true) {
    return `Tweet Cooldown Status: COOLDOWNS ARE DISABLED VIA OVERRIDE FLAG`;
  }

  const [mainCooldown, quoteCooldown, retweetCooldown, mediaCooldown] = await Promise.all([
    isCooldownActive('main'),
    isCooldownActive('quote'),
    isCooldownActive('retweet'),
    isCooldownActive('media'),
  ]);

  return `Tweet Cooldown Status:
  Main Tweet: ${mainCooldown.isActive ? `CANNOT SEND A MAIN TWEET. COOLDOWN IS ACTIVE (${mainCooldown.remainingTime} minutes remaining)` : 'CAN SEND A MAIN TWEET. COOLDOWN IS INACTIVE'}
  Quote Tweet: ${quoteCooldown.isActive ? `CANNOT SEND A QUOTE TWEET. COOLDOWN IS ACTIVE (${quoteCooldown.remainingTime} minutes remaining)` : 'CAN SEND A QUOTE TWEET. COOLDOWN IS INACTIVE'}
  Retweet: ${retweetCooldown.isActive ? `CANNOT RETWEET. COOLDOWN IS ACTIVE (${retweetCooldown.remainingTime} minutes remaining)` : 'CAN RETWEET. COOLDOWN IS INACTIVE'}
  Media Tweet: ${mediaCooldown.isActive ? `CANNOT SEND A MEDIA TWEET. COOLDOWN IS ACTIVE (${mediaCooldown.remainingTime} minutes remaining)` : 'CAN SEND A MEDIA TWEET. COOLDOWN IS INACTIVE'}
  Replies: NO COOLDOWN - CAN ALWAYS REPLY`;
} 