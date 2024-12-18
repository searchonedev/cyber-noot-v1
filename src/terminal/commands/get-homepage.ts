import { Command } from '../types/commands';
import { getHomepage } from '../../twitter/functions/getHomepage';
import { Logger } from '../../utils/logger';

/**
 * @command get-homepage
 * @description Get the homepage of your timeline
 */
export const get_homepage: Command = {
  name: 'get-homepage',
  description: 'Get the homepage of your timeline',
  parameters: [],
  handler: async (args) => {
    try {
      const tweets = await getHomepage(10);
      if (tweets.length === 0) {
        Logger.log('No tweets found in homepage timeline');
        return {
          output: '📭 No unhandled tweets found in your homepage timeline.'
        };
      }
      Logger.log(`Found ${tweets.length} tweets in homepage timeline`);
      return {
        output: `📱 Found ${tweets.length} unhandled tweet${tweets.length === 1 ? '' : 's'} in timeline:\n${tweets.join('\n')}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Logger.log('Error fetching homepage:', errorMessage);
      return {
        output: `❌ Error fetching homepage: ${errorMessage}`
      };
    }
  }
}; 