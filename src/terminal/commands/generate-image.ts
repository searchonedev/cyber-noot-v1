import { Command } from '../types/commands';
import { glifTool, GLIF_MODELS } from '../../tools/glifTool';
import { Logger } from '../../utils/logger';

// Build the description string from the configuration
const modelDescriptions = Object.entries(GLIF_MODELS.models)
  .map(([name, model]) => `- ${name} (use "${model.triggerWord}")`)
  .join('\n');

/**
 * @command generate-image
 * @description Generate an image using Glif AI models
 */
export const generateImageCommand: Command = {
  name: 'generate-image',
  description: `Generate an image using Glif AI models. Available styles with trigger words:\n${modelDescriptions}`,
  parameters: [
    {
      name: 'prompt',
      description: 'Description of the image to generate. Include the trigger word for the style you want.',
      required: true,
      type: 'string'
    }
  ],
  handler: async (args) => {
    try {
      // Get all arguments as a single string to preserve spaces
      const fullPrompt = Object.values(args)
        .filter(arg => typeof arg === 'string')
        .join(' ')
        .trim()
        .replace(/^["']|["']$/g, ''); // Remove quotes at start/end only

      if (!fullPrompt) {
        return {
          output: '❌ Error: Please provide a prompt for the image generation'
        };
      }

      Logger.log('info', 'Generating image with Glif', { fullPrompt });
      
      const result = await glifTool.generateImage(fullPrompt);
      
      // Find the model used (for description)
      const model = Object.values(GLIF_MODELS.models).find(m => 
        fullPrompt.toLowerCase().includes(m.triggerWord.toLowerCase()) ||
        m.keywords.some(keyword => fullPrompt.toLowerCase().includes(keyword.toLowerCase()))
      ) || GLIF_MODELS.models.bitcoinPuppets;

      if (!result.image_url?.url) {
        throw new Error('Failed to generate image: No URL returned from API');
      }

      return {
        output: `🎨 Image generated successfully!\nModel: ${model.description}\nTrigger: ${model.triggerWord}\nPrompt: ${fullPrompt}\nURL: ${result.image_url.url}`
      };
    } catch (error) {
      Logger.log('error', 'Failed to generate image', { error, args });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more helpful error messages
      let userMessage = '❌ Error generating image: ';
      if (errorMessage.includes('Glif API Error')) {
        // API-specific error from Glif
        userMessage += errorMessage.replace('Glif API Error:', '').trim();
      } else if (errorMessage.includes('No output field')) {
        userMessage += 'The image generation failed. Please try again with a different prompt or check if the service is available.';
      } else if (errorMessage.includes('Invalid model ID')) {
        userMessage += 'Please use one of the available trigger words in your prompt:\n' + modelDescriptions;
      } else if (errorMessage.includes('GLIF_API_KEY')) {
        userMessage += 'API key configuration error. Please contact support.';
      } else {
        userMessage += errorMessage;
      }
      
      return {
        output: userMessage
      };
    }
  }
}; 