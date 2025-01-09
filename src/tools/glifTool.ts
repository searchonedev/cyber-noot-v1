import { Logger } from '../utils/logger';
import axios, { AxiosError } from 'axios';
import { GLIF_CONFIG, determineModel, GlifModel } from '../config/glifConfig';

// Interfaces
export interface MessageContent {
  type: string;
  text?: string;
  image_url?: { url: string };
}

// Re-export the models for use in commands
export { GLIF_CONFIG as GLIF_MODELS };

export class GlifTool {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://simple-api.glif.app';

  constructor() {
    const key = process.env.GLIF_API_KEY;
    if (!key) {
      throw new Error('GLIF_API_KEY environment variable is required');
    }
    this.apiKey = key;
  }

  private formatErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const apiError = error.response?.data?.error;
      const message = error.message;

      if (status === 401) {
        return 'Invalid API key. Please check your GLIF_API_KEY environment variable.';
      }

      if (status === 429) {
        return 'Rate limit exceeded. Please try again later.';
      }

      if (apiError) {
        return `Glif API Error: ${apiError}`;
      }

      if (status) {
        return `API request failed (${status}): ${message}`;
      }

      return `Network error: ${message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred';
  }

  async generateImage(prompt: string, modelId?: string): Promise<MessageContent> {
    try {
      Logger.log('info', 'Starting image generation', { prompt, modelId });

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      // Determine which model to use and prepare the prompt
      const { modelId: determinedModelId, hasTriggerWord, selectedModel } = modelId 
        ? { 
            modelId, 
            hasTriggerWord: false, 
            selectedModel: Object.values(GLIF_CONFIG.models).find(m => m.id === modelId) 
          }
        : determineModel(prompt);

      if (!selectedModel) {
        throw new Error(`Invalid model ID: ${modelId || determinedModelId}`);
      }

      // Add trigger word if not present, avoiding duplication
      let finalPrompt = prompt;
      if (!hasTriggerWord) {
        // Check if any part of the trigger word is already in the prompt
        const triggerParts = selectedModel.triggerWord.toLowerCase().split(' ');
        const promptLower = prompt.toLowerCase();
        
        // Only add the trigger word if none of its parts are in the prompt
        if (!triggerParts.some(part => promptLower.includes(part))) {
          finalPrompt = `${selectedModel.triggerWord}, ${prompt}`;
        } else {
          // If some parts exist but not the full trigger word, replace those parts
          // with the full trigger word at the start
          const cleanedPrompt = promptLower
            .split(' ')
            .filter(word => !triggerParts.includes(word))
            .join(' ');
          finalPrompt = `${selectedModel.triggerWord}, ${cleanedPrompt}`;
        }
      }

      Logger.log('info', 'Using model', { 
        modelId: determinedModelId, 
        hasTriggerWord,
        finalPrompt,
        modelName: selectedModel.description
      });

      const response = await axios.post(
        this.baseUrl,
        {
          id: determinedModelId,
          inputs: [finalPrompt]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      Logger.log('info', 'Raw API response', { 
        status: response.status,
        data: response.data
      });

      // Check for error field first (API always returns 200 OK)
      if (response.data?.error) {
        throw new Error(`Glif API Error: ${response.data.error}`);
      }

      // Validate response structure
      if (!response.data?.output) {
        throw new Error('Invalid response from Glif API: No output field returned');
      }

      // The output field contains the direct URL to the generated image
      const imageUrl = response.data.output;

      Logger.log('info', 'Successfully generated image', { 
        modelId: determinedModelId,
        responseStatus: response.status,
        finalPrompt,
        modelName: selectedModel.description,
        imageUrl
      });

      return {
        type: 'image',
        image_url: { url: imageUrl }
      };

    } catch (error) {
      const errorMessage = this.formatErrorMessage(error);
      Logger.log('error', 'Failed to generate image', { 
        error: errorMessage,
        prompt,
        modelId: modelId || 'default'
      });
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const glifTool = new GlifTool(); 