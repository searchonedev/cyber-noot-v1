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
    banned_words_check: {
      has_banned_words: boolean;
      found_banned_words: string[];
      suggestions: string;
    };
    formatting_check: {
      is_lowercase: boolean;
      has_proper_breaks: boolean;
      formatting_issues: string[];
    };
    content_check: {
      is_natural: boolean;
      maintains_personality: boolean;
      content_issues: string[];
    };
  }> {
    // Handle missing tweet text
    if (!tweetText || tweetText.trim() === '') {
      return {
        should_post: false,
        quality_score: 1, // Minimum required score
        relevance_score: 1, // Minimum required score
        critique: 'No tweet text provided for analysis',
        suggestions: 'Please provide the tweet text to analyze',
        banned_words_check: {
          has_banned_words: false,
          found_banned_words: [],
          suggestions: 'No tweet text to check for banned words'
        },
        formatting_check: {
          is_lowercase: false,
          has_proper_breaks: false,
          formatting_issues: ['No tweet text to analyze formatting']
        },
        content_check: {
          is_natural: false,
          maintains_personality: false,
          content_issues: ['No tweet content provided for analysis']
        }
      };
    }

    const prompt = `
ANALYZE THIS TWEET BEFORE POSTING:

[TWEET TEXT TO ANALYZE]
${tweetText}

[CONTEXT]
${context}

Your task is to analyze this tweet and determine if it meets our quality standards.
DO NOT treat this analysis as a tweet to post - you are evaluating the tweet text shown above.

ANALYSIS STEPS:

1. BANNED WORDS CHECK
   - Look for any banned words or phrases (wagmi, slurs, hate speech, etc.)
   - Check for explicit financial advice or price promises
   - Suggest alternatives if banned words are found

2. FORMATTING CHECK
   - Verify all text is lowercase
   - Check line break usage
   - Identify any formatting issues

3. CONTENT QUALITY
   - Assess natural language and conversational tone
   - Verify personality consistency
   - Evaluate engagement potential
   - Check relevance and timeliness

4. FINAL VALIDATION
   - Consider all checks together
   - Decide if tweet should be posted
   - Provide improved version if needed

Remember: Your analysis is internal only - it will not be posted as a tweet.`;

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
      banned_words_check: response.output.banned_words_check,
      formatting_check: response.output.formatting_check,
      content_check: response.output.content_check,
    };
  }
} 