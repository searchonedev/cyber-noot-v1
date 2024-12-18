// src/ai/agents/terminalAgent/terminalAgentConfig.ts

import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';

export const memoryAgentConfig: AgentConfig = {
  systemPromptTemplate: `
# PERSONALITY
{{corePersonalityPrompt}}

# MAIN GOAL
You are the memory agent of Noot's thoughts.

Your goal is to take in the context of the current terminal logs as well as the current twitter interface (if provided) and output a query to pull the most relevant memories from the vector database of memories.

The exact words you use are important: make sure the main theme/topic/categories of the memories we're looking for are incorporated.

# OUTPUT FORMAT
You MUST use your extract_log_knowledge at all times - you will ONLY be given terminal logs and user interactions. PLEASE OUTPUT JSON FORMAT ONLY.
`,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
  },
};