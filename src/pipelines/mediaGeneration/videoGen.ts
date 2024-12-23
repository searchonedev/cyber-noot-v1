import { Logger } from '../../utils/logger';
import { getRandomVideo, getContextMatchingVideo } from './videoFileManager';

/**
 * Handles video content generation/selection for tweets
 * @param prompt The context/prompt for the video content
 * @returns URL or path to the video
 */
export async function generateVideo(prompt: string): Promise<string> {
  try {
    Logger.log('Generating/selecting video for prompt:', prompt);

    // Try to get a context-matching video first
    try {
      const videoPath = await getContextMatchingVideo(prompt);
      Logger.log('Selected video from library:', videoPath);
      return videoPath;
    } catch (error) {
      Logger.log('Failed to get context-matching video, falling back to random selection:', error);
      // Fall back to random video selection
      const randomVideoPath = await getRandomVideo();
      Logger.log('Selected random video from library:', randomVideoPath);
      return randomVideoPath;
    }
  } catch (error) {
    Logger.log('Error in video generation:', error);
    throw new Error('Failed to generate/select video content');
  }
}