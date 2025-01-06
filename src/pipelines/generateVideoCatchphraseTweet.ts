import { VIDEO_TWEET_CONFIG } from '../config/videoTweetConfig';
import { generateVideo } from './mediaGeneration/videoGen';
import { sendTweet } from '../twitter/functions/sendTweet';
import { Logger } from '../utils/logger';
import { MainTweetResult } from './types';
import { isCooldownActive } from '../twitter/utils/cooldowns';

/**
 * Generates and posts a video tweet with a short catchphrase
 * @returns Promise<MainTweetResult>
 */
export async function generateAndPostVideoCatchphraseTweet(): Promise<MainTweetResult> {
  Logger.enable();
  try {
    // Check for video tweet cooldown
    const cooldownInfo = await isCooldownActive('media');
    if (cooldownInfo.isActive) {
      Logger.log(`Video tweet cooldown active for ${cooldownInfo.remainingTime} minutes. Skipping tweet generation.`);
      return {
        success: false,
        message: `Cannot post video tweet right now. Cooldown is active for ${cooldownInfo.remainingTime} minutes.`,
        tweetText: '',
      };
    }

    // Select a random catchphrase
    const catchphrase = VIDEO_TWEET_CONFIG.CATCHPHRASES[
      Math.floor(Math.random() * VIDEO_TWEET_CONFIG.CATCHPHRASES.length)
    ];

    // Generate a video that matches the vibe of the catchphrase
    const videoPrompt = `Create a short video that matches the vibe of: ${catchphrase}. The video should be energetic and fun.`;
    const videoPath = await generateVideo(videoPrompt);

    if (!videoPath) {
      throw new Error('Failed to generate video');
    }

    // Post the tweet with the video
    const tweetId = await sendTweet(catchphrase, [videoPath]);

    if (tweetId) {
      return {
        success: true,
        tweetId,
        message: 'Successfully posted video catchphrase tweet',
        tweetText: catchphrase,
        mediaUrls: [videoPath]
      };
    } else {
      return {
        success: false,
        message: 'Failed to post tweet',
        tweetText: catchphrase,
        mediaUrls: [videoPath]
      };
    }

  } catch (error) {
    Logger.log('Error generating and posting video tweet:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      tweetText: 'Tweet generation failed',
    };
  }
} 