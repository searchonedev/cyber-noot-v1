// src/ai/index.ts

import { TerminalAgent } from './ai/agents/terminalAgent/terminalAgent';
import { FireworkClient } from './ai/models/clients/FireworkClient';
import { OpenAIClient } from './ai/models/clients/OpenAiClient';
import { AnthropicClient } from './ai/models/clients/AnthropicClient';
import { executeCommand } from './terminal/executeCommand';
import { ensureAuthenticated } from './twitter/twitterClient';
import { ModelType, Message } from './ai/types/agentSystem';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './utils/logger';
import { createTerminalEntry, updateTerminalResponse, updateTerminalStatus } from './supabase/functions/terminal/terminalEntries';
import { 
  storeTerminalMessage, 
  getShortTermHistory, 
  clearShortTermHistory 
} from './supabase/functions/terminal/terminalHistory';
import { extractAndSaveLearnings } from './pipelines/extractLearnings';
import { getCurrentTimestamp } from './utils/formatTimestamps';
import { initializeMemory } from './memory/initializeMemory';
import { getCooldownStatus } from './supabase/functions/twitter/cooldowns';

Logger.enable();

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

export async function startAISystem() {
  try {
    const sessionId = uuidv4();
    
    // Initialize memory system
    Logger.log('Initializing memory system...');
    await initializeMemory();
    Logger.log('Memory system initialized successfully');
    
    await ensureAuthenticated();
    
    // Get model type from environment variable or use default
    const modelType = (process.env.AI_MODEL_TYPE || 'anthropic').toLowerCase() as ModelType;
    Logger.log(`Using ${modelType} model client...`);
    const modelClient = getModelClient(modelType);

    // Set initial active status
    await updateTerminalStatus(true);
    Logger.log('Terminal status set to active');

    while (true) { // Run indefinitely with idle periods
      try {
        let actionCount = 0;
        const MAX_ACTIONS = 30; // Reduced for testing

        // Active period
        while (actionCount < MAX_ACTIONS) {
          // Start a new TerminalAgent instance
          const terminalAgent = new TerminalAgent(modelClient);

          // Load the latest short-term history into the new agent
          try {
            const shortTermHistory = await getShortTermHistory(6);
            if (shortTermHistory.length > 0) {
              Logger.log('Loading existing short-term history...');
              terminalAgent.loadChatHistory(shortTermHistory);
            }
          } catch (error) {
            Logger.log('Error loading short-term history:', error);
          }

          // Before making the tool call, ensure the last message in the chat history 
          // is from the user, not the assistant

          // If the last message is from the assistant, add a user message
          if (terminalAgent.getLastAgentMessage()) {
            terminalAgent.addUserMessage('Please proceed with your next action.');
          }

          // Update cooldown status before running the agent
          const cooldownStatus = await getCooldownStatus();
          terminalAgent.addUserMessage(`Current Cooldown Status:\n${cooldownStatus}`);

          // Run the agent
          const functionResult = await terminalAgent.run();

          if (!functionResult.success) {
            throw new Error(functionResult.error);
          }

          // Create initial terminal entry
          const entryId = await createTerminalEntry(sessionId, {
            internal_thought: functionResult.output.internal_thought,
            plan: functionResult.output.plan,
            terminal_command: functionResult.output.terminal_command
          });

          if (!entryId) {
            throw new Error('Failed to create terminal entry');
          }

          // Execute command
          const commandOutput = await executeCommand(functionResult.output.terminal_command);

          // Update the same entry with the response
          await updateTerminalResponse(entryId, commandOutput.output);

          // Retrieve the last assistant message from the agent's message history
          const lastAssistantMessage = terminalAgent.getLastAgentMessage();

          if (lastAssistantMessage) {
            // Store agent's response in short-term history
            await storeTerminalMessage(lastAssistantMessage, sessionId);
          }

          // Store terminal output in short-term history and update agent's message history
          const terminalOutputMessage: Message = {
            role: 'user',
            content: `TERMINAL OUTPUT ${getCurrentTimestamp()}: ${commandOutput.output}`,
          };
          terminalAgent.addMessage(terminalOutputMessage);
          await storeTerminalMessage(terminalOutputMessage, sessionId);

          await new Promise((resolve) => setTimeout(resolve, 60000));
          actionCount++;
        }

        // Before entering idle mode, initiate the memory process, and wipe the short term history
        try {
          Logger.log('Initiating memory processing...');
          
          // Try to process memories first
          try {
            await extractAndSaveLearnings(sessionId);
            Logger.log('Memory processing complete');
          } catch (error) {
            Logger.log('Error in extractAndSaveLearnings:', error);
            // Continue to clear history even if learning extraction fails
          }
          
          // Then try to clear history
          try {
            await clearShortTermHistory();
            Logger.log('Short-term history cleared');
          } catch (error) {
            Logger.log('Error clearing short term history:', error);
            // If clearing fails, continue to idle mode anyway
          }
        } catch (error) {
          Logger.log('Error during memory processing:', error);
          // Continue to idle mode even if memory processing fails
        }

        // Enter idle mode
        const idleMinutes = getRandomInt(30, 60);
        Logger.log(`Entering idle mode for ${idleMinutes} minutes`);
        await updateTerminalStatus(false);

        // Idle period
        await new Promise((resolve) => setTimeout(resolve, idleMinutes * 60 * 1000));

        // Resume active mode
        Logger.log('Resuming active mode');
        await updateTerminalStatus(true);

      } catch (error) {
        console.error('Error in AI system loop:', error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('Error in AI system:', error);
  }
}

startAISystem();