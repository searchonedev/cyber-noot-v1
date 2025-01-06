// src/index.ts

import { TerminalAgent } from './ai/agents/terminalAgent/terminalAgent';
import { FireworkClient } from './ai/models/clients/FireworkClient';
import { OpenAIClient } from './ai/models/clients/OpenAiClient';
import { AnthropicClient } from './ai/models/clients/AnthropicClient';
import { executeCommand } from './terminal/executeCommand';
import { ensureAuthenticated } from './twitter/twitterClient';
import { ModelType, Message } from './ai/types/agentSystem';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Logger, LogLevel } from './utils/logger';
import { createTerminalEntry, updateTerminalResponse, updateTerminalStatus } from './supabase/functions/terminal/terminalEntries';
import { 
  storeTerminalMessage, 
  getShortTermHistory, 
  clearShortTermHistory 
} from './supabase/functions/terminal/terminalHistory';
import { extractAndSaveLearnings } from './pipelines/extractLearnings';
import { getCurrentTimestamp } from './utils/formatTimestamps';
import { initializeMemory } from './memory/initializeMemory';
import { getCooldownStatus } from './twitter/utils/cooldowns';

// Set log level to INFO by default
Logger.setLogLevel(LogLevel.INFO);

dotenv.config();

/**
 * Returns a random number between min and max (inclusive)
 */
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get model client based on configuration
function getModelClient(modelType: ModelType) {
  switch(modelType.toLowerCase()) {
    case 'openai':
      return new OpenAIClient('gpt-4o', { temperature: 1 });
    case 'firework':
      return new FireworkClient("accounts/fireworks/models/llama-v3p3-70b-instruct", { temperature: 1 });
    case 'anthropic':
      return new AnthropicClient("claude-3-5-haiku-20241022", { temperature: 1 });
    default:
      Logger.log(`Invalid model type ${modelType}, falling back to Anthropic`);
      return new AnthropicClient("claude-3-5-haiku-20241022", { temperature: 1 });
  }
}

// Simplified reflection tool schema
const REFLECTION_TOOL = {
  name: "reflect_on_tweet",
  description: "Analyze tweet quality and authenticity",
  input_schema: {
    type: "object",
    required: ["analysis", "scores", "should_post"],
    properties: {
      analysis: {
        type: "string",
        description: "Brief analysis of tweet quality"
      },
      scores: {
        type: "object",
        properties: {
          quality: { type: "number" },
          relevance: { type: "number" }
        }
      },
      should_post: {
        type: "boolean",
        description: "Whether the tweet should be posted"
      }
    }
  }
};

export async function startAISystem() {
  try {
    const sessionId = uuidv4();
    
    await initializeMemory();
    await ensureAuthenticated();
    
    const modelType = (process.env.AI_MODEL_TYPE || 'anthropic').toLowerCase() as ModelType;
    const modelClient = getModelClient(modelType);
    await updateTerminalStatus(true);

    while (true) {
      try {
        let actionCount = 0;
        const MAX_ACTIONS = 30;

        while (actionCount < MAX_ACTIONS) {
          const terminalAgent = new TerminalAgent(modelClient);

          // Load minimal context - only last 3 messages
          const shortTermHistory = await getShortTermHistory(3);
          if (shortTermHistory.length > 0) {
            terminalAgent.loadChatHistory(shortTermHistory);
          }

          // Only add cooldown status if needed for next action
          const lastMessage = terminalAgent.getLastAgentMessage();
          if (!lastMessage || lastMessage.content?.includes('tweet') || lastMessage.content?.includes('post')) {
            const cooldownStatus = await getCooldownStatus();
            terminalAgent.addUserMessage(cooldownStatus);
          } else {
            terminalAgent.addUserMessage('continue');
          }

          const functionResult = await terminalAgent.run();
          if (!functionResult.success) {
            throw new Error(functionResult.error);
          }

          const entryId = await createTerminalEntry(sessionId, {
            internal_thought: functionResult.output.internal_thought,
            plan: functionResult.output.plan,
            terminal_command: functionResult.output.terminal_command
          });

          if (!entryId) {
            throw new Error('Failed to create terminal entry');
          }

          const commandOutput = await executeCommand(functionResult.output.terminal_command);
          await updateTerminalResponse(entryId, commandOutput.output);

          // Store only essential messages
          const lastAssistantMessage = terminalAgent.getLastAgentMessage();
          if (lastAssistantMessage) {
            await storeTerminalMessage(lastAssistantMessage, sessionId);
          }

          const terminalOutputMessage: Message = {
            role: 'user',
            content: `OUTPUT ${getCurrentTimestamp()}: ${commandOutput.output}`,
          };
          await storeTerminalMessage(terminalOutputMessage, sessionId);

          await new Promise(resolve => setTimeout(resolve, 60000));
          actionCount++;
        }

        // Memory processing and cleanup
        try {
          await extractAndSaveLearnings(sessionId);
          await clearShortTermHistory();
        } catch (error) {
          Logger.log('Error in memory processing:', error);
        }

        // Idle period
        const idleMinutes = getRandomInt(30, 60);
        await updateTerminalStatus(false);
        await new Promise(resolve => setTimeout(resolve, idleMinutes * 60 * 1000));
        await updateTerminalStatus(true);

      } catch (error) {
        console.error('Error in AI system loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('Error in AI system:', error);
  }
}

startAISystem();