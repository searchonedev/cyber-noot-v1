import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { ReplyAgent } from '../ai/agents/replyAgent/replyAgent';
import { ReflectionAgent } from '../ai/agents/reflectionAgent/reflectionAgent';
import { Logger } from '../utils/logger';
import { AnthropicClient } from '../ai/models/clients/AnthropicClient';
import { replyToTweet } from '../twitter/functions/replyToTweet';
import { loadMemories } from './loadMemories';
import { searchTenorGif } from '../twitter/utils/gifUtils';
import { isCooldownActive } from '../supabase/functions/twitter/cooldowns';

// Type for the reply result
interface ReplyResult {
  success: boolean;
  tweetId?: string;
  message: string;
  replyText: string;
  mediaUrls?: string[];
  reflection?: {
    quality_score: number;
    relevance_score: number;
    critique: string;
  };
}

/**
 * Enhanced pipeline that handles the entire reply process including:
 * - Interface assembly
 * - Reply generation
 * - Quality control through reflection
 * - Media handling (GIFs)
 * - Tweet posting
 * - Result formatting
 */
export async function generateAndPostReply(
  tweetId: string,
  textOrPrompt: string = "What would you reply to this tweet?"
): Promise<ReplyResult> {
  Logger.enable();
  try {
    // Check for reply cooldown first - before any expensive operations
    const cooldownInfo = await isCooldownActive('reply');
    if (cooldownInfo.isActive) {
      Logger.log(`Reply cooldown active for ${cooldownInfo.remainingTime} minutes. Skipping tweet generation.`);
      return {
        success: false,
        message: `Cannot reply right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`,
        replyText: '',
      };
    }

    // Only proceed with expensive operations if cooldown is not active
    // Assemble Twitter interface
    const { textContent, imageContents, usernames } = await assembleTwitterInterface(tweetId);
    
    // If textOrPrompt starts with "!", treat it as a prompt, otherwise use it as direct text
    const isPrompt = textOrPrompt.startsWith("!");
    let replyText: string;
    
    if (isPrompt) {
      // Generate AI reply using prompt
      const replyResponse = await generateTweetReply(tweetId, textOrPrompt.substring(1), textContent, imageContents, usernames);
      replyText = replyResponse.reply_tweet;
    } else {
      // Use direct text input
      replyText = textOrPrompt;
    }

    // Initialize reflection agent
    const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
    const reflectionAgent = new ReflectionAgent(anthropicClient);

    // Reflect on the reply before proceeding
    const reflectionContext = `
Original tweet being replied to:
${textContent}

Reply ${isPrompt ? 'generated in response to prompt' : 'provided directly'}: "${textOrPrompt}"

Images in original tweet: ${imageContents?.length || 0}
Usernames mentioned: ${usernames?.join(', ') || 'none'}`;

    const reflection = await reflectionAgent.analyzeTweet(replyText, reflectionContext);
    Logger.log('Reply reflection:', JSON.stringify(reflection, null, 2));

    // If reflection suggests not to post, try to use improved version or throw error
    if (!reflection.should_post) {
      if (reflection.improved_version) {
        Logger.log('Using improved version suggested by reflection');
        replyText = reflection.improved_version;
      } else {
        throw new Error(`Reply rejected by reflection: ${reflection.critique}`);
      }
    }

    // Handle media (GIF) if specified - only for AI-generated replies
    let mediaUrls: string[] | undefined;
    if (isPrompt) {
      const replyResponse = await generateTweetReply(tweetId, textOrPrompt.substring(1), textContent, imageContents, usernames);
      if (replyResponse.media_type === 'gif' && replyResponse.gif_search_term) {
        const gifUrl = await searchTenorGif(replyResponse.gif_search_term);
        if (gifUrl) {
          mediaUrls = [gifUrl];
        }
      }
    }
    
    // Post the reply
    const result = await replyToTweet(tweetId, replyText, mediaUrls);
    
    return {
      success: result.success,
      tweetId: result.tweetId,
      message: result.message,
      replyText: replyText,
      mediaUrls,
      reflection: {
        quality_score: reflection.quality_score,
        relevance_score: reflection.relevance_score,
        critique: reflection.critique,
      }
    };
  } catch (error) {
    Logger.log('Failed to generate and post reply:', error);
    return {
      success: false,
      message: error instanceof Error ? 
        `Reply generation failed: ${error.message}` : 
        'Unknown error occurred during reply generation',
      replyText: '',
      reflection: {
        quality_score: 0,
        relevance_score: 0,
        critique: error instanceof Error ? error.message : 'Generation failed'
      }
    };
  }
}

// Original function now focused solely on AI generation
async function generateTweetReply(
  tweetId: string,
  prompt: string,
  textContent?: string,
  imageContents?: any[],
  usernames?: string[]
): Promise<{
  reply_tweet: string;
  media_type: 'none' | 'gif' | 'image';
  gif_search_term?: string;
}> {
  Logger.enable();

  // Use preassembled interface data if provided
  if (!textContent || !imageContents) {
    // Assemble Twitter interface if not provided
    const interfaceData = await assembleTwitterInterface(tweetId);
    textContent = interfaceData.textContent;
    imageContents = interfaceData.imageContents;
    usernames = interfaceData.usernames;
  }

  // Load memories with empty array fallback for undefined usernames
  const memories = await loadMemories(textContent, usernames || []);
  Logger.log('Active memories fetched:', memories);

  // Configure agent with runtime variables
  const runtimeVariables = {
    twitterInterface: textContent,
    memories: memories
  };

  // Initialize Anthropic client and reply agent
  const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
  const replyAgent = new ReplyAgent(anthropicClient);

  // Add images to the agent's context if available
  if (imageContents && imageContents.length > 0) {
    replyAgent.addImage(
      imageContents.map(img => ({
        name: img.sender,
        mime: img.media_type,
        data: img.data,
      }))
    );
  }

  // Generate reply using the agent
  const response = await replyAgent.run(`GENERATE A REPLY FOR THE FOLLOWING TWEET:\n\n${textContent}`, runtimeVariables);
  
  return {
    reply_tweet: response.output.reply_tweet,
    media_type: response.output.media_type,
    gif_search_term: response.output.gif_search_term
  };
}