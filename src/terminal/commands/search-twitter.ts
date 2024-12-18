import { Command } from '../types/commands';
import { searchTwitter } from '../../twitter/functions/searchTwitter';
import { Logger } from '../../utils/logger';

/**
 * @command search-twitter
 * @description Search for tweets with a specific query
 */
export const searchTwitterCommand: Command = {
  name: 'search-twitter',
  description: 'Search for tweets with a specific query. Format: search-twitter <query> [limit]',
  parameters: [
    {
      name: 'query',
      description: 'Search query string',
      required: true,
      type: 'string'
    },
    {
      name: 'limit',
      description: 'Maximum number of results to return',
      required: false,
      type: 'number',
      defaultValue: '20'
    }
  ],
  handler: async (args) => {
    try {
      // Convert limit to number if provided
      const limit = typeof args.limit === 'string' ? parseInt(args.limit, 10) : args.limit;
      if (isNaN(limit)) {
        return {
          output: '❌ Error: Limit must be a valid number'
        };
      }

      const result = await searchTwitter(args.query, limit);
      return {
        output: result.startsWith('Error') ? `❌ ${result}` : `🔍 ${result}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Logger.log('Error in search-twitter command:', errorMessage);
      return {
        output: `❌ Error searching tweets: ${errorMessage}`
      };
    }
  }
}; 