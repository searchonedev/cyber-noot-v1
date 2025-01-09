import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';
import { Logger } from '../utils/logger';

export interface GlifModel {
  id: string;
  triggerWord: string;
  description: string;
  keywords: string[];
}

export interface GlifConfig {
  models: Record<string, GlifModel>;
}

// Load and parse the YAML configuration
const loadGlifConfig = (): GlifConfig => {
  try {
    const configPath = join(__dirname, 'glif-models.yaml');
    const fileContents = readFileSync(configPath, 'utf8');
    return parse(fileContents) as GlifConfig;
  } catch (error) {
    Logger.log('error', 'Failed to load Glif configuration', { error });
    throw new Error('Failed to load Glif configuration. Please ensure glif-models.yaml exists.');
  }
};

// Load the configuration once at startup
export const GLIF_CONFIG = loadGlifConfig();

// Helper function to determine the best model based on prompt
export function determineModel(prompt: string): { 
  modelId: string; 
  hasTriggerWord: boolean; 
  selectedModel: GlifModel;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check each model's trigger words and keywords
  for (const [_, model] of Object.entries(GLIF_CONFIG.models)) {
    // Check trigger word
    const hasTriggerWord = lowerPrompt.includes(model.triggerWord.toLowerCase());
    
    // Check keywords
    const hasKeyword = model.keywords.some(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );
    
    if (hasTriggerWord || hasKeyword) {
      return {
        modelId: model.id,
        hasTriggerWord,
        selectedModel: model
      };
    }
  }

  // Default to Bitcoin Puppets if no match
  const defaultModel = GLIF_CONFIG.models.bitcoinPuppets;
  return {
    modelId: defaultModel.id,
    hasTriggerWord: lowerPrompt.includes(defaultModel.triggerWord.toLowerCase()),
    selectedModel: defaultModel
  };
} 