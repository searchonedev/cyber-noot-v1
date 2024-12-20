import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

export const reflectionToolSchema = z.object({
  internal_analysis: z.string().describe('INTERNAL ONLY: Your detailed analysis of the tweet quality and relevance - this will not be posted'),
  quality_score: z.number().min(1).max(10).describe('Rate the overall quality from 1-10'),
  relevance_score: z.number().min(1).max(10).describe('Rate how relevant and timely the tweet is from 1-10'),
  critique: z.string().describe('INTERNAL ONLY: Specific points of critique about the tweet - this will not be posted'),
  suggestions: z.string().describe('INTERNAL ONLY: Suggestions for improvement if needed - this will not be posted'),
  should_post: z.boolean().describe('Final decision on whether the original tweet should be posted'),
  improved_version: z.string().optional().describe('If needed, provide an improved version of the original tweet')
});

export const ReflectionTool: Tool = {
  type: 'function',
  function: {
    name: 'reflect_on_tweet',
    description: 'INTERNAL TOOL: Critically analyze a tweet before posting to ensure high quality and relevance. This analysis will not be posted.',
    strict: true,
    parameters: {
      type: 'object',
      required: [
        'internal_analysis',
        'quality_score',
        'relevance_score',
        'critique',
        'suggestions',
        'should_post'
      ],
      properties: {
        internal_analysis: {
          type: 'string',
          description: 'INTERNAL ONLY: Your detailed analysis of why this tweet is or is not good enough to post - this will not be posted'
        },
        quality_score: {
          type: 'number',
          description: 'Rate the overall quality from 1-10'
        },
        relevance_score: {
          type: 'number',
          description: 'Rate how relevant and timely the tweet is from 1-10'
        },
        critique: {
          type: 'string',
          description: 'INTERNAL ONLY: Specific points of critique about the tweet - this will not be posted'
        },
        suggestions: {
          type: 'string',
          description: 'INTERNAL ONLY: Concrete suggestions for improvement if needed - this will not be posted'
        },
        should_post: {
          type: 'boolean',
          description: 'Final decision on whether the original tweet should be posted'
        },
        improved_version: {
          type: 'string',
          description: 'If needed, provide an improved version of the original tweet'
        }
      }
    }
  }
}; 