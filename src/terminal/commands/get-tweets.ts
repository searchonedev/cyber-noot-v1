import { Command } from '../types/commands';
import { getTweets } from '../../twitter/functions/getTweets';

/**
 * @command get-tweets
 * @description Get recent tweets from a specified user
 */
export const getTweetsCommand: Command = {
  name: 'get-tweets',
  description: 'Get recent tweets from a specified user. Do not include the @ symbol.',
  parameters: [
    {
      name: 'username',
      description: 'Twitter username (without @ symbol)',
      required: true,
      type: 'string'
    }
  ],
  handler: async (args) => {
    try {
      const result = await getTweets(args.username, 10);
      return {
        output: result.startsWith('Error') ? `❌ ${result}` : `📝 ${result}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        output: `❌ Error fetching tweets: ${errorMessage}`
      };
    }
  }
}; 