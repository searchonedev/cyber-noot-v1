import { generateImage } from '../pipelines/mediaGeneration/imageGen';
import { Logger } from '../utils/logger';

/**
 * Command to test image generation with GLIF and FAL
 * @param prompt - Optional prompt to use for generation, defaults to "text NOOTNOOT MFERS"
 */
export async function testImageGeneration(prompt: string = "text NOOTNOOT MFERS") {
  try {
    Logger.log("Starting image generation test...");
    Logger.log("Using prompt:", prompt);

    const result = await generateImage(prompt);
    
    Logger.log(`Successfully generated image using ${result.provider}`);
    Logger.log("Image URL:", result.url);
    
    return result;
  } catch (error) {
    Logger.log("Failed to generate image:", error);
    throw error;
  }
} 