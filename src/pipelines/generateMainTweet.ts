import { MainTweetAgent } from "../ai/agents/mainTweetAgent/mainTweetAgent";
import { MediaAgent } from "../ai/agents/mediaAgent/mediaAgent";
import { ReflectionAgent } from "../ai/agents/reflectionAgent/reflectionAgent";
import { AnthropicClient } from "../ai/models/clients/AnthropicClient";
import { sendTweet } from "../twitter/functions/sendTweet";
import { loadMemories } from "./loadMemories";
import { getFormattedRecentHistory } from '../supabase/functions/terminal/terminalHistory';
import { generateImage } from './mediaGeneration/imageGen';
import { generateImageToVideo } from './mediaGeneration/combinedGeneration';
import { Logger } from '../utils/logger';
import { MainTweetResult } from './types';
import { isCooldownActive } from '../supabase/functions/twitter/cooldowns';
import { generateVideo } from './mediaGeneration/videoGen';

// List of banned words that should not appear in tweets
const BANNED_WORDS = [
  'quantum',
  'paradigm', 
  'ecosystem',
  'wagmi',
  'ngmi'
];

// List of technical jargon to avoid
const TECHNICAL_JARGON = [
  'implementation',
  'infrastructure',
  'optimization',
  'framework',
  'architecture',
  'protocol',
  'mechanism',
  'algorithm',
  'consensus',
  'decentralized',
  'distributed',
  'tokenomics',
  'utility',
  'governance',
  'incentivize',
  'leverage',
  'synergy'
];

/**
 * Checks if text contains any banned words or technical jargon
 * @param text - The text to check
 * @returns Object containing whether banned words/jargon were found and which ones
 */
function containsBannedWords(text: string): { hasBannedWords: boolean; foundWords: string[] } {
  const lowerText = text.toLowerCase();
  const foundBannedWords = BANNED_WORDS.filter(word => lowerText.includes(word.toLowerCase()));
  const foundJargon = TECHNICAL_JARGON.filter(word => lowerText.includes(word.toLowerCase()));
  const allFoundWords = [...foundBannedWords, ...foundJargon];
  
  return {
    hasBannedWords: allFoundWords.length > 0,
    foundWords: allFoundWords
  };
}

const TIMELINE_PROMPT = `Based on the recent terminal logs and memories, create a high-quality tweet that meets our standards:

STYLE REQUIREMENTS:
- Always lowercase - no capital letters
- Short, clear sentences
- Use line breaks between distinct thoughts
- Playful but informative tone (noot's personality)
- Never use these banned words: ${BANNED_WORDS.join(', ')}
- Avoid technical jargon like: ${TECHNICAL_JARGON.join(', ')}
- Use simple, everyday language that anyone can understand

CONTENT REQUIREMENTS:
- Must directly reference current market events/developments
- Must add unique value or insight
- Must be grounded in the provided context
- Must be engaging and well-written
- Must be jargon-free and accessible to everyone

SELF-VALIDATION:
Before providing the tweet, validate that it:
1. Is entirely lowercase
2. Uses proper line breaks
3. References specific events
4. Adds value to the conversation
5. Maintains noot's personality
6. Does not contain any banned words or technical jargon
7. Uses simple, clear language that anyone can understand

If any validation fails, revise the tweet before returning it.

Current context:
[TERMINAL LOGS AND MEMORIES BELOW]`;

/**
 * Enhanced pipeline that handles the entire main tweet process including:
 * - Timeline-aware tweet generation with built-in validation
 * - Media generation (if needed)
 * - Tweet posting
 */
export async function generateAndPostMainTweet(
  customPrompt?: string
): Promise<MainTweetResult> {
  Logger.enable();
  try {
    // Check for main tweet cooldown first - before any expensive operations
    const cooldownInfo = await isCooldownActive('main');
    if (cooldownInfo.isActive) {
      Logger.log(`Main tweet cooldown active for ${cooldownInfo.remainingTime} minutes. Skipping tweet generation.`);
      return {
        success: false,
        message: `Cannot post main tweet right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`,
        tweetText: '',
      };
    }

    // Only proceed with expensive operations if cooldown is not active
    // Initialize AI clients and agents
    const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
    const mainTweetAgent = new MainTweetAgent(anthropicClient);
    const mediaAgent = new MediaAgent(anthropicClient);
    const reflectionAgent = new ReflectionAgent(anthropicClient);

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

    // Generate self-validated tweet
    const mainTweetResponse = await mainTweetAgent.run(finalPrompt, runtimeVariables);
    Logger.log('Main tweet response:', JSON.stringify(mainTweetResponse, null, 2));

    if (!mainTweetResponse?.success) {
      throw new Error(mainTweetResponse?.error || 'Failed to generate tweet');
    }

    if (!mainTweetResponse?.output?.main_tweet) {
      throw new Error('No tweet text generated');
    }

    // Tweet text is already formatted and validated by the LLM
    let tweetText = mainTweetResponse.output.main_tweet;
    
    // Check for banned words and jargon
    const bannedWordsCheck = containsBannedWords(tweetText);
    if (bannedWordsCheck.hasBannedWords) {
      throw new Error(`Tweet contains banned words or technical jargon: ${bannedWordsCheck.foundWords.join(', ')}`);
    }

    // Additional reflection check for language simplicity
    const reflectionContext = `
VALIDATION REQUIREMENTS:
- Must use simple, everyday language
- No technical jargon or complex terms
- Should be understandable by anyone
- Must maintain noot's friendly, casual style
- Must avoid these banned words: ${BANNED_WORDS.join(', ')}
- Must avoid technical terms like: ${TECHNICAL_JARGON.join(', ')}

Tweet to validate:
${tweetText}`;

    const reflection = await reflectionAgent.analyzeTweet(tweetText, reflectionContext);
    Logger.log('Tweet reflection:', JSON.stringify(reflection, null, 2));

    if (!reflection.should_post) {
      if (reflection.improved_version) {
        Logger.log('Using improved version suggested by reflection');
        const improvedTweet = reflection.improved_version;
        // Check improved version for banned words too
        const improvedBannedCheck = containsBannedWords(improvedTweet);
        if (improvedBannedCheck.hasBannedWords) {
          throw new Error(`Improved tweet still contains banned words or jargon: ${improvedBannedCheck.foundWords.join(', ')}`);
        }
        tweetText = improvedTweet;
      } else {
        throw new Error(`Tweet rejected by reflection: ${reflection.critique}`);
      }
    }

    const mediaIncluded = mainTweetResponse.output.media_included;

    // Generate media if included
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
        try {
          // Use our video library instead of generating videos
          const videoPath = await generateVideo(generatedMediaPrompt);
          mediaUrls = [videoPath];
          Logger.log("Selected Video from library:", videoPath);
        } catch (error) {
          Logger.log("Failed to select video, falling back to image generation:", error);
          // Fallback to image generation if video selection fails
          const mediaResponse = await generateImage(generatedMediaPrompt);
          mediaUrls = [mediaResponse.url];
          Logger.log(`Fallback: Generated Image URL (using ${mediaResponse.provider}):`, mediaResponse.url);
        }
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
        mediaUrls
      };
    } else {
      return {
        success: false,
        message: 'Failed to post tweet',
        tweetText,
        mediaUrls
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