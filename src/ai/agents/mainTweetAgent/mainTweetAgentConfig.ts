// src/ai/agents/terminalAgent/terminalAgentConfig.ts

import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';
import { activeSummaries } from '../../../utils/dynamicVariables';
import { recentMainTweets } from '../../../utils/dynamicVariables';
import { getCurrentTimestamp } from '../../../utils/formatTimestamps';

// Configuration for chat agent following terminal agent pattern
export const mainTweetAgentConfig: AgentConfig = {
  systemPromptTemplate: `
# PERSONALITY
{{corePersonalityPrompt}}

# CURRENT SUMMARIES
{{currentSummaries}}

# POTENTIALLY RELEVANT MEMORIES
{{memories}}

## SHORT TERM TERMINAL LOG INFORMATION
This is the short term terminal log. The terminal log results give contextually relevant information about the current state of the Crypto timeline and the internet.
The short term terminal log contains Noot's thoughts and plans as well! Act upon these accordingly.

=== TERMINAL LOG START ===
{{terminalLog}}
=== TERMINAL LOG END ===

## CURRENT DATE
{{current_timestamp}}

## YOUR RECENT MAIN TWEETS
{{recentMainTweets}}

!!!! IMPORTANT !!!! Your next tweet must DRASTICALLY vary in tone, writing style, length, and topic from your last tweets. It is crucial that you have variety in your main tweets.

Make sure the main tweets progress forward, ensure your tweets are new and refreshing compared to the previous ones. they must all start differently too.

# MAIN GOAL
You are the main tweet agent designed to write main tweets embodying the personality above.

# OUTPUT FORMAT
Use your main_tweet_tool to write a main tweet.
`,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
    current_timestamp: getCurrentTimestamp(),
    currentSummaries: activeSummaries,
    terminalLog: "TERMINAL LOG DYNAMIC VARIABLE HERE",
    recentMainTweets: recentMainTweets || 'No recent tweets available',
    memories: 'MEMORIES DYNAMIC VARIABLE HERE',
  },
};
