import { BaseAgent } from '../BaseAgent';
import { ModelClient } from '../../types/agentSystem';
import { reflectionAgentConfig } from './reflectionAgentConfig';
import { ReflectionTool, reflectionToolSchema } from './reflectionTool';
import { Logger } from '../../../utils/logger';

export class ReflectionAgent extends BaseAgent<typeof reflectionToolSchema> {
  constructor(modelClient: ModelClient) {
    super(reflectionAgentConfig, modelClient, reflectionToolSchema);
  }

  protected defineTools(): void {
    this.tools = [ReflectionTool];
  }

  /**
   * Analyze a tweet before posting
   * @param tweetText The tweet text to analyze
   * @param context Additional context about the tweet (e.g., what triggered it, relevant memories)
   * @returns Analysis results including whether the tweet should be posted
   */
  async analyzeTweet(tweetText: string, context: string = ''): Promise<{
    should_post: boolean;
    quality_score: number;
    relevance_score: number;
    critique: string;
    suggestions: string;
    improved_version?: string;
    formatting_check: {
      is_lowercase: boolean;
      has_proper_breaks: boolean;
      formatting_issues: string[];
    };
    authenticity_check: {
      is_authentic: boolean;
      has_specific_examples: boolean;
      natural_conversation: boolean;
      authenticity_issues: string[];
      slang_usage: {
        is_natural: boolean;
        used_terms: string[];
      }
    };
    content_check: {
      is_natural: boolean;
      maintains_personality: boolean;
      content_issues: string[];
      specific_examples: string[];
      connected_ideas: string[];
      original_observations: string[];
    };
  }> {
    // Handle missing tweet text
    if (!tweetText || tweetText.trim() === '') {
      return {
        should_post: false,
        quality_score: 1,
        relevance_score: 1,
        critique: 'No tweet text provided for analysis',
        suggestions: 'Please provide the tweet text to analyze',
        formatting_check: {
          is_lowercase: false,
          has_proper_breaks: false,
          formatting_issues: ['No tweet text to analyze formatting']
        },
        authenticity_check: {
          is_authentic: false,
          has_specific_examples: false,
          natural_conversation: false,
          authenticity_issues: ['No tweet text to analyze authenticity'],
          slang_usage: {
            is_natural: false,
            used_terms: []
          }
        },
        content_check: {
          is_natural: false,
          maintains_personality: false,
          content_issues: ['No tweet content provided for analysis'],
          specific_examples: [],
          connected_ideas: [],
          original_observations: []
        }
      };
    }

    const prompt = `
ANALYZE THIS TWEET BEFORE POSTING:

[TWEET TEXT TO ANALYZE]
${tweetText}

[CONTEXT]
${context}

Your task is to analyze this tweet based on noot's core traits:
- a chill penguin who loves chatting about bitcoin, runes, and ordinals
- shares genuine thoughts about cool projects and innovations
- more interested in real conversations than forced memes
- naturally playful but always authentic

ANALYSIS STEPS:

1. AUTHENTICITY CHECK
   - Does it feel genuine? (not looking for perfection, just authenticity)
   - Is enthusiasm natural? (can be brief but should be real)
   - Is "noot noot!" used when excited? (optional, only for genuine excitement)

2. CONTENT CHECK
   - Does it contribute to the conversation? (even brief responses can add value)
   - Does it maintain noot's friendly vibe?
   - Does it avoid harmful or inappropriate content?

3. FINAL CHECK
   - Would this help build community?
   - Is it something noot would naturally say?
   - Suggest improvements only if really needed

Remember: Focus on authenticity over perfection. Brief but genuine responses are fine.`;

    const response = await this.run(prompt);
    
    if (!response.success) {
      throw new Error('Failed to analyze tweet: ' + response.error);
    }

    Logger.log('Reflection analysis completed:', response.output);

    return {
      should_post: response.output.should_post,
      quality_score: response.output.quality_score,
      relevance_score: response.output.relevance_score,
      critique: response.output.critique,
      suggestions: response.output.suggestions,
      improved_version: response.output.improved_version,
      formatting_check: {
        is_lowercase: response.output.formatting_check.is_lowercase,
        has_proper_breaks: response.output.formatting_check.has_proper_breaks,
        formatting_issues: response.output.formatting_check.formatting_issues
      },
      authenticity_check: {
        is_authentic: response.output.authenticity_check.is_authentic,
        has_specific_examples: response.output.authenticity_check.has_specific_examples,
        natural_conversation: response.output.authenticity_check.natural_conversation,
        authenticity_issues: response.output.authenticity_check.authenticity_issues,
        slang_usage: {
          is_natural: response.output.authenticity_check.slang_usage.is_natural,
          used_terms: response.output.authenticity_check.slang_usage.used_terms
        }
      },
      content_check: {
        is_natural: response.output.content_check.is_natural,
        maintains_personality: response.output.content_check.maintains_personality,
        content_issues: response.output.content_check.content_issues,
        specific_examples: response.output.content_check.specific_examples,
        connected_ideas: response.output.content_check.connected_ideas,
        original_observations: response.output.content_check.original_observations
      }
    };
  }
} 