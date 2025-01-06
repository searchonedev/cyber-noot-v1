import { ReplyAgent } from '../ai/agents/replyAgent/replyAgent';
import { ReflectionAgent } from '../ai/agents/reflectionAgent/reflectionAgent';
import { AnthropicClient } from '../ai/models/clients/AnthropicClient';
import { sendTweet } from '../twitter/functions/sendTweet';
import { replyToTweet } from '../twitter/functions/replyToTweet';
import { loadMemories } from './loadMemories';
import { getFormattedRecentHistory } from '../supabase/functions/terminal/terminalHistory';
import { Logger } from '../utils/logger';
import { ReplyResult } from '../twitter/types/tweetResults';
import { isCooldownActive } from '../twitter/utils/cooldowns';
import { scraper } from '../twitter/twitterClient';
import { analyzeTweetContext } from '../twitter/utils/tweetUtils';
import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { searchTenorGif } from '../twitter/utils/gifUtils';

export async function generateAndPostReply(
  tweetId: string,
  textOrPrompt: string = "What would you reply to this tweet?"
): Promise<ReplyResult> {
  Logger.enable();
  try {
    // First check if the tweet exists and is a valid mention
    const targetTweet = await scraper.getTweet(tweetId);
    if (!targetTweet) {
      return {
        success: false,
        message: 'Failed to fetch target tweet',
        replyText: ''
      };
    }

    // Check if this is a mention or reply to the bot - do this before any expensive operations
    const tweetContext = await analyzeTweetContext(targetTweet);
    if (tweetContext.type !== 'mention' && tweetContext.type !== 'reply_to_bot') {
      Logger.log(`Tweet ${tweetId} is not a valid mention or reply`);
      return {
        success: false,
        message: 'Can only reply to mentions or replies to bot tweets',
        replyText: ''
      };
    }

    // Then check for reply cooldown
    const cooldownInfo = await isCooldownActive('reply');
    if (cooldownInfo.isActive) {
      Logger.log(`Reply cooldown active for ${cooldownInfo.remainingTime} minutes. Skipping tweet generation.`);
      return {
        success: false,
        message: `Cannot reply right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`,
        replyText: ''
      };
    }

    // Only proceed with expensive operations if cooldown is not active
    // Assemble Twitter interface
    const { textContent, imageContents, usernames } = await assembleTwitterInterface(tweetId);
    
    // If textOrPrompt starts with "!", treat it as a prompt, otherwise use it as direct text
    const isPrompt = textOrPrompt.startsWith("!");
    let replyText: string;
    let replyResponse;
    
    if (isPrompt) {
      // Generate AI reply using prompt
      replyResponse = await generateTweetReply(tweetId, textOrPrompt.substring(1), textContent, imageContents, usernames);
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

    // Check if we should post the tweet based on reflection analysis
    if (!reflection.should_post) {
      Logger.log(`Reply needs improvement: ${reflection.critique}`);
      
      // If we have an improved version, use that instead
      if (reflection.improved_version) {
        replyText = reflection.improved_version;
      } else {
        return {
          success: false,
          message: `Reply generation failed: ${reflection.critique}`,
          replyText
        };
      }
    }

    // Only use improved version in extreme cases (very low quality)
    if (reflection.improved_version && reflection.quality_score < 2) {
      Logger.log('Using improved version due to extremely low quality score');
      replyText = reflection.improved_version;
    }

    // Handle media (GIF) if specified
    let mediaUrls: string[] | undefined;
    if (replyResponse && replyResponse.media_type === 'gif') {
      Logger.log('Attempting to find GIF with search term:', replyResponse.gif_search_term || 'nootnootmfers happy');
      
      // Use provided search term or default to a fun one
      let searchTerm = (replyResponse.gif_search_term || 'nootnootmfers happy').toLowerCase();
      if (!searchTerm.startsWith('nootnootmfers')) {
        searchTerm = 'nootnootmfers ' + searchTerm;
        Logger.log('Fixed search term to maintain brand consistency:', searchTerm);
      }
      
      const gifUrl = await searchTenorGif(searchTerm);
      if (gifUrl) {
        Logger.log('Successfully found GIF:', gifUrl);
        mediaUrls = [gifUrl];
      } else {
        Logger.log('No suitable GIF found for search term:', searchTerm);
        // Try a few fallback terms
        const fallbackTerms = [
          'nootnootmfers fun',
          'nootnootmfers excited',
          'nootnootmfers happy'
        ];
        
        for (const term of fallbackTerms) {
          Logger.log('Trying fallback search term:', term);
          const fallbackGifUrl = await searchTenorGif(term);
          if (fallbackGifUrl) {
            Logger.log('Found GIF using fallback term:', term);
            mediaUrls = [fallbackGifUrl];
            break;
          }
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
    textContent = interfaceData.textContent || 'No text content available';
    imageContents = interfaceData.imageContents;
    usernames = interfaceData.usernames;
  }

  // Ensure textContent is not undefined
  if (!textContent) {
    Logger.log('No text content available for tweet:', tweetId);
    textContent = 'No text content available';
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
  const response = await replyAgent.run(`GENERATE A REPLY FOR THE FOLLOWING TWEET:\n\n${textContent}\n\nPROMPT: ${prompt}`, runtimeVariables);
  
  return {
    reply_tweet: response.output.reply_tweet,
    media_type: response.output.media_type,
    gif_search_term: response.output.gif_search_term
  };
}