// tools/TerminalTool.ts

import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

// Define the content type enum for strict type checking
const MediaContentType = {
  Image: 'image',
  Video: 'video'
} as const;

export const mediaToolSchema = z.object({
  content_type: z.enum([MediaContentType.Image, MediaContentType.Video])
    .describe('The type of media to generate: either "image" or "video"'),
  media_prompt: z.string()
    .describe('A concise prompt (5-10 words max) for image generation. Focus on key elements only. Example: "penguin trading crypto at desk in igloo"')
});

export const MediaTool: Tool = {
  type: 'function',
  function: {
    "name": "generate_media",
    "description": "Based on the main tweet provided to you, generate media to accompany the tweet. Keep prompts concise (5-10 words).",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": [
        "content_type",
        "media_included"
      ],
      "properties": {
        "content_type": {
          "type": "string",
          "enum": [MediaContentType.Image, MediaContentType.Video],
          "description": "The type of media to generate: either \"image\" or \"video\""
        },
        "media_prompt": {
          "type": "string",
          "description": "A concise prompt (5-10 words max) for image generation. Focus on key elements only. Example: \"penguin trading crypto at desk in igloo\""
        }
      }
    }
  }
};