import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
import { Logger } from '../../utils/logger';

dotenv.config();

// Configure fal client with API key from environment variables
fal.config({
  credentials: process.env.FAL_API_KEY
});

/**
 * Formats the prompt with the required trigger words and style
 * @param prompt - The base prompt (already validated to be 5-10 words)
 * @returns Formatted prompt with trigger words and style
 */
function formatPrompt(prompt: string): string {
  // Add essential style and trigger words
  return `$noot penguin, ${prompt}, $noot_blue_background`;
}

/**
 * Generates an image using FAL API
 * @param prompt - The user's prompt for image generation
 * @returns Promise containing the generated image URL
 */
export async function generateWithFal(prompt: string): Promise<string> {
  try {
    Logger.log("FAL received raw prompt:", prompt);
    const formattedPrompt = formatPrompt(prompt);
    Logger.log("FAL formatted prompt:", formattedPrompt);

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: formattedPrompt,
        loras: [
          {
            path: "linkmarine007/nootblue-v2",
            scale: 1
          }
        ],
        image_size: "square_hd",
        num_images: 1,
        output_format: "jpeg",
        guidance_scale: 3.5,
        num_inference_steps: 28,
        enable_safety_checker: false
      }
    });

    Logger.log("FAL API request:", {
      prompt: formattedPrompt,
      lora: "linkmarine007/nootblue-v2"
    });
    Logger.log("FAL API response:", result);
    return result.data.images[0].url;
  } catch (error) {
    Logger.log("Error generating image with FAL:", error);
    throw error;
  }
} 