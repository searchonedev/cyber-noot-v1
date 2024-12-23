import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

// Schema for engagement metrics
const engagementMetricsSchema = z.object({
  likes: z.number(),
  retweets: z.number(),
  replies: z.number(),
  quotes: z.number(),
  total_engagement: z.number(),
  engagement_rate: z.number(),
});

// Schema for temporal metrics
const temporalMetricsSchema = z.object({
  hour_of_day: z.number(),
  day_of_week: z.number(),
  response_time_minutes: z.number().optional(),
  is_optimal_time: z.boolean(),
});

// Schema for content analysis
const contentAnalysisSchema = z.object({
  has_media: z.boolean(),
  media_type: z.enum(['none', 'image', 'gif', 'video']),
  tweet_length: z.number(),
  has_links: z.boolean(),
  topics: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  language_style: z.object({
    is_question: z.boolean(),
    is_statement: z.boolean(),
    is_call_to_action: z.boolean(),
    tone: z.enum(['casual', 'technical', 'humorous', 'serious']),
  }),
});

// Schema for performance patterns
const performancePatternSchema = z.object({
  pattern_type: z.enum(['success', 'failure']),
  pattern_description: z.string(),
  contributing_factors: z.array(z.string()),
  improvement_suggestions: z.array(z.string()),
});

// Main research tool schema
export const researchToolSchema = z.object({
  tweet_id: z.string(),
  timestamp: z.string(),
  engagement_metrics: engagementMetricsSchema,
  temporal_metrics: temporalMetricsSchema,
  content_analysis: contentAnalysisSchema,
  performance_patterns: z.array(performancePatternSchema),
  success_score: z.number().min(0).max(100),
  key_learnings: z.array(z.string()),
  recommendations: z.array(z.object({
    category: z.enum(['timing', 'content', 'engagement', 'strategy']),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    expected_impact: z.string(),
  })),
  internal_notes: z.string().describe('INTERNAL ONLY: Additional analysis notes - this will not be shared'),
});

// Research tool definition
export const ResearchTool: Tool = {
  type: 'function',
  function: {
    name: 'analyze_tweet_performance',
    description: 'Analyze the performance of a tweet and generate insights for improvement',
    strict: true,
    parameters: {
      type: 'object',
      required: [
        'tweet_id',
        'timestamp',
        'engagement_metrics',
        'temporal_metrics',
        'content_analysis',
        'performance_patterns',
        'success_score',
        'key_learnings',
        'recommendations',
        'internal_notes'
      ],
      properties: {
        tweet_id: {
          type: 'string',
          description: 'The ID of the tweet being analyzed'
        },
        timestamp: {
          type: 'string',
          description: 'When the tweet was posted'
        },
        engagement_metrics: {
          type: 'object',
          description: 'Metrics about tweet engagement',
          required: ['likes', 'retweets', 'replies', 'quotes', 'total_engagement', 'engagement_rate'],
          properties: {
            likes: { type: 'number' },
            retweets: { type: 'number' },
            replies: { type: 'number' },
            quotes: { type: 'number' },
            total_engagement: { type: 'number' },
            engagement_rate: { type: 'number' }
          }
        },
        temporal_metrics: {
          type: 'object',
          description: 'Time-based metrics',
          required: ['hour_of_day', 'day_of_week', 'is_optimal_time'],
          properties: {
            hour_of_day: { type: 'number' },
            day_of_week: { type: 'number' },
            response_time_minutes: { type: 'number' },
            is_optimal_time: { type: 'boolean' }
          }
        },
        content_analysis: {
          type: 'object',
          description: 'Analysis of tweet content',
          required: ['has_media', 'media_type', 'tweet_length', 'has_links', 'topics', 'sentiment', 'language_style'],
          properties: {
            has_media: { type: 'boolean' },
            media_type: { type: 'string', enum: ['none', 'image', 'gif', 'video'] },
            tweet_length: { type: 'number' },
            has_links: { type: 'boolean' },
            topics: { type: 'array', items: { type: 'string' } },
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            language_style: {
              type: 'object',
              required: ['is_question', 'is_statement', 'is_call_to_action', 'tone'],
              properties: {
                is_question: { type: 'boolean' },
                is_statement: { type: 'boolean' },
                is_call_to_action: { type: 'boolean' },
                tone: { type: 'string', enum: ['casual', 'technical', 'humorous', 'serious'] }
              }
            }
          }
        },
        performance_patterns: {
          type: 'array',
          description: 'Identified performance patterns',
          items: {
            type: 'object',
            required: ['pattern_type', 'pattern_description', 'contributing_factors', 'improvement_suggestions'],
            properties: {
              pattern_type: { type: 'string', enum: ['success', 'failure'] },
              pattern_description: { type: 'string' },
              contributing_factors: { type: 'array', items: { type: 'string' } },
              improvement_suggestions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        success_score: {
          type: 'number',
          description: 'Overall success score from 0-100'
        },
        key_learnings: {
          type: 'array',
          description: 'Key insights learned from this tweet',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          description: 'Specific recommendations for improvement',
          items: {
            type: 'object',
            required: ['category', 'description', 'priority', 'expected_impact'],
            properties: {
              category: { type: 'string', enum: ['timing', 'content', 'engagement', 'strategy'] },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              expected_impact: { type: 'string' }
            }
          }
        },
        internal_notes: {
          type: 'string',
          description: 'INTERNAL ONLY: Additional analysis notes - this will not be shared'
        }
      }
    }
  }
}; 