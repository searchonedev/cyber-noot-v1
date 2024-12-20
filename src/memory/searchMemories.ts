import { MemoryService, MemoryCategories, Memory, StructuredMemoryQuery } from './memoryService';
import { Logger } from '../utils/logger';

/**
 * Search for memories in a specific category
 * @param category The category to search in
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchMemories(category: string, query: string): Promise<Memory[]> {
    try {
        const memoryService = MemoryService.getInstance();
        
        // Convert string query to structured format
        const structuredQuery: StructuredMemoryQuery = {
            primary_keywords: [query],
            context_keywords: [],
            time_relevance: 'all',
            categories: [category]
        };

        const response = await memoryService.searchMemories(structuredQuery);

        // Format results for logging
        const formattedResults = JSON.stringify(response, null, 2);
        Logger.log(`Search Results for "${query}" in category "${category}":\n${formattedResults}`);

        return response;
    } catch (error) {
        Logger.log(`Error searching memories for query "${query}":`, error);
        throw error;
    }
}

/**
 * Search for world knowledge in memory
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchWorldKnowledge(query: string) {
    return searchMemories(MemoryCategories.WORLD_KNOWLEDGE, query);
}

/**
 * Search for crypto ecosystem knowledge in memory
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchCryptoKnowledge(query: string) {
    return searchMemories(MemoryCategories.CRYPTO_KNOWLEDGE, query);
}

/**
 * Search for self knowledge in memory
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchSelfKnowledge(query: string) {
    return searchMemories(MemoryCategories.SELF_KNOWLEDGE, query);
}

/**
 * Search for user-specific knowledge in memory
 * @param query The search query
 * @param userId The user ID to search memories for
 * @returns Promise with search results
 */
export async function searchUserSpecificKnowledge(query: string, userId: string) {
    try {
        const memoryService = MemoryService.getInstance();
        const category = `user_${userId}`;
        
        // Convert string query to structured format
        const structuredQuery: StructuredMemoryQuery = {
            primary_keywords: [query],
            context_keywords: [],
            time_relevance: 'all',
            categories: [category]
        };

        const response = await memoryService.searchMemories(structuredQuery);

        // Format results for logging
        const formattedResults = JSON.stringify(response, null, 2);
        Logger.log(`Search Results for "${query}" in user-specific category "${category}":\n${formattedResults}`);

        return response;
    } catch (error) {
        Logger.log(`Error searching user-specific memories for query "${query}":`, error);
        throw error;
    }
}

/**
 * Search for main tweets in memory
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchMainTweet(query: string) {
    return searchMemories(MemoryCategories.MAIN_TWEETS, query);
}

/**
 * Search for image prompts in memory
 * @param query The search query
 * @returns Promise with search results
 */
export async function searchImagePrompt(query: string) {
    return searchMemories(MemoryCategories.IMAGE_PROMPTS, query);
}

/**
 * Format memory results into a readable string with markdown headers
 * @param memories Array of memory results to format
 * @param category Optional category header to add
 * @returns Formatted string with memory results
 */
export function formatMemoryResults(memories: Memory[], category?: string): string {
    if (!memories || memories.length === 0) {
        return '';
    }

    let formatted = category ? `\n## ${category}\n` : '\n';
    
    memories.forEach(memory => {
        if (Array.isArray(memory.content)) {
            memory.content.forEach((msg: { role: string; content: string }) => {
                if (msg && typeof msg.content === 'string') {
                    formatted += `- ${msg.content}\n`;
                }
            });
        }
    });

    return formatted;
}
