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
  description: 'Posts a tweet with a Tenor GIF. Requires tweet text and GIF search term.',
  parameters: [
    {
      name: 'text',
      description: 'The text content of the tweet',
      required: true,
      type: 'string'
    },
    {
      name: 'gif_search',
      description: 'Search term to find a GIF on Tenor',
      required: true,
      type: 'string'
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

      // Validate input
      if (!args.text || !args.gif_search) {
        return {
          output: '❌ Action: Post GIF Tweet\n' +
                 'Status: Failed\n' +
                 'Reason: Both tweet text and GIF search term are required.'
        };
      }

      // Post tweet with GIF
      const result = await postTweetWithTenorGif(args.text, args.gif_search);

      return {
        output: `${result.success ? '✅' : '��'} Action: Post GIF Tweet\n` +
               `Status: ${result.success ? 'Success' : 'Failed'}\n` +
               `${result.tweetId ? `Tweet ID: ${result.tweetId}\n` : ''}` +
               `Text: ${args.text}\n` +
               `GIF Search: ${args.gif_search}\n` +
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