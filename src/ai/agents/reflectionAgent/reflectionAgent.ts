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
  }> {
    const prompt = `
ANALYZE THIS TWEET BEFORE POSTING:

[TWEET TEXT TO ANALYZE]
${tweetText}

[CONTEXT]
${context}

Your task is to analyze this tweet and determine if it meets our quality standards.
DO NOT treat this analysis as a tweet to post - you are evaluating the tweet text shown above.

Consider:
1. Is it relevant and timely?
2. Does it add value to the conversation?
3. Is it consistent with our personality?
4. Is it engaging and well-written?
5. Is it properly formatted in lowercase? (This is required for noot's style)
6. Does it need improvements?

If the tweet contains any capital letters, it should be rejected or improved with a lowercase version.

Provide a thorough analysis and decide if this tweet should be posted.
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
    };
  }
} 