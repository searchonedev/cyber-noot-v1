import { ModelClient, ModelType } from '../../types/agentSystem';

// Client for interacting with Grok's API
export class GrokClient implements ModelClient {
  private apiKey: string;
  private modelName: string;
  private defaultParams: any;
  modelType: ModelType = 'grok';

  constructor(
    modelName: string,
    params: any = {}
  ) {
    this.apiKey = process.env.GROK_API_KEY!;
    this.modelName = modelName;
    
    // Set default parameters for Grok API
    this.defaultParams = {
      temperature: 0.8,
      max_tokens: 1000,
      ...params,
    };
  }

  // Execute chat completion request to Grok API
  async chatCompletion(params: any): Promise<any> {
    try {
      // Format messages for Grok API
      const messages = params.messages?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Prepare request parameters
      const requestParams = {
        model: this.modelName,
        ...this.defaultParams,
        ...params,
        messages: messages || params.messages,
      };

      // Make API request to Grok
      const response = await fetch('https://api.grok.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
} 