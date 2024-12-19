import { MainTweetAgent } from "../ai/agents/mainTweetAgent/mainTweetAgent";
import { MediaAgent } from "../ai/agents/mediaAgent/mediaAgent";
import { OpenAIClient } from "../ai/models/clients/OpenAiClient";
import { AnthropicClient } from "../ai/models/clients/AnthropicClient";
import { sendTweet } from "../twitter/functions/sendTweet";
import { loadMemories } from "./loadMemories";
import { getFormattedRecentHistory } from '../supabase/functions/terminal/terminalHistory';
import { generateImage } from './mediaGeneration/imageGen';
import { generateImageToVideo } from './mediaGeneration/combinedGeneration';
import { Logger } from '../utils/logger';
import { MainTweetResult } from './types';
import { formatTweet } from '../twitter/utils/formatTweet';

const TIMELINE_PROMPT = `Based on the recent terminal logs and memories, create a tweet that:
1. Directly relates to current market events or developments
2. Adds value through insight or perspective
3. Maintains noot's playful personality while being informative
4. Uses natural, conversational language (avoid forced rhymes)
5. References specific events/trends from the timeline

Remember: Every tweet should be grounded in current events, not generic content.

Current context:
[TERMINAL LOGS AND MEMORIES BELOW]`;

/**
 * Enhanced pipeline that handles the entire main tweet process including:
 * - Timeline-aware tweet generation
 * - Media generation (if any)
 * - Tweet posting
 * - Result formatting
 */
export async function generateAndPostMainTweet(
  customPrompt?: string
): Promise<MainTweetResult> {
  Logger.enable();
  try {
    // Initialize AI clients and agents
    const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
    const mainTweetAgent = new MainTweetAgent(anthropicClient);
    const mediaAgent = new MediaAgent(anthropicClient);

    // Load memories and terminal history
    const formattedHistory = await getFormattedRecentHistory();
    const relevantMemories = await loadMemories(`[SHORT TERM TERMINAL LOGS]\n\n${formattedHistory}`);

    // Combine timeline prompt with custom prompt if provided
    const finalPrompt = customPrompt 
      ? `${TIMELINE_PROMPT}\n\nAdditional context: ${customPrompt}`
      : TIMELINE_PROMPT;

    const runtimeVariables = {
      memories: relevantMemories,
      terminalLog: formattedHistory,
    };

    // Generate timeline-aware tweet
    const mainTweetResponse = await mainTweetAgent.run(finalPrompt, runtimeVariables);
    Logger.log('Main tweet response:', JSON.stringify(mainTweetResponse, null, 2));

    if (!mainTweetResponse?.success) {
      throw new Error(mainTweetResponse?.error || 'Failed to generate tweet');
    }

    if (!mainTweetResponse?.output?.main_tweet) {
      throw new Error('No tweet text generated');
    }

    // Format the tweet text with proper line breaks
    const tweetText = formatTweet(mainTweetResponse.output.main_tweet);
    const mediaIncluded = mainTweetResponse.output.media_included;

    // Generate contextually relevant media if included
    let mediaUrls: string[] | undefined;
    if (mediaIncluded) {
      const timelineMediaPrompt = `Create media that complements this timeline-relevant tweet:\n${tweetText}`;
      const mediaResponse = await mediaAgent.run(timelineMediaPrompt, runtimeVariables);
      const contentType = mediaResponse.output.content_type;
      const generatedMediaPrompt = mediaResponse.output.media_prompt;

      if (contentType === 'image') {
        const mediaResponse = await generateImage(generatedMediaPrompt);
        mediaUrls = [mediaResponse.url];
        Logger.log(`Generated Image URL (using ${mediaResponse.provider}):`, mediaResponse.url);
      } else if (contentType === 'video') {
        const mediaUrl = await generateImageToVideo(generatedMediaPrompt);
        mediaUrls = [mediaUrl];
        Logger.log("Generated Video URL:", mediaUrl);
      }
    }

    // Send the tweet
    const tweetId = await sendTweet(tweetText, mediaUrls);

    if (tweetId) {
      return {
        success: true,
        tweetId,
        message: mediaIncluded ? 'Successfully posted timeline-relevant media tweet' : 'Successfully posted timeline-relevant tweet',
        tweetText,
        mediaUrls,
      };
    } else {
      return {
        success: false,
        message: 'Failed to post tweet',
        tweetText,
        mediaUrls,
      };
    }

  } catch (error) {
    Logger.log('Error generating and posting tweet:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      tweetText: 'Tweet generation failed',
    };
  }
}