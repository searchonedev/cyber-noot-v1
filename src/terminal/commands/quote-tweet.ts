import { Command } from '../types/commands';
import { handleQuoteTweet } from '../../commands/twitter/quote-tweet';
import { isCooldownActive } from '../../twitter/utils/cooldowns';
import { Logger } from '../../utils/logger';

/**
 * @command twitter-quote
 * @description Quotes a specified tweet
 */
export const twitterQuote: Command = {
  name: 'quote-tweet',
  description: 'Quote a tweet. Only input the tweet ID number, raw digits. An agent will handle the rest.',
  parameters: [
    {
      name: 'tweetId',
      description: 'ID of the tweet to quote',
      required: true,
      type: 'string'
    }
  ],
  handler: async (args) => {
    try {
      // Check for quote tweet cooldown
      const cooldownInfo = await isCooldownActive('quote');
      if (cooldownInfo.isActive) {
        return {
          success: false,
          output: `Cannot quote tweet right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`
        };
      }

      const mediaUrls = args.mediaUrls ? args.mediaUrls.split(',').map((url: string) => url.trim()) : undefined;

      // Lazy import generateAndPostQuoteTweet to avoid initialization issues
      const { generateAndPostQuoteTweet } = await import('../../pipelines/generateQuote');
      
      // Use the enhanced pipeline
      const result = await generateAndPostQuoteTweet(args.tweetId, mediaUrls);
      
      return {
        success: result.success,
        output: `${result.success ? '✅' : '❌'} Action: Quote Tweet\n` +
               `Parent Tweet ID: ${args.tweetId}\n` +
               `${result.tweetId ? `Quote Tweet ID: ${result.tweetId}\n` : ''}` +
               `Status: ${result.success ? 'Success' : 'Failed'}\n` +
               `Text: ${result.quoteText}\n` +
               `Media: ${result.mediaUrls ? result.mediaUrls.join(', ') : 'None'}\n` +
               `Details: ${result.message}`
      };
    } catch (error) {
      Logger.log('Error in quote-tweet command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        output: `❌ Action: Quote Tweet\n` +
               `Parent Tweet ID: ${args.tweetId}\n` +
               `Status: Error\n` +
               `Details: ${errorMessage}`
      };
    }
  }
}; 