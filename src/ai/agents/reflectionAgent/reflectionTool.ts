import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

// Zod schema for type checking
export const reflectionToolSchema = z.object({
  internal_analysis: z.string(),
  quality_score: z.number(),
  relevance_score: z.number(),
  critique: z.string(),
  suggestions: z.string(),
  should_post: z.boolean(),
  improved_version: z.string().optional(),
  formatting_check: z.object({
    is_lowercase: z.boolean(),
    has_proper_breaks: z.boolean(),
    formatting_issues: z.array(z.string())
  }),
  authenticity_check: z.object({
    is_authentic: z.boolean(),
    has_specific_examples: z.boolean(),
    natural_conversation: z.boolean(),
    authenticity_issues: z.array(z.string()),
    slang_usage: z.object({
      is_natural: z.boolean(),
      used_terms: z.array(z.string())
    })
  }),
  content_check: z.object({
    is_natural: z.boolean(),
    maintains_personality: z.boolean(),
    content_issues: z.array(z.string()),
    specific_examples: z.array(z.string()),
    connected_ideas: z.array(z.string()),
    original_observations: z.array(z.string())
  })
});

// Tool definition with JSON schema
export const ReflectionTool: Tool = {
  type: 'function',
  function: {
    name: 'reflect_on_tweet',
    description: 'Analyze a tweet for authenticity and basic content quality',
    parameters: {
      type: 'object',
      required: ['internal_analysis', 'quality_score', 'relevance_score', 'critique', 'suggestions', 'should_post', 'formatting_check', 'authenticity_check', 'content_check'],
      properties: {
        internal_analysis: { type: 'string' },
        quality_score: { type: 'number' },
        relevance_score: { type: 'number' },
        critique: { type: 'string' },
        suggestions: { type: 'string' },
        should_post: { type: 'boolean' },
        improved_version: { type: 'string' },
        formatting_check: {
          type: 'object',
          required: ['is_lowercase', 'has_proper_breaks', 'formatting_issues'],
          properties: {
            is_lowercase: { type: 'boolean' },
            has_proper_breaks: { type: 'boolean' },
            formatting_issues: { type: 'array', items: { type: 'string' } }
          }
        },
        authenticity_check: {
          type: 'object',
          required: ['is_authentic', 'has_specific_examples', 'natural_conversation', 'authenticity_issues', 'slang_usage'],
          properties: {
            is_authentic: { type: 'boolean' },
            has_specific_examples: { type: 'boolean' },
            natural_conversation: { type: 'boolean' },
            authenticity_issues: { type: 'array', items: { type: 'string' } },
            slang_usage: {
              type: 'object',
              required: ['is_natural', 'used_terms'],
              properties: {
                is_natural: { type: 'boolean' },
                used_terms: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        content_check: {
          type: 'object',
          required: ['is_natural', 'maintains_personality', 'content_issues', 'specific_examples', 'connected_ideas', 'original_observations'],
          properties: {
            is_natural: { type: 'boolean' },
            maintains_personality: { type: 'boolean' },
            content_issues: { type: 'array', items: { type: 'string' } },
            specific_examples: { type: 'array', items: { type: 'string' } },
            connected_ideas: { type: 'array', items: { type: 'string' } },
            original_observations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }
}; 