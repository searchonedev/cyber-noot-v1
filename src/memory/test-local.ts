import { MemoryService, MemoryCategories, MessageTemplate, StructuredMemoryQuery } from './memoryService';
import { Logger } from '../utils/logger';

Logger.enable();

/**
 * Test function for local memory operations
 */
export async function testLocalMemory() {
    try {
        Logger.log('\n🧪 Starting local memory tests...\n');
        
        const memoryService = MemoryService.getInstance();
        Logger.log('Memory service initialized');

        // Test message templates
        const worldKnowledgeMsg: MessageTemplate = [
            { role: 'user', content: 'Bitcoin is a decentralized digital currency.' }
        ];
        
        const cryptoKnowledgeMsg: MessageTemplate = [
            { role: 'user', content: 'Ordinals enable inscriptions on Bitcoin.' }
        ];

        // Test adding memories
        Logger.log('\n🧪 Testing memory addition...');
        const worldMemory = await memoryService.addWorldKnowledge(worldKnowledgeMsg);
        Logger.log('Added world knowledge memory:', worldMemory);

        const cryptoMemory = await memoryService.addCryptoKnowledge(cryptoKnowledgeMsg);
        Logger.log('Added crypto knowledge memory:', cryptoMemory);

        // Test searching memories
        Logger.log('\n🧪 Testing memory search...');
        const bitcoinQuery: StructuredMemoryQuery = {
            primary_keywords: ['bitcoin'],
            context_keywords: ['cryptocurrency', 'blockchain'],
            time_relevance: 'all' as const,
            categories: [MemoryCategories.WORLD_KNOWLEDGE, MemoryCategories.CRYPTO_KNOWLEDGE]
        };
        const bitcoinResults = await memoryService.searchMemories(bitcoinQuery);
        Logger.log('Search results for "bitcoin":', bitcoinResults);

        // Test getting memories by category
        Logger.log('\n🧪 Testing category retrieval...');
        const worldMemories = await memoryService.getMemoriesByCategory(MemoryCategories.WORLD_KNOWLEDGE);
        Logger.log('World knowledge memories:', worldMemories);

        // Test getting memory by ID
        Logger.log('\n🧪 Testing memory retrieval by ID...');
        const retrievedMemory = await memoryService.getMemoryById(worldMemory.id);
        Logger.log('Retrieved memory:', retrievedMemory);

        // Test getting all memories
        Logger.log('\n🧪 Testing all memories retrieval...');
        const allMemories = await memoryService.getAllMemories();
        Logger.log('All memories:', allMemories);

        // Test deleting memory
        Logger.log('\n🧪 Testing memory deletion...');
        const deleted = await memoryService.deleteMemory(cryptoMemory.id);
        Logger.log('Memory deleted:', deleted);

        // Verify deletion
        Logger.log('\n🧪 Verifying deletion...');
        const remainingMemories = await memoryService.getAllMemories();
        Logger.log('Remaining memories:', remainingMemories);

        // Test user-specific knowledge
        Logger.log('\n🧪 Testing user-specific knowledge...');
        const userMsg: MessageTemplate = [
            { role: 'user', content: 'User prefers technical analysis.' }
        ];
        const userMemory = await memoryService.addUserSpecificKnowledge(userMsg, 'test_user_123');
        Logger.log('Added user-specific memory:', userMemory);

        // Test main tweet
        Logger.log('\n🧪 Testing main tweet memory...');
        const tweetMsg: MessageTemplate = [
            { role: 'assistant', content: 'Just published a new tweet about Bitcoin!' }
        ];
        const tweetMemory = await memoryService.addMainTweet(tweetMsg);
        Logger.log('Added main tweet memory:', tweetMemory);

        // Test image prompt
        Logger.log('\n🧪 Testing image prompt memory...');
        const imageMsg: MessageTemplate = [
            { role: 'assistant', content: 'Generate an image of a Bitcoin logo.' }
        ];
        const imageMemory = await memoryService.addImagePrompt(imageMsg);
        Logger.log('Added image prompt memory:', imageMemory);

        Logger.log('\n✅ All tests completed successfully');
    } catch (error) {
        Logger.log('\n❌ Error during local memory tests:', error);
    }
}

// Run the tests
testLocalMemory(); 