import { BaseAgent } from '../BaseAgent';
import { ModelClient } from '../../types/agentSystem';
import { researchAgentConfig } from './researchAgentConfig';
import { ResearchTool, researchToolSchema } from './researchTool';
import { Logger } from '../../../utils/logger';
import { scraper } from '../../../twitter/twitterClient';
import { analyzeTweetContext } from '../../../twitter/utils/tweetUtils';
import { analyzeThread } from '../../../utils/threadAnalysis';
import { Tweet } from 'goat-x';

// Extended Tweet interface to include additional properties
interface ExtendedTweet extends Tweet {
  username?: string;
  timeParsed?: Date;
  isReply?: boolean;
  isQuoted?: boolean;
  inReplyToStatusId?: string;
  media?: Array<{ type: string }>;
  stats?: {
    favoriteCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
  };
}

// Helper function to calculate engagement rate
function calculateEngagementRate(tweet: ExtendedTweet): number {
  // Calculate total engagement from available metrics
  const totalEngagement = (tweet.stats?.favoriteCount || 0) + (tweet.stats?.retweetCount || 0);
  // Use a base rate if follower count is not available
  const followerCount = 100; // Default base rate
  return (totalEngagement / followerCount) * 100;
}

// Helper function to determine optimal posting time
function isOptimalTime(hour: number, day: number): boolean {
  // Peak engagement hours (9 AM - 11 PM EST)
  const peakHours = Array.from({ length: 15 }, (_, i) => i + 9);
  // Best days (Tue-Fri)
  const bestDays = [2, 3, 4, 5];
  
  return peakHours.includes(hour) && bestDays.includes(day);
}

// New interface for algorithmic safety checks
interface AlgorithmicSafetyMetrics {
  hashtag_safety: {
    count: number;
    are_related: boolean;
    risk_level: 'low' | 'medium' | 'high';
  };
  engagement_pattern: {
    is_natural: boolean;
    suspicious_patterns: string[];
  };
  content_authenticity: {
    is_original: boolean;
    quality_score: number;
  };
}

interface AnalysisResponse {
  output: {
    areRelated: boolean;
    relationshipStrength: number;
    content_analysis: {
      has_media: boolean;
      media_type: 'none' | 'image' | 'gif' | 'video';
      tweet_length: number;
      has_links: boolean;
      topics: string[];
      sentiment: 'positive' | 'neutral' | 'negative';
      language_style: {
        is_question: boolean;
        is_statement: boolean;
        is_call_to_action: boolean;
        tone: 'casual' | 'technical' | 'humorous' | 'serious';
      };
    };
    performance_patterns: Array<{
      pattern_type: 'success' | 'failure';
      pattern_description: string;
      contributing_factors: string[];
      improvement_suggestions: string[];
    }>;
    success_score: number;
    key_learnings: string[];
    recommendations: Array<{
      category: 'timing' | 'content' | 'engagement' | 'strategy';
      description: string;
      priority: 'high' | 'medium' | 'low';
      expected_impact: string;
    }>;
  };
  success: boolean;
  error?: string;
}

export class ResearchAgent extends BaseAgent<typeof researchToolSchema> {
  constructor(modelClient: ModelClient) {
    super(researchAgentConfig, modelClient, researchToolSchema);
  }

  protected defineTools(): void {
    this.tools = [ResearchTool];
  }

  /**
   * Analyze a tweet's performance and generate insights
   * @param tweetId The ID of the tweet to analyze
   * @param context Additional context about the tweet
   * @returns Analysis results and recommendations
   */
  async analyzeTweetPerformance(tweetId: string, context: string = ''): Promise<{
    success: boolean;
    analysis?: {
      engagement_metrics: {
        likes: number;
        retweets: number;
        replies: number;
        quotes: number;
        total_engagement: number;
        engagement_rate: number;
      };
      temporal_metrics: {
        hour_of_day: number;
        day_of_week: number;
        response_time_minutes?: number;
        is_optimal_time: boolean;
      };
      content_analysis: {
        has_media: boolean;
        media_type: 'none' | 'image' | 'gif' | 'video';
        tweet_length: number;
        has_links: boolean;
        topics: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        language_style: {
          is_question: boolean;
          is_statement: boolean;
          is_call_to_action: boolean;
          tone: 'casual' | 'technical' | 'humorous' | 'serious';
        };
      };
      performance_patterns: Array<{
        pattern_type: 'success' | 'failure';
        pattern_description: string;
        contributing_factors: string[];
        improvement_suggestions: string[];
      }>;
      success_score: number;
      key_learnings: string[];
      recommendations: Array<{
        category: 'timing' | 'content' | 'engagement' | 'strategy';
        description: string;
        priority: 'high' | 'medium' | 'low';
        expected_impact: string;
      }>;
      algorithmic_safety?: AlgorithmicSafetyMetrics;
      optimization_suggestions?: Array<{
        category: 'hashtags' | 'engagement' | 'content';
        issue: string;
        recommendation: string;
        priority: 'high' | 'medium' | 'low';
      }>;
    };
    error?: string;
  }> {
    try {
      Logger.log('Starting tweet performance analysis for:', tweetId);
      
      // Fetch tweet data
      const tweet = await scraper.getTweet(tweetId) as ExtendedTweet;
      if (!tweet) {
        throw new Error('Failed to fetch tweet data');
      }

      // Get tweet context
      const tweetContext = await analyzeTweetContext(tweet);
      Logger.log('Tweet context analysis:', tweetContext);

      // If it's part of a thread, analyze the thread
      let threadAnalysis = null;
      if (tweet.isReply && tweet.username) {
        const thread = await scraper.getTweets(tweet.username, 10);
        const threadTweets = [];
        for await (const t of thread) {
          threadTweets.push(t);
        }
        if (threadTweets.length > 0) {
          threadAnalysis = await analyzeThread(threadTweets);
          Logger.log('Thread analysis:', threadAnalysis);
        }
      }

      // Calculate posting time metrics
      const tweetDate = tweet.timeParsed || new Date();
      const hour = tweetDate.getHours();
      const day = tweetDate.getDay();
      
      // Calculate engagement metrics
      const engagementRate = calculateEngagementRate(tweet);
      const totalEngagement = (tweet.stats?.favoriteCount || 0) + (tweet.stats?.retweetCount || 0);

      // Prepare analysis prompt
      const prompt = `
ANALYZE THIS TWEET'S PERFORMANCE:

[TWEET DATA]
ID: ${tweetId}
Text: ${tweet.text}
Posted At: ${tweetDate.toISOString()}
Media Type: ${tweet.media?.length ? tweet.media[0].type : 'none'}
Is Reply: ${tweet.isReply || false}
Is Quote: ${tweet.isQuoted || false}
Engagement:
- Likes: ${tweet.stats?.favoriteCount || 0}
- Retweets: ${tweet.stats?.retweetCount || 0}
- Total Engagement: ${totalEngagement}
- Engagement Rate: ${engagementRate.toFixed(2)}%

[CONTEXT]
${context}

[TWEET CONTEXT]
${JSON.stringify(tweetContext, null, 2)}

${threadAnalysis ? `[THREAD ANALYSIS]
${JSON.stringify(threadAnalysis, null, 2)}` : ''}

Analyze this tweet's performance and provide detailed insights and recommendations.`;

      // Run analysis
      const response = await this.run(prompt);
      
      if (!response.success) {
        throw new Error('Failed to analyze tweet: ' + response.error);
      }

      Logger.log('Research analysis completed:', response.output);

      // Add algorithmic safety analysis
      const algorithmicSafety = await this.checkAlgorithmicSafety(tweet);
      
      // Generate optimization suggestions based on safety analysis
      const optimizationSuggestions = this.generateOptimizationSuggestions(algorithmicSafety);

      return {
        success: true,
        analysis: {
          engagement_metrics: {
            likes: tweet.stats?.favoriteCount || 0,
            retweets: tweet.stats?.retweetCount || 0,
            replies: tweet.stats?.replyCount || 0,
            quotes: tweet.stats?.quoteCount || 0,
            total_engagement: totalEngagement,
            engagement_rate: engagementRate
          },
          temporal_metrics: {
            hour_of_day: hour,
            day_of_week: day,
            response_time_minutes: tweet.isReply && tweet.inReplyToStatusId ? 
              Math.floor((tweetDate.getTime() - new Date(tweet.inReplyToStatusId).getTime()) / 60000) : 
              undefined,
            is_optimal_time: isOptimalTime(hour, day)
          },
          content_analysis: response.output.content_analysis,
          performance_patterns: response.output.performance_patterns,
          success_score: response.output.success_score,
          key_learnings: response.output.key_learnings,
          recommendations: response.output.recommendations,
          algorithmic_safety: algorithmicSafety,
          optimization_suggestions: optimizationSuggestions
        }
      };

    } catch (error) {
      Logger.log('Error analyzing tweet performance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Analyze multiple tweets to identify patterns and trends
   * @param tweetIds Array of tweet IDs to analyze
   * @returns Aggregated analysis and trends
   */
  async analyzeTweetTrends(tweetIds: string[]): Promise<{
    success: boolean;
    trends?: {
      overall_performance: number;
      top_performing_patterns: string[];
      common_issues: string[];
      improvement_areas: string[];
      recommendations: Array<{
        category: 'timing' | 'content' | 'engagement' | 'strategy';
        description: string;
        priority: 'high' | 'medium' | 'low';
        expected_impact: string;
      }>;
    };
    error?: string;
  }> {
    try {
      Logger.log('Starting trend analysis for tweets:', tweetIds);
      
      // Analyze each tweet
      const analyses = await Promise.all(
        tweetIds.map(id => this.analyzeTweetPerformance(id))
      );

      // Filter successful analyses
      const successfulAnalyses = analyses
        .filter((a): a is { success: true; analysis: NonNullable<typeof a.analysis> } => 
          a.success && !!a.analysis
        );

      if (successfulAnalyses.length === 0) {
        throw new Error('No successful analyses to process');
      }

      // Calculate aggregate metrics
      const overallPerformance = successfulAnalyses.reduce(
        (sum, a) => sum + a.analysis.success_score, 
        0
      ) / successfulAnalyses.length;

      // Extract patterns and recommendations
      const allPatterns = successfulAnalyses.flatMap(
        a => a.analysis.performance_patterns
      );
      const allRecommendations = successfulAnalyses.flatMap(
        a => a.analysis.recommendations
      );

      // Identify top patterns
      const successPatterns = allPatterns
        .filter(p => p.pattern_type === 'success')
        .map(p => p.pattern_description);
      
      // Identify common issues
      const failurePatterns = allPatterns
        .filter(p => p.pattern_type === 'failure')
        .map(p => p.pattern_description);

      // Aggregate recommendations
      const priorityRecommendations = allRecommendations
        .filter(r => r.priority === 'high')
        .map(r => ({
          category: r.category,
          description: r.description,
          priority: r.priority,
          expected_impact: r.expected_impact
        }));

      Logger.log('Trend analysis completed', {
        overallPerformance,
        successPatternsCount: successPatterns.length,
        failurePatternsCount: failurePatterns.length,
        recommendationsCount: priorityRecommendations.length
      });

      return {
        success: true,
        trends: {
          overall_performance: overallPerformance,
          top_performing_patterns: [...new Set(successPatterns)],
          common_issues: [...new Set(failurePatterns)],
          improvement_areas: [
            ...new Set(
              allPatterns
                .filter(p => p.pattern_type === 'failure')
                .flatMap(p => p.improvement_suggestions)
            )
          ],
          recommendations: priorityRecommendations
        }
      };

    } catch (error) {
      Logger.log('Error analyzing tweet trends:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Analyzes relationships between hashtags
   */
  private async analyzeHashtagRelations(hashtags: string[]): Promise<{
    areRelated: boolean;
    relationshipStrength: number;
  }> {
    if (hashtags.length <= 1) {
      return { areRelated: true, relationshipStrength: 1 };
    }

    // Use AI to analyze semantic relationships between hashtags
    const prompt = `
    Analyze the relationship between these hashtags:
    ${hashtags.join(', ')}
    
    Determine if they are naturally related or artificially combined.
    Consider: topic relevance, common usage patterns, semantic connections.
    
    Return JSON in format:
    {
      "areRelated": boolean,
      "relationshipStrength": number between 0-1
    }
    `;

    try {
      const analysis = await this.run(prompt);
      const result = analysis.output as unknown as {
        areRelated: boolean;
        relationshipStrength: number;
      };
      
      return {
        areRelated: result.areRelated,
        relationshipStrength: result.relationshipStrength
      };
    } catch (error) {
      Logger.log('Error analyzing hashtag relations:', error);
      return { areRelated: true, relationshipStrength: 1 };
    }
  }

  /**
   * Extract hashtags from tweet text safely
   */
  private extractHashtags(text: string | undefined): string[] {
    if (!text) return [];
    return text.match(/#\w+/g) || [];
  }

  /**
   * Analyzes engagement patterns for signs of manipulation
   */
  private async analyzeEngagementPattern(tweet: ExtendedTweet): Promise<{
    is_natural: boolean;
    suspicious_patterns: string[];
  }> {
    // Check engagement velocity
    const engagementVelocity = await this.calculateEngagementVelocity(tweet);
    
    // Check engagement distribution
    const engagementDistribution = await this.analyzeEngagementDistribution(tweet);
    
    return {
      is_natural: engagementVelocity.is_natural && engagementDistribution.is_natural,
      suspicious_patterns: [
        ...engagementVelocity.suspicious_patterns,
        ...engagementDistribution.suspicious_patterns
      ]
    };
  }

  /**
   * Assesses content authenticity and quality
   */
  private async assessContentAuthenticity(tweet: ExtendedTweet): Promise<{
    is_original: boolean;
    quality_score: number;
  }> {
    // Analyze content originality
    const originalityCheck = await this.checkOriginality(tweet.text);
    
    // Calculate quality score based on multiple factors
    const qualityScore = await this.calculateQualityScore(tweet);
    
    return {
      is_original: originalityCheck.is_original,
      quality_score: qualityScore
    };
  }

  /**
   * Checks content originality
   */
  private async checkOriginality(text: string | undefined): Promise<{
    is_original: boolean;
    similarity_score?: number;
  }> {
    if (!text) {
      return { is_original: true };
    }

    // For now, return default values since we don't have a content comparison database
    return {
      is_original: true
    };
  }

  /**
   * Calculates overall quality score for a tweet
   */
  private async calculateQualityScore(tweet: ExtendedTweet): Promise<number> {
    // Factors to consider
    const hasMedia = tweet.media && tweet.media.length > 0 ? 0.2 : 0;
    const textLength = Math.min(((tweet.text || '').length / 280) * 0.3, 0.3);
    const hasLinks = (tweet.text || '').includes('http') ? 0.1 : 0;
    
    // Base score from engagement
    const engagementScore = Math.min(calculateEngagementRate(tweet) / 100, 0.4);
    
    return hasMedia + textLength + hasLinks + engagementScore;
  }

  /**
   * Generates optimization suggestions based on safety analysis
   */
  private generateOptimizationSuggestions(safety: AlgorithmicSafetyMetrics): Array<{
    category: 'hashtags' | 'engagement' | 'content';
    issue: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      category: 'hashtags' | 'engagement' | 'content';
      issue: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    // Hashtag recommendations
    if (safety.hashtag_safety.risk_level !== 'low') {
      suggestions.push({
        category: 'hashtags',
        issue: 'Potential hashtag spam detection',
        recommendation: 'Reduce hashtag count and ensure all hashtags are directly related to content',
        priority: safety.hashtag_safety.risk_level
      });
    }

    // Engagement pattern recommendations
    if (!safety.engagement_pattern.is_natural) {
      suggestions.push({
        category: 'engagement',
        issue: 'Suspicious engagement patterns detected',
        recommendation: 'Focus on organic engagement through meaningful interactions',
        priority: 'high'
      });
    }

    // Content quality recommendations
    if (safety.content_authenticity.quality_score < 0.7) {
      suggestions.push({
        category: 'content',
        issue: 'Content quality could be improved',
        recommendation: 'Enhance content originality and value to audience',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Checks tweet for potential algorithmic penalties
   */
  private async checkAlgorithmicSafety(tweet: ExtendedTweet): Promise<AlgorithmicSafetyMetrics> {
    Logger.log('Checking algorithmic safety for tweet:', tweet.id);
    
    // Extract hashtags and analyze their relationships
    const hashtags = this.extractHashtags(tweet.text);
    const hashtagAnalysis = await this.analyzeHashtagRelations(hashtags);
    
    // Check engagement patterns for naturalness
    const engagementPattern = await this.analyzeEngagementPattern(tweet);
    
    // Assess content originality and quality
    const contentAnalysis = await this.assessContentAuthenticity(tweet);
    
    return {
      hashtag_safety: {
        count: hashtags.length,
        are_related: hashtagAnalysis.areRelated,
        risk_level: this.calculateHashtagRisk(hashtags.length, hashtagAnalysis.areRelated)
      },
      engagement_pattern: engagementPattern,
      content_authenticity: contentAnalysis
    };
  }

  /**
   * Calculates risk level based on hashtag count and relatedness
   */
  private calculateHashtagRisk(count: number, areRelated: boolean): 'low' | 'medium' | 'high' {
    if (count <= 2) return 'low';
    if (count <= 4 && areRelated) return 'medium';
    return 'high';
  }

  /**
   * Calculates engagement velocity to detect unnatural patterns
   */
  private async calculateEngagementVelocity(tweet: ExtendedTweet): Promise<{
    is_natural: boolean;
    suspicious_patterns: string[];
  }> {
    const suspicious_patterns = [];
    let is_natural = true;

    // Check if engagement rate is suspiciously high
    const engagementRate = calculateEngagementRate(tweet);
    if (engagementRate > 50) {
      suspicious_patterns.push('Unusually high engagement rate');
      is_natural = false;
    }

    // Check engagement timing distribution
    const timingAnalysis = await this.analyzeEngagementTiming(tweet);
    if (!timingAnalysis.is_natural) {
      suspicious_patterns.push(...timingAnalysis.suspicious_patterns);
      is_natural = false;
    }

    return { is_natural, suspicious_patterns };
  }

  /**
   * Analyzes timing of engagements
   */
  private async analyzeEngagementTiming(tweet: ExtendedTweet): Promise<{
    is_natural: boolean;
    suspicious_patterns: string[];
  }> {
    // For now, return default values since we don't have detailed timing data
    return {
      is_natural: true,
      suspicious_patterns: []
    };
  }

  /**
   * Analyzes distribution of different types of engagement
   */
  private async analyzeEngagementDistribution(tweet: ExtendedTweet): Promise<{
    is_natural: boolean;
    suspicious_patterns: string[];
  }> {
    const suspicious_patterns = [];
    let is_natural = true;

    // Check ratio of likes to retweets
    const likeRetweetRatio = (tweet.stats?.favoriteCount || 0) / (tweet.stats?.retweetCount || 1);
    if (likeRetweetRatio < 0.5 || likeRetweetRatio > 20) {
      suspicious_patterns.push('Unusual like-to-retweet ratio');
      is_natural = false;
    }

    return { is_natural, suspicious_patterns };
  }
} 