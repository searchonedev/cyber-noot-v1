// tools/TerminalTool.ts

import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

export const replyTweetToolSchema = z.object({
  internal_thoughts: z.string().describe('Your internal thoughts about what you want to reply to the tweet.'),
  tweet_length: z.string().describe('The length of the tweet you want to send. one word, very short, short, medium, long, very long.'),
  reply_tweet: z.string().describe('The reply to the tweet.'),
  media_type: z.enum(['none', 'gif', 'image']).describe('The type of media to include in the tweet. Use "gif" if you want to include a Tenor GIF, "image" for generated images, or "none" for text-only tweets.'),
  gif_search_term: z.string().optional().describe('If media_type is "gif", provide a search term to find an appropriate GIF on Tenor. Make it specific and descriptive for better results.')
});

export const ReplyTweetTool: Tool = {
  type: 'function',
  function: {
    "name": "reply_tweet_tool",
    "description": "Send a reply tweet. You can include a GIF from Tenor by setting media_type to 'gif' and providing a gif_search_term, or request a generated image by setting media_type to 'image'.",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": [
        "internal_thoughts",
        "tweet_length",
        "reply_tweet",
        "media_type"
      ],
      "properties": {
        "internal_thoughts": {
          "type": "string",
          "description": "Your internal thoughts about what you want to reply to the tweet."
        },
        "tweet_length": {
          "type": "string",
          "description": "The length of the tweet you want to send. one word, very short, short, medium, long, very long."
        },
        "reply_tweet": {
          "type": "string",
          "description": "The reply to the tweet."
        },
        "media_type": {
          "type": "string",
          "enum": ["none", "gif", "image"],
          "description": "The type of media to include in the tweet. Use 'gif' if you want to include a Tenor GIF, 'image' for generated images, or 'none' for text-only tweets."
        },
        "gif_search_term": {
          "type": "string",
          "description": "If media_type is 'gif', provide a search term to find an appropriate GIF on Tenor. Make it specific and descriptive for better results."
        }
      }
    }
  }
};