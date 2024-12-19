import { Command } from '../types/commands';
import { testImageGeneration } from '../../commands/generateImage';
import { Logger } from '../../utils/logger';

/**
 * Command to generate images using GLIF (with FAL fallback)
 */
const glifCommand: Command = {
  name: 'glif',
  description: 'Generate an image using GLIF (with FAL fallback)',
  parameters: [
    {
      name: 'prompt',
      description: 'The image description (e.g., "a penguin cartoon comicbook superhero")',
      type: 'string',
      required: false,
      defaultValue: 'a penguin cartoon comicbook superhero'
    }
  ],
  handler: async (args) => {
    try {
      Logger.log("Command received prompt:", args.prompt);
      const result = await testImageGeneration(args.prompt);
      Logger.log("Command received result:", result);
      return {
        output: `Image generated successfully using ${result.provider}!\nImage URL: ${result.url}`
      };
    } catch (error) {
      Logger.log("Command error:", error);
      return {
        output: `Failed to generate image: ${error.message}`
      };
    }
  }
};

export default glifCommand; 