import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

export const reflectionToolSchema = z.object({
  internal_analysis: z.string().describe('INTERNAL ONLY: Your detailed analysis of the tweet quality and relevance - this will not be posted'),
  quality_score: z.number().min(1).max(10).describe('Rate the overall quality from 1-10'),
  relevance_score: z.number().min(1).max(10).describe('Rate how relevant and timely the tweet is from 1-10'),
  banned_words_check: z.object({
    has_banned_words: z.boolean().describe('Whether the tweet contains any banned words or phrases'),
    found_banned_words: z.array(z.string()).describe('List of banned words or phrases found in the tweet'),
    suggestions: z.string().describe('Suggestions for replacing banned words if found')
  }).describe('Results of checking for banned words and phrases'),
  formatting_check: z.object({
    is_lowercase: z.boolean().describe('Whether the tweet is properly formatted in lowercase'),
    has_proper_breaks: z.boolean().describe('Whether line breaks are used appropriately'),
    formatting_issues: z.array(z.string()).describe('List of any formatting issues found')
  }).describe('Results of checking tweet formatting'),
  content_check: z.object({
    is_natural: z.boolean().describe('Whether the language feels natural and conversational'),
    maintains_personality: z.boolean().describe('Whether it maintains noot\'s personality'),
    content_issues: z.array(z.string()).describe('List of any content issues found')
  }).describe('Results of checking tweet content'),
  critique: z.string().describe('INTERNAL ONLY: Specific points of critique about the tweet - this will not be posted'),
  suggestions: z.string().describe('INTERNAL ONLY: Suggestions for improvement if needed - this will not be posted'),
  should_post: z.boolean().describe('Final decision on whether the original tweet should be posted'),
  improved_version: z.string().optional().describe('If needed, provide an improved version of the original tweet')
});

export const ReflectionTool: Tool = {
  type: 'function',
  function: {
    name: 'reflect_on_tweet',
    description: 'INTERNAL TOOL: Critically analyze a tweet before posting to ensure high quality, relevance, and compliance with guidelines.',
    strict: true,
    parameters: {
      type: 'object',
      required: [
        'internal_analysis',
        'quality_score',
        'relevance_score',
        'banned_words_check',
        'formatting_check',
        'content_check',
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
        banned_words_check: {
          type: 'object',
          description: 'Results of checking for banned words and phrases',
          required: ['has_banned_words', 'found_banned_words', 'suggestions'],
          properties: {
            has_banned_words: {
              type: 'boolean',
              description: 'Whether the tweet contains any banned words or phrases'
            },
            found_banned_words: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of banned words or phrases found in the tweet'
            },
            suggestions: {
              type: 'string',
              description: 'Suggestions for replacing banned words if found'
            }
          }
        },
        formatting_check: {
          type: 'object',
          description: 'Results of checking tweet formatting',
          required: ['is_lowercase', 'has_proper_breaks', 'formatting_issues'],
          properties: {
            is_lowercase: {
              type: 'boolean',
              description: 'Whether the tweet is properly formatted in lowercase'
            },
            has_proper_breaks: {
              type: 'boolean',
              description: 'Whether line breaks are used appropriately'
            },
            formatting_issues: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of any formatting issues found'
            }
          }
        },
        content_check: {
          type: 'object',
          description: 'Results of checking tweet content',
          required: ['is_natural', 'maintains_personality', 'content_issues'],
          properties: {
            is_natural: {
              type: 'boolean',
              description: 'Whether the language feels natural and conversational'
            },
            maintains_personality: {
              type: 'boolean',
              description: 'Whether it maintains noot\'s personality'
            },
            content_issues: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of any content issues found'
            }
          }
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