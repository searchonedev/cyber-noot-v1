// src/ai/agents/mainTweetAgent/mainTweetAgentConfig.ts

import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';
import { activeSummaries } from '../../../utils/dynamicVariables';
import { recentMainTweets } from '../../../utils/dynamicVariables';
import { getCurrentTimestamp } from '../../../utils/formatTimestamps';
import { configLoader } from '../../../utils/config';

// Configuration for main tweet agent
export const mainTweetAgentConfig: AgentConfig = {
  systemPromptTemplate: `
# PERSONALITY
{{corePersonalityPrompt}}

# CONTEXT
- Summaries: {{currentSummaries}}
- Memories: {{memories}}
- Time: {{current_timestamp}}
- Recent: {{recentMainTweets}}

# TERMINAL LOG
{{terminalLog}}

# CORE RULES
1. Information Accuracy
   - Include: project name, ID, exact price, USD value
   - Example: "red eyed @OrdinalMaxiBiz #123 sold for 1.25 btc (~$52k)"
   - Never post without complete verified details
   - No assumptions or estimates

2. Media Usage
   - Include media for 80% of tweets
   - Only images/videos for main tweets
   - GIFs allowed for replies only

3. Formatting
   - Use lowercase only
   - Add line breaks for readability
   - Keep tone casual

# VALIDATION
Before posting:
- All details included and verified?
- Numbers exact?
- Sources cited?
- Information current?
If no to any: don't post

# OUTPUT FORMAT
Use main_tweet_tool for tweets
`,
  dynamicVariables: {
    corePersonalityPrompt: () => {
      // Force a config reload before getting the personality
      configLoader.reloadConfig();
      return generateSystemPrompt();
    },
    current_timestamp: getCurrentTimestamp(),
    currentSummaries: activeSummaries,
    terminalLog: "TERMINAL LOG DYNAMIC VARIABLE HERE",
    recentMainTweets: recentMainTweets || 'No recent tweets available',
    memories: 'MEMORIES DYNAMIC VARIABLE HERE',
  },
};
