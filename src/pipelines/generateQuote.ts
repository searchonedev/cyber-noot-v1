import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { QuoteAgent } from '../ai/agents/quoteAgent/quoteAgent';
import { ReflectionAgent } from '../ai/agents/reflectionAgent/reflectionAgent';
import { Logger } from '../utils/logger';
import { AnthropicClient } from '../ai/models/clients/AnthropicClient';
import { quoteTweet } from '../twitter/functions/quoteTweet';
import { loadMemories } from './loadMemories';
import { isCooldownActive } from '../twitter/utils/cooldowns';

// Type for the quote result
interface QuoteResult {
  success: boolean;
  tweetId?: string;
  message: string;
  quoteText: string;
  mediaUrls?: string[];
  reflection?: {
    quality_score: number;
    relevance_score: number;
    critique: string;
  };
}

/**
 * Enhanced pipeline that handles the entire quote process including:
 * - Interface assembly
 * - Quote generation
 * - Quality control through reflection
 * - Tweet posting
 * - Result formatting
 */
export async function generateAndPostQuoteTweet(
  tweetId: string,
  mediaUrls?: string[],
  prompt = "What would you quote this tweet?"
): Promise<QuoteResult> {
  Logger.enable();
  try {
    // Check for quote tweet cooldown first - before any expensive operations
    const cooldownInfo = await isCooldownActive('quote');
    if (cooldownInfo.isActive) {
      Logger.log(`Quote tweet cooldown active for ${cooldownInfo.remainingTime} minutes. Skipping tweet generation.`);
      return {
        success: false,
        message: `Cannot quote tweet right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`,
        quoteText: '',
      };
    }

    // Only proceed with expensive operations if cooldown is not active
    // Assemble Twitter interface
    const { textContent, imageContents, usernames } = await assembleTwitterInterface(tweetId);
    
    // Generate AI quote
    let quoteText = await generateQuoteTweet(tweetId, prompt, textContent, imageContents, usernames);
    
    // Initialize reflection agent
    const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
    const reflectionAgent = new ReflectionAgent(anthropicClient);

    // Reflect on the quote before proceeding
    const reflectionContext = `
Original tweet being quoted:
${textContent}

Quote generated in response to prompt: "${prompt}"

Images in original tweet: ${imageContents?.length || 0}
Usernames mentioned: ${usernames?.join(', ') || 'none'}`;

    const reflection = await reflectionAgent.analyzeTweet(quoteText, reflectionContext);
    Logger.log('Quote reflection:', JSON.stringify(reflection, null, 2));

    // If reflection suggests not to post, try to use improved version or throw error
    if (!reflection.should_post) {
      if (reflection.improved_version) {
        Logger.log('Using improved version suggested by reflection');
        quoteText = reflection.improved_version;
      } else {
        throw new Error(`Quote rejected by reflection: ${reflection.critique}`);
      }
    }
    
    // Post the quote
    const result = await quoteTweet(tweetId, quoteText, mediaUrls, textContent);
    
    return {
      success: result.success,
      tweetId: result.tweetId,
      message: result.message,
      quoteText: quoteText,
      mediaUrls,
      reflection: {
        quality_score: reflection.quality_score,
        relevance_score: reflection.relevance_score,
        critique: reflection.critique,
      }
    };
  } catch (error) {
    Logger.log('Failed to generate and post quote:', error);
    return {
      success: false,
      message: error instanceof Error ? 
        `Quote generation failed: ${error.message}` : 
        'Unknown error occurred during quote generation',
      quoteText: '',
      reflection: {
        quality_score: 0,
        relevance_score: 0,
        critique: error instanceof Error ? error.message : 'Generation failed'
      }
    };
  }
}

// Original function now focused solely on AI generation
async function generateQuoteTweet(
  tweetId: string,
  prompt: string,
  textContent?: string,
  imageContents?: any[],
  usernames?: string[]
): Promise<string> {
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

  // Initialize Anthropic client and quote agent
  const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
  const quoteAgent = new QuoteAgent(anthropicClient);

  // Add images to the agent's context if available
  if (imageContents && imageContents.length > 0) {
    quoteAgent.addImage(
      imageContents.map(img => ({
        name: img.sender,
        mime: img.media_type,
        data: img.data,
      }))
    );
  }

  // Generate reply using the agent
  const response = await quoteAgent.run(`GENERATE A QUOTE FOR THE FOLLOWING TWEET:\n\n${textContent}`, runtimeVariables);
  
  return response.output.quote_tweet;
}