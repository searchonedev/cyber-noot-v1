import { Command } from '../types/commands';

/**
 * @command reply-to-tweet
 * @description Replies to a specified tweet
 */
export const replyToTweetCommand: Command = {
  name: 'reply-to-tweet',
  description: 'Reply to a tweet. Usage: reply-to-tweet <tweet_id> [text]. If text is not provided, the agent will generate a reply with GIF.',
  parameters: [
    {
      name: 'tweetId',
      description: 'ID of the tweet to reply to (numbers only)',
      required: true,
      type: 'string'
    },
    {
      name: 'text',
      description: 'Text content of the reply (optional - agent will generate if not provided)',
      required: false,
      type: 'string'
    }
  ],
  handler: async (args) => {
    try {
      // Handle args being undefined
      if (!args || !args.tweetId) {
        return {
          output: `❌ Action: Reply Tweet\nStatus: Failed\nDetails: Tweet ID is required.`
        };
      }

      // Clean up the tweet ID - remove any 'id:' prefix and whitespace
      const cleanTweetId = args.tweetId.toString().replace(/^id:/, '').trim();
      
      // Validate tweet ID format
      if (!/^\d+$/.test(cleanTweetId)) {
        return {
          output: `❌ Action: Reply Tweet\nStatus: Failed\nDetails: Invalid tweet ID format. Please provide only the numeric ID.`
        };
      }

      // Lazy import generateAndPostReply to avoid initialization issues
      const { generateAndPostReply } = await import('../../pipelines/generateReply');
      
      // If no text provided, use AI generation with ! prefix
      const textToUse = args.text ? args.text : "!generate a fun and engaging reply with a relevant gif";
      
      // Use the enhanced pipeline - if text is not provided, it will be generated
      const result = await generateAndPostReply(cleanTweetId, textToUse);
      
      return {
        output: `${result.success ? '✅' : '❌'} Action: Reply Tweet\n` +
               `Parent Tweet ID: ${cleanTweetId}\n` +
               `${result.tweetId ? `Reply Tweet ID: ${result.tweetId}\n` : ''}` +
               `Status: ${result.success ? 'Success' : 'Failed'}\n` +
               `Text: ${result.replyText}\n` +
               `Media: ${result.mediaUrls ? result.mediaUrls.join(', ') : 'None'}\n` +
               `Details: ${result.message}`
      };
    } catch (error) {
      return {
        output: `❌ Action: Reply Tweet\n` +
               `Parent Tweet ID: ${args.tweetId}\n` +
               `Status: Error\n` +
               `Details: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      };
    }
  }
}; 