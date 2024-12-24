import { default as Mem0 } from 'mem0ai';
import { Logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { configLoader } from '../utils/config';
import crypto from 'crypto';
import type { 
    Memory, 
    MemoryEntry, 
    MemoryMetadata, 
    MessageTemplate, 
    OptimizationScores
} from '../types/memory';
import { 
    MemoryCategories as MemoryTypes,
    ConflictStrategy,
    isMemory,
    isMemoryEntry,
    isMessageTemplate,
    memoryToEntry,
    entryToMemory
} from '../types/memory';
import { MemoryOptimizer } from './memoryOptimizer';
import { MemoryPriorityManager } from './memoryPriority';

// Get the agent name from config
const AGENT_NAME = configLoader.getAgentName();

// Re-export memory categories with a different name to avoid conflicts
export const MemoryCategories = MemoryTypes;

// Default category for uncategorized memories
const DEFAULT_CATEGORY = 'uncategorized';

export interface StructuredMemoryQuery {
    primary_keywords: string[];
    context_keywords: string[];
    time_relevance: 'recent' | 'all';
    categories: string[];
}

interface SearchParams {
    query: string;
    filter: {
        categories: string[];
        timeRange: string;
    };
    weights: {
        primary: Array<{ term: string; weight: number }>;
        context: Array<{ term: string; weight: number }>;
    };
}

export class MemoryService {
    private onlineMemory: any; // Online mem0 instance
    private static instance: MemoryService;
    private storagePath: string;
    private optimizer: MemoryOptimizer;
    private priorityManager: MemoryPriorityManager;

    private constructor() {
        // Initialize existing components
        this.storagePath = path.join(process.cwd(), 'data', 'memories');
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }

        // Initialize new memory optimization components
        this.optimizer = new MemoryOptimizer({
            decayRate: 0.1,
            priorityThreshold: 0.5,
            cleanupInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        this.priorityManager = new MemoryPriorityManager(this.optimizer);

        // Schedule periodic cleanup
        this.optimizer.scheduleCleanup(async () => {
            await this.performMemoryCleanup();
        });

        Logger.log('Memory service initialized with optimization components');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MemoryService {
        if (!MemoryService.instance) {
            MemoryService.instance = new MemoryService();
        }
        return MemoryService.instance;
    }

    /**
     * Calculate optimization scores for a memory
     */
    private calculateOptimizationScores(memory: Memory): OptimizationScores {
        const entry = memoryToEntry(memory, {
            decayScore: 0,
            priorityScore: 0
        });

        return {
            decayScore: this.optimizer.calculateDecay(entry),
            priorityScore: this.optimizer.calculatePriorityScore(entry)
        };
    }

    /**
     * Search memories with optimization
     */
    async searchMemories(query: StructuredMemoryQuery): Promise<Memory[]> {
        try {
            // Build search parameters
            const searchParams: SearchParams = {
                query: [...query.primary_keywords, ...query.context_keywords].join(' '),
                filter: {
                    categories: query.categories,
                    timeRange: query.time_relevance === 'recent' ? 'last_24h' : 'all'
                },
                weights: {
                    primary: query.primary_keywords.map(kw => ({ term: kw, weight: 1.5 })),
                    context: query.context_keywords.map(kw => ({ term: kw, weight: 1.0 }))
                }
            };

            // Search memories
            let memories: Memory[] = [];
            
            // Try online search first
            if (this.onlineMemory) {
                try {
                    const onlineResults = await this.onlineMemory.search(searchParams);
                    memories = onlineResults.filter((mem: any): mem is Memory => isMemory(mem));
                    Logger.log(`Found ${memories.length} valid memories in online storage`);
                } catch (error) {
                    Logger.warn('Online memory search failed:', error);
                }
            }

            // Fallback or combine with local search
            const localMemories = await this.searchLocalMemories(searchParams);
            memories = [...memories, ...localMemories.filter(isMemory)];

            // Remove duplicates
            memories = memories.filter((mem, index, self) =>
                index === self.findIndex((m) => m.id === mem.id)
            );

            // Convert to memory entries for optimization and sort by priority
            const entries = this.priorityManager.convertToEntries(memories);
            const sortedEntries = this.priorityManager.sortByPriority(entries);
            
            // Convert back to memories and update metadata
            return Promise.all(sortedEntries.map(async entry => {
                const baseMemory = memories.find(mem => mem.id === entry.id);
                if (!baseMemory) {
                    throw new Error(`Memory not found for entry: ${entry.id}`);
                }

                // Ensure the memory has all required fields
                const memory = entryToMemory(entry, baseMemory);
                
                // Ensure category is set
                if (!memory.metadata.category) {
                    memory.metadata.category = DEFAULT_CATEGORY;
                }

                return memory;
            }));
        } catch (error) {
            Logger.error('Error searching memories:', error);
            throw error;
        }
    }

    /**
     * Add a new memory with optimization
     */
    async addMemory(
        msgTemplate: MessageTemplate,
        category: string = DEFAULT_CATEGORY,
        metadata: Record<string, any> = {},
        infer: boolean = true
    ): Promise<Memory> {
        const timestamp = new Date().toISOString();
        const memory: Memory = {
            id: crypto.randomUUID(),
            content: msgTemplate,
            metadata: {
                ...metadata,
                category,
                timestamp,
                importance: metadata.importance || 0.5
            },
            agent_id: AGENT_NAME,
            user_id: metadata.user_id || 'system',
            created_at: timestamp,
            updated_at: timestamp,
            infer
        };

        // Calculate optimization scores
        const scores = this.calculateOptimizationScores(memory);
        const entry = memoryToEntry(memory, scores);

        // Check for conflicts
        const conflicts = await this.findConflictingMemories(memory);
        if (conflicts.length > 0) {
            const conflictEntries = conflicts.map(mem => {
                const scores = this.calculateOptimizationScores(mem);
                return memoryToEntry(mem, scores);
            });

            const resolvedEntry = this.priorityManager.resolveConflict(
                [...conflictEntries, entry],
                ConflictStrategy.HIGHEST_RELEVANCE
            );
            
            if (resolvedEntry.id !== entry.id) {
                Logger.log('Memory conflict resolved, using existing memory');
                const baseMemory = conflicts.find(mem => mem.id === resolvedEntry.id);
                if (!baseMemory) {
                    throw new Error('Base memory not found for resolved entry');
                }
                return entryToMemory(resolvedEntry, baseMemory);
            }
        }

        // Save memory
        await this.saveMemoryToStorage(memory);
        Logger.log(`Added new memory with ID: ${memory.id}`);
        return memory;
    }

    /**
     * Perform memory cleanup based on optimization rules
     */
    private async performMemoryCleanup(): Promise<void> {
        try {
            const allMemories = await this.getAllMemories();
            const memoryEntries = allMemories.map(mem => this.memoryToEntry(mem));
            
            // Let optimizer process memories autonomously
            const retainedEntries = this.optimizer.processMemoriesForCleanup(memoryEntries);
            const retainedIds = new Set(retainedEntries.map(entry => entry.id));
            
            // Delete memories that don't meet retention criteria
            const toDelete = allMemories.filter(mem => !retainedIds.has(mem.id));

            for (const memory of toDelete) {
                await this.deleteMemory(memory.id);
            }

            Logger.log(`Memory cleanup complete. Removed ${toDelete.length} memories`);
        } catch (error) {
            Logger.error('Error during memory cleanup:', error);
        }
    }

    /**
     * Find potentially conflicting memories
     */
    private async findConflictingMemories(memory: Memory): Promise<Memory[]> {
        const query: StructuredMemoryQuery = {
            primary_keywords: this.extractKeywords(memory.content),
            context_keywords: [],
            time_relevance: 'all',
            categories: [memory.metadata.category]
        };

        const similarMemories = await this.searchMemories(query);
        return similarMemories.filter(mem => 
            this.calculateSimilarity(mem.content, memory.content) > 0.8
        );
    }

    /**
     * Extract keywords from message template
     */
    private extractKeywords(template: MessageTemplate): string[] {
        return template
            .map(msg => msg.content)
            .join(' ')
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 3);
    }

    /**
     * Calculate similarity between two message templates
     */
    private calculateSimilarity(template1: MessageTemplate, template2: MessageTemplate): number {
        const text1 = template1.map(msg => msg.content).join(' ').toLowerCase();
        const text2 = template2.map(msg => msg.content).join(' ').toLowerCase();
        
        const words1 = new Set(text1.split(/\W+/));
        const words2 = new Set(text2.split(/\W+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    // Convenience methods matching original implementation
    async addWorldKnowledge(msgTemplate: MessageTemplate): Promise<Memory> {
        return this.addMemory(msgTemplate, MemoryCategories.WORLD_KNOWLEDGE);
    }

    async addCryptoKnowledge(msgTemplate: MessageTemplate): Promise<Memory> {
        return this.addMemory(msgTemplate, MemoryCategories.CRYPTO_KNOWLEDGE);
    }

    async addSelfKnowledge(msgTemplate: MessageTemplate): Promise<Memory> {
        return this.addMemory(msgTemplate, MemoryCategories.SELF_KNOWLEDGE);
    }

    async addUserSpecificKnowledge(
        msgTemplate: MessageTemplate,
        userId: string
    ): Promise<Memory> {
        return this.addMemory(msgTemplate, `user_${userId}`);
    }

    async addMainTweet(msgTemplate: MessageTemplate): Promise<Memory> {
        return this.addMemory(msgTemplate, MemoryCategories.MAIN_TWEETS, {}, false);
    }

    async addImagePrompt(msgTemplate: MessageTemplate): Promise<Memory> {
        return this.addMemory(msgTemplate, MemoryCategories.IMAGE_PROMPTS);
    }

    /**
     * Search memories in local storage
     */
    private async searchLocalMemories(searchParams: any): Promise<Memory[]> {
        const memories: Memory[] = [];
        const categories = searchParams.filter.categories || Object.values(MemoryCategories);

        for (const category of categories) {
            const categoryPath = path.join(this.storagePath, category);
            if (!fs.existsSync(categoryPath)) {
                continue;
            }

            const files = fs.readdirSync(categoryPath);
            for (const file of files) {
                if (!file.endsWith('.json')) {
                    continue;
                }

                try {
                    const filePath = path.join(categoryPath, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const memory: Memory = JSON.parse(content);

                    // Calculate relevance score
                    const relevanceScore = this.calculateRelevanceScore(
                        memory,
                        searchParams.query,
                        searchParams.weights
                    );

                    // Apply time range filter
                    if (searchParams.filter.timeRange === 'last_24h') {
                        const memoryDate = new Date(memory.created_at);
                        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        if (memoryDate < oneDayAgo) {
                            continue;
                        }
                    }

                    // Add relevance score to memory
                    memory.metadata.relevanceScore = relevanceScore;
                    memories.push(memory);
                } catch (error) {
                    Logger.warn(`Error reading memory file ${file}:`, error);
                }
            }
        }

        return memories;
    }

    /**
     * Calculate relevance score for a memory based on query terms and weights
     * @param memory Memory to score
     * @param query Search query
     * @param weights Term weights
     * @returns number
     */
    private calculateRelevanceScore(memory: Memory, query: string, weights: any): number {
        let score = 0;
        const content = memory.content.map(msg => msg.content).join(' ').toLowerCase();

        // Score primary keywords
        weights.primary.forEach(({ term, weight }: { term: string, weight: number }) => {
            const regex = new RegExp(term.toLowerCase(), 'g');
            const matches = content.match(regex);
            if (matches) {
                score += matches.length * weight;
            }
        });

        // Score context keywords
        weights.context.forEach(({ term, weight }: { term: string, weight: number }) => {
            const regex = new RegExp(term.toLowerCase(), 'g');
            const matches = content.match(regex);
            if (matches) {
                score += matches.length * weight;
            }
        });

        return score;
    }

    // Get all memories in a category
    async getMemoriesByCategory(category: string): Promise<Memory[]> {
        try {
            const categoryPath = path.join(this.storagePath, category);
            if (!fs.existsSync(categoryPath)) return [];

            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
            return files.map(file => {
                const content = fs.readFileSync(path.join(categoryPath, file), 'utf8');
                return JSON.parse(content);
            });
        } catch (error) {
            Logger.log(`Error getting memories for category ${category}:`, error);
            throw error;
        }
    }

    // Get all memories
    async getAllMemories(): Promise<Memory[]> {
        try {
            const allMemories: Memory[] = [];
            for (const category of Object.values(MemoryCategories)) {
                const memories = await this.getMemoriesByCategory(category);
                allMemories.push(...memories);
            }
            return allMemories;
        } catch (error) {
            Logger.log('Error getting all memories:', error);
            throw error;
        }
    }

    // Get memory by ID
    async getMemoryById(id: string): Promise<Memory | null> {
        try {
            for (const category of Object.values(MemoryCategories)) {
                const filePath = path.join(this.storagePath, category, `${id}.json`);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return JSON.parse(content);
                }
            }
            return null;
        } catch (error) {
            Logger.log(`Error getting memory ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete memory
     */
    async deleteMemory(id: string): Promise<boolean> {
        try {
            const memory = await this.getMemoryById(id);
            if (!memory) {
                return false;
            }

            const category = memory.metadata.category || DEFAULT_CATEGORY;

            // Delete from local storage
            const categoryPath = path.join(this.storagePath, category);
            const filePath = path.join(categoryPath, `${id}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Delete from online storage if available
            if (this.onlineMemory) {
                try {
                    await this.onlineMemory.delete(id);
                } catch (error) {
                    Logger.warn('Failed to delete memory from online service:', error);
                }
            }

            Logger.log(`Memory deleted successfully: ${id}`);
            return true;
        } catch (error) {
            Logger.error('Error deleting memory:', error);
            return false;
        }
    }

    /**
     * Save memory to storage
     */
    private async saveMemoryToStorage(memory: Memory): Promise<void> {
        try {
            const category = memory.metadata.category || DEFAULT_CATEGORY;
            
            // Ensure category directory exists
            const categoryPath = path.join(this.storagePath, category);
            if (!fs.existsSync(categoryPath)) {
                fs.mkdirSync(categoryPath, { recursive: true });
                Logger.log(`Created category directory at: ${categoryPath}`);
            }

            // Save to local file system
            const filePath = path.join(categoryPath, `${memory.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));

            // Add to online storage if available
            if (this.onlineMemory) {
                try {
                    await this.onlineMemory.add(memory.content, {
                        agent_id: memory.agent_id,
                        user_id: memory.user_id,
                        metadata: memory.metadata,
                        infer: memory.infer
                    });
                } catch (error) {
                    Logger.warn('Failed to sync memory to online service:', error);
                }
            }

            Logger.log(`Memory saved successfully: ${memory.id} in category: ${category}`);
        } catch (error) {
            Logger.error('Error saving memory:', error);
            throw error;
        }
    }

    /**
     * Convert Memory to MemoryEntry for optimization
     */
    private memoryToEntry(memory: Memory): MemoryEntry {
        const entry = {
            id: memory.id,
            content: memory.content,
            metadata: memory.metadata,
            timestamp: new Date(memory.created_at).getTime(),
            importance: memory.metadata.importance || 0.5,
            relevanceScore: memory.metadata.relevanceScore || 0.5,
            usageCount: memory.metadata.usageCount || 0,
            type: memory.metadata.category,
            decayScore: 0,
            priorityScore: 0
        };

        // Calculate scores using optimizer
        entry.decayScore = this.optimizer.calculateDecay(entry);
        entry.priorityScore = this.optimizer.calculatePriorityScore(entry);

        return entry;
    }
} 