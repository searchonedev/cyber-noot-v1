import { ModelAdapter } from './ModelAdapter';
import { Message, Tool } from '../../types/agentSystem';

// Adapter for Grok models - handles conversion between our system's format and Grok's API format
export class GrokAdapter implements ModelAdapter {
  // Grok supports image inputs
  supportsImages = true;

  // Build tool choice for Grok API format
  buildToolChoice(tools: Tool[]): any {
    if (tools.length > 0) {
      return {
        type: 'function',
        name: tools[0].function.name,
      };
    }
    return undefined;
  }

  // Format tools according to Grok's API requirements
  formatTools(tools: Tool[]): any[] {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
    }));
  }

  // Build parameters for Grok API requests
  buildParams(
    messageHistory: Message[],
    formattedTools: any[],
    toolChoice: any,
    systemPrompt: string
  ): any {
    // Filter out system messages
    const nonSystemMessages = messageHistory.filter((msg) => msg.role !== 'system');
    
    // Ensure there's at least one message
    if (nonSystemMessages.length === 0) {
      nonSystemMessages.push({
        role: 'user',
        content: 'AGENT INITIALIZED',
      });
    }

    const params: any = {
      system: systemPrompt,
      messages: nonSystemMessages.map((msg) => {
        const content: any[] = [];

        // Handle image content if present
        if (msg.image) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: msg.image.mime,
              data: msg.image.data.toString('base64')
            }
          });
        }

        // Handle text content
        if (msg.content) {
          content.push({
            type: "text",
            text: msg.content
          });
        }

        // Ensure there's at least empty content
        if (content.length === 0) {
          content.push({
            type: "text",
            text: " "
          });
        }

        return {
          role: msg.role,
          content,
          name: msg.name,
        };
      }),
    };

    // Add tools configuration if present
    if (formattedTools.length > 0) {
      params.tools = formattedTools;
      if (toolChoice) {
        params.tool_choice = toolChoice;
      }
    }

    return params;
  }

  // Process and normalize Grok's response format
  processResponse(response: any): { aiMessage: any; functionCall?: any } {
    // Extract text content from response
    const messageText = response.content?.[0]?.text || '';
    
    // Create normalized message format
    const normalizedMessage = {
      role: 'assistant',
      content: messageText
    };

    // Handle function calls if present
    if (response.content?.[0]?.type === 'function_call') {
      const functionCall = response.content[0];
      return {
        aiMessage: normalizedMessage,
        functionCall: {
          functionName: functionCall.name,
          functionArgs: functionCall.arguments,
        },
      };
    }

    return { aiMessage: normalizedMessage };
  }
} 