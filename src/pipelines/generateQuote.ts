import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { QuoteAgent } from '../ai/agents/quoteAgent/quoteAgent';
import { Logger } from '../utils/logger';
import { OpenAIClient } from '../ai/models/clients/OpenAiClient';
import { AnthropicClient } from '../ai/models/clients/AnthropicClient';
import { quoteTweet } from '../twitter/functions/quoteTweet';
import { loadMemories } from './loadMemories';
import { formatTweet } from '../twitter/utils/formatTweet';

// Type for the quote result
interface QuoteResult {
  success: boolean;
  tweetId?: string;
  message: string;
  quoteText: string;
  mediaUrls?: string[];
}

/**
 * Enhanced pipeline that handles the entire quote process including:
 * - Interface assembly
 * - Quote generation
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
    // Assemble Twitter interface
    const { textContent, imageContents, usernames } = await assembleTwitterInterface(tweetId);
    
    // Generate AI quote
    const quoteText = await generateQuoteTweet(tweetId, prompt, textContent, imageContents, usernames);
    
    // Format the quote text with proper line breaks
    const formattedQuoteText = formatTweet(quoteText);
    
    // Post the quote
    const result = await quoteTweet(tweetId, formattedQuoteText, mediaUrls, textContent);
    
    return {
      success: result.success,
      tweetId: result.tweetId,
      message: result.message,
      quoteText: formattedQuoteText,
      mediaUrls
    };
  } catch (error) {
    Logger.log('Failed to generate and post quote:', error);
    throw error;
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

  // Initialize OpenAI client and quote agent
  const openAIClient = new OpenAIClient("gpt-4o");
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