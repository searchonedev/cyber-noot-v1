import { Logger } from '../../utils/logger';
import { generateWithGlif } from './glifGen';
import { generateWithFal } from './falGen';

/**
 * Interface for image generation response
 */
interface ImageGenerationResponse {
  url: string;
  provider: 'glif' | 'fal';
}

/**
 * Main image generation function that tries GLIF first, falls back to FAL
 * @param prompt - The user's prompt for image generation
 * @returns Promise containing the generated image URL and provider info
 */
export async function generateImage(prompt: string): Promise<ImageGenerationResponse> {
  try {
    Logger.log("Main generator received prompt:", prompt);
    
    // Try GLIF first
    try {
      const glifUrl = await generateWithGlif(prompt);
      Logger.log("Successfully generated image with GLIF");
      return { url: glifUrl, provider: 'glif' };
    } catch (glifError) {
      Logger.log("GLIF generation failed, falling back to FAL:", glifError);
      
      // Fallback to FAL
      const falUrl = await generateWithFal(prompt);
      Logger.log("Successfully generated image with FAL fallback");
      return { url: falUrl, provider: 'fal' };
    }
  } catch (error) {
    Logger.log("All image generation failed:", error);
    throw error;
  }
}