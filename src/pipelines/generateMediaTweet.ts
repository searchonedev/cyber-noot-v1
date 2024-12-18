import { MainTweetAgent } from "../ai/agents/mainTweetAgent/mainTweetAgent";
import { MediaAgent } from "../ai/agents/mediaAgent/mediaAgent";
import { AnthropicClient } from "../ai/models/clients/AnthropicClient";
import { sendTweet } from "../twitter/functions/sendTweet";
import { loadMemories } from "./loadMemories";
import { getFormattedRecentHistory } from '../supabase/functions/terminal/terminalHistory';
import { generateImage } from './mediaGeneration/imageGen';
import { Logger } from '../utils/logger';
import { MainTweetResult } from './types';
import { formatTweet } from '../twitter/utils/formatTweet';

export async function generateAndPostMediaTweet(): Promise<MainTweetResult> {
  Logger.enable();
  try {
    // Initialize AI clients and agents
    const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
    const mainTweetAgent = new MainTweetAgent(anthropicClient);
    const mediaAgent = new MediaAgent(anthropicClient);

    // Load memories and terminal history
    const formattedHistory = await getFormattedRecentHistory();
    const relevantMemories = await loadMemories(`[SHORT TERM TERMINAL LOGS]\n\n${formattedHistory}`);

    const runtimeVariables = {
      memories: relevantMemories,
      terminalLog: formattedHistory,
    };

    // Generate tweet with suggestion for media
    const mainTweetResponse = await mainTweetAgent.run(
      "Generate a tweet. Consider including visual content if it would enhance the message about bitcoin, runes, or the crypto ecosystem.", 
      runtimeVariables
    );

    if (!mainTweetResponse?.success || !mainTweetResponse?.output?.main_tweet) {
      throw new Error('Failed to generate tweet text');
    }

    // Format the tweet text with proper line breaks
    const tweetText = formatTweet(mainTweetResponse.output.main_tweet);
    const mediaIncluded = mainTweetResponse.output.media_included;

    // Let the agent decide if media should be included
    let mediaUrls: string[] | undefined;
    if (mediaIncluded) {
      const mediaResponse = await mediaAgent.run(`[MAIN TWEET]\n\n${tweetText}`, runtimeVariables);
      const contentType = mediaResponse.output.content_type;
      const mediaPrompt = mediaResponse.output.media_prompt;

      if (contentType === 'image') {
        const mediaUrl = await generateImage(mediaPrompt);
        mediaUrls = [mediaUrl];
        Logger.log("Generated Image URL:", mediaUrl);
      }
    }

    // Send the tweet
    const tweetId = await sendTweet(tweetText, mediaUrls);

    if (tweetId) {
      return {
        success: true,
        tweetId,
        message: mediaIncluded ? 'Successfully posted media tweet' : 'Successfully posted tweet without media',
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
    Logger.error('Error generating and posting tweet:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      tweetText: 'Tweet generation failed',
    };
  }
}
