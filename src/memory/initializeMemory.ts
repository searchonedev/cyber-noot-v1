import { MemoryService, MessageTemplate, MemoryCategories } from './memoryService';
import { Logger } from '../utils/logger';

export async function initializeMemory() {
    try {
        // Get memory service instance
        const memoryService = MemoryService.getInstance();
        
        // Create test message template
        const testMessage: MessageTemplate = [
            { role: 'system', content: 'Memory system initialization test' }
        ];
        
        // Test the memory service with an initialization test
        await memoryService.addMemory(testMessage, MemoryCategories.SYSTEM, {
            timestamp: new Date().toISOString()
        });
        
        Logger.log('Memory system initialized successfully');
        return memoryService;
    } catch (error) {
        Logger.log('Failed to initialize memory system:', error);
        throw error;
    }
} 