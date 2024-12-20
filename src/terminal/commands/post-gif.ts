import { Command } from '../types/commands';
import { postTweetWithTenorGif } from '../../twitter/utils/gifUtils';
import { isCooldownActive } from '../../supabase/functions/twitter/cooldowns';
import { Logger } from '../../utils/logger';

/**
 * @command post-gif
 * @description Posts a tweet with a Tenor GIF
 */
export const postGifCommand: Command = {
  name: 'post-gif',
  description: 'Posts a tweet with a Tenor GIF. Usage: post-gif -t "tweet text" -m "gif search term"',
  parameters: [
    {
      name: 'text',
      description: 'The text content of the tweet',
      required: true,
      type: 'string',
      flag: 't'
    },
    {
      name: 'media_search',
      description: 'Search term to find a GIF on Tenor',
      required: true,
      type: 'string',
      flag: 'm'
    }
  ],
  handler: async (args) => {
    try {
      // Check for tweet cooldown
      const cooldownInfo = await isCooldownActive('media');
      if (cooldownInfo.isActive) {
        return {
          output: '❌ Action: Post GIF Tweet\n' +
                  'Status: Failed\n' +
                  `Reason: Tweet cooldown is active. Please wait ${cooldownInfo.remainingTime} minutes before tweeting again.`
        };
      }

      // Parse command line arguments
      const tweetText = args.t || args.text;
      const gifSearch = args.m || args.media_search;

      // Validate input
      if (!tweetText || !gifSearch) {
        return {
          output: '❌ Action: Post GIF Tweet\n' +
                 'Status: Failed\n' +
                 'Reason: Both tweet text (-t) and GIF search term (-m) are required.\n' +
                 'Usage: post-gif -t "tweet text" -m "gif search term"'
        };
      }

      // Post tweet with GIF
      const result = await postTweetWithTenorGif(tweetText, gifSearch);

      return {
        output: `${result.success ? '✅' : '❌'} Action: Post GIF Tweet\n` +
               `Status: ${result.success ? 'Success' : 'Failed'}\n` +
               `${result.tweetId ? `Tweet ID: ${result.tweetId}\n` : ''}` +
               `Tweet Text: ${tweetText}\n` +
               `GIF Search Term: ${gifSearch}\n` +
               `Details: ${result.message}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Logger.log('Error in post-gif command:', errorMessage);
      return {
        output: '❌ Action: Post GIF Tweet\n' +
               'Status: Error\n' +
               `Details: ${errorMessage}`
      };
    }
  }
}; 