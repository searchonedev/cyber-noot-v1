import { MemoryService } from './memory/memoryService';
import { Logger } from './utils/logger';

async function testMemorySystem() {
    try {
        // Initialize memory service
        const memoryService = MemoryService.getInstance();
        Logger.log('Memory service initialized');

        // Test adding a memory
        const testMemory = await memoryService.addMemory(
            [{ role: 'user', content: 'This is a test memory' }],
            'test_category',
            { importance: 0.8 }
        );
        Logger.log('Added test memory:', testMemory);

        // Test searching memories
        const searchResults = await memoryService.searchMemories({
            primary_keywords: ['test'],
            context_keywords: ['memory'],
            time_relevance: 'all',
            categories: ['test_category']
        });
        Logger.log('Search results:', searchResults);

        // Test memory cleanup
        await memoryService['performMemoryCleanup']();
        Logger.log('Memory cleanup completed');

    } catch (error) {
        Logger.error('Error testing memory system:', error);
    }
}

// Run the test
testMemorySystem(); 