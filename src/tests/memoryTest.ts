import { Logger } from '../utils/logger';
import { MemoryService, MessageTemplate, MemoryCategories, StructuredMemoryQuery } from '../memory/memoryService';
import dotenv from 'dotenv';

dotenv.config();
Logger.enable();

/**
 * Test suite for Memory Service functionality
 */
export async function testMemoryService() {
  try {
    Logger.log('\n🧪 Starting Memory Service Tests\n');

    // Initialize memory service
    const memoryService = MemoryService.getInstance();

    // Test 1: Add World Knowledge
    Logger.log('Test 1: Adding World Knowledge');
    try {
      const worldKnowledge: MessageTemplate = [
        { role: 'user', content: 'Testing world knowledge memory' }
      ];
      
      const result = await memoryService.addWorldKnowledge(worldKnowledge);
      Logger.log('World knowledge added:', result);
    } catch (error) {
      Logger.log('Error adding world knowledge:', error);
    }

    // Test 2: Add Crypto Knowledge
    Logger.log('\nTest 2: Adding Crypto Knowledge');
    try {
      const cryptoKnowledge: MessageTemplate = [
        { role: 'user', content: 'Testing crypto knowledge memory' }
      ];
      
      const result = await memoryService.addCryptoKnowledge(cryptoKnowledge);
      Logger.log('Crypto knowledge added:', result);
    } catch (error) {
      Logger.log('Error adding crypto knowledge:', error);
    }

    // Test 3: Add User-Specific Knowledge
    Logger.log('\nTest 3: Adding User-Specific Knowledge');
    try {
      const userKnowledge: MessageTemplate = [
        { role: 'user', content: 'Testing user-specific memory' }
      ];
      
      const result = await memoryService.addUserSpecificKnowledge(userKnowledge, 'test_user_123');
      Logger.log('User-specific knowledge added:', result);
    } catch (error) {
      Logger.log('Error adding user-specific knowledge:', error);
    }

    // Test 4: Search Memories
    Logger.log('\nTest 4: Searching Memories');
    try {
      const searchQuery: StructuredMemoryQuery = {
        primary_keywords: ['test'],
        context_keywords: ['memory', 'knowledge'],
        time_relevance: 'all' as const,
        categories: [MemoryCategories.WORLD_KNOWLEDGE]
      };
      const searchResults = await memoryService.searchMemories(searchQuery);
      Logger.log('Search results:', searchResults);
    } catch (error) {
      Logger.log('Error searching memories:', error);
    }

    // Test 5: Get Memories by Category
    Logger.log('\nTest 5: Getting Memories by Category');
    try {
      const memories = await memoryService.getMemoriesByCategory(MemoryCategories.WORLD_KNOWLEDGE);
      Logger.log('Category memories:', memories);
    } catch (error) {
      Logger.log('Error getting category memories:', error);
    }

    // Test 6: Delete Memory
    Logger.log('\nTest 6: Deleting Memory');
    try {
      // Get the first memory to delete
      const memories = await memoryService.getMemoriesByCategory(MemoryCategories.WORLD_KNOWLEDGE);
      if (memories.length > 0) {
        const memoryToDelete = memories[0];
        const result = await memoryService.deleteMemory(memoryToDelete.id);
        Logger.log('Memory deleted:', result);
      } else {
        Logger.log('No memories found to delete');
      }
    } catch (error) {
      Logger.log('Error deleting memory:', error);
    }

    Logger.log('\n✅ Memory service tests completed\n');
  } catch (error) {
    Logger.log('\n❌ Error during memory tests:', error);
  }
}

// Run the tests
testMemoryService().then(() => {
  Logger.log('Test execution completed');
}).catch((error) => {
  Logger.log('Fatal error in test execution:', error);
}); 