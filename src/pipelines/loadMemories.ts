import { Logger } from '../utils/logger';
import { AnthropicClient } from '../ai/models/clients/AnthropicClient';
import { MemoryAgent } from '../ai/agents/memoryAgent/memoryAgent';
import { MemoryService, MemoryCategories, StructuredMemoryQuery } from '../memory/memoryService';
import { getShortTermHistory } from '../supabase/functions/terminal/terminalHistory';
import { formatMemoryResults } from '../memory/searchMemories';

// Enable logging for detailed output
Logger.enable();

/**
 * Enhanced memory loading pipeline that uses structured queries for more precise memory retrieval
 * @param context Current context from terminal logs or user interactions
 * @param usernames Optional array of usernames to include in search
 * @returns Formatted memory results
 */
export async function loadMemories(context: string, usernames?: string[]): Promise<string> {
    try {
        // Initialize AI client and memory agent
        const anthropicClient = new AnthropicClient("claude-3-5-sonnet-20241022");
        const memoryAgent = new MemoryAgent(anthropicClient);
        const memoryService = MemoryService.getInstance();

        // Load context into memory agent
        memoryAgent.loadChatHistory([{
            role: 'user',
            content: context + (usernames ? `\nRelevant users: ${usernames.join(', ')}` : '')
        }]);

        // Generate structured memory query
        const agentResponse = await memoryAgent.run();
        
        if (!agentResponse?.success) {
            throw new Error('Failed to generate memory query');
        }

        const query = agentResponse.output.memory_query;
        Logger.log('Generated memory query:', JSON.stringify(query, null, 2));

        // Add user-specific categories if usernames provided
        if (usernames?.length) {
            const userCategories = usernames.map(u => `user_${u}`);
            query.categories = [...query.categories, ...userCategories] as string[];
        }

        // Search memories using structured query
        const memories = await memoryService.searchMemories(query);
        Logger.log(`Found ${memories.length} relevant memories`);

        // Format results by category
        const formattedResults = formatMemoryResults(memories);
        Logger.log('Memory search completed');

        return formattedResults;
    } catch (error) {
        Logger.log('Error in loadMemories:', error);
        return formatMemoryResults([]);
    }
}

// Test function
export async function testMemoryLoading() {
    try {
        Logger.log('Starting memory loading test...');
        
        // Get recent history for test
        const recentHistory = await getShortTermHistory(10);
        const formattedHistory = recentHistory.map(entry => 
            `[${entry.role.toUpperCase()}]: ${entry.content}`
        ).join('\n');
        
        // Test memory loading
        const results = await loadMemories(formattedHistory);
        Logger.log('Test results:', results);
        
        return results;
    } catch (error) {
        Logger.log('Memory loading test failed:', error);
        throw error;
    }
}

// Run test if executed directly
if (require.main === module) {
    testMemoryLoading()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
} 