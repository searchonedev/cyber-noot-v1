// tools/TerminalTool.ts

import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

export const replyTweetToolSchema = z.object({
  internal_thoughts: z.string().describe('Your internal thoughts about what you want to reply to the tweet.'),
  tweet_length: z.string().describe('The length of the tweet you want to send. one word, very short, short, medium, long, very long.'),
  reply_tweet: z.string().describe('The reply to the tweet.'),
  media_type: z.enum(['none', 'gif', 'image']).describe('The type of media to include in the tweet. Use "gif" when it will enhance the interaction and make it more engaging. Trust your judgment on when a GIF will add value.'),
  gif_search_term: z.string().describe('If media_type is "gif", provide a search term that MUST start with "nootnootmfers" followed by a contextually appropriate reaction or emotion. Choose terms that enhance the conversation.')
}).refine(
  (data) => {
    // If media_type is 'gif', gif_search_term must be provided
    if (data.media_type === 'gif') {
      return !!data.gif_search_term;
    }
    return true;
  },
  {
    message: "gif_search_term is required when media_type is 'gif'",
    path: ['gif_search_term']
  }
);

export const ReplyTweetTool: Tool = {
  type: 'function',
  function: {
    "name": "reply_tweet_tool",
    "description": "Send a reply tweet. Use GIFs when they will enhance the interaction and make it more engaging. Trust your judgment on when a GIF will add value to the conversation.",
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
          "description": "The type of media to include in the tweet. Use 'gif' when it will enhance the interaction and make it more engaging. Trust your judgment on when a GIF will add value."
        },
        "gif_search_term": {
          "type": "string",
          "description": "If media_type is 'gif', provide a search term that MUST start with 'nootnootmfers' followed by a contextually appropriate reaction or emotion. Choose terms that enhance the conversation."
        }
      }
    }
  }
};