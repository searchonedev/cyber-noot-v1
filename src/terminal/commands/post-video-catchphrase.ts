import { Command } from '../types/commands';
import { isCooldownActive } from '../../supabase/functions/twitter/cooldowns';

/**
 * @command post-video-catchphrase
 * @description Posts a short video tweet with a catchy phrase
 */
export const postVideoCatchphrase: Command = {
  name: 'post-video-catchphrase',
  description: 'Posts a short video tweet with a catchy phrase like "stay nooty" or "gm"',
  parameters: [],
  handler: async () => {
    // Lazy import to avoid initialization issues
    const { generateAndPostVideoCatchphraseTweet } = await import('../../pipelines/generateVideoCatchphraseTweet');

    // Check for media cooldown
    const cooldownInfo = await isCooldownActive('media');

    if (cooldownInfo.isActive) {
      return {
        output: '❌ Action: Post Video Catchphrase\n' +
                'Status: Failed\n' +
                `Reason: Video tweet cooldown is active. Please wait ${cooldownInfo.remainingTime} minutes before posting again.`
      };
    }

    try {
      // Generate and post the video tweet
      const result = await generateAndPostVideoCatchphraseTweet();

      return {
        output: `${result.success ? '✅' : '❌'} Action: Post Video Catchphrase\n` +
               `${result.tweetId ? `Tweet ID: ${result.tweetId}\n` : ''}` +
               `Status: ${result.success ? 'Success' : 'Failed'}\n` +
               `Text: ${result.tweetText}\n` +
               `Media: ${result.mediaUrls ? result.mediaUrls.join(', ') : 'None'}\n` +
               `Details: ${result.message}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        output: `❌ Action: Post Video Catchphrase\n` +
               `Status: Error\n` +
               `Details: ${errorMessage}`
      };
    }
  }
}; 