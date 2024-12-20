import { default as Mem0 } from 'mem0ai';
import { Logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { configLoader } from '../utils/config';
import crypto from 'crypto';

// Get the agent name from config
const AGENT_NAME = configLoader.getAgentName();

// Message template type matching original implementation
export type MessageTemplate = Array<{ 
    role: string; 
    content: string 
}>;

// Memory metadata interface
export interface MemoryMetadata {
    category?: string;
    timestamp: string;
    user_id?: string;
    [key: string]: any;
}

// Memory interface
export interface Memory {
    id: string;
    content: MessageTemplate;
    metadata: MemoryMetadata;
    agent_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    infer?: boolean;
    score?: number;
}

// Memory categories matching original implementation
export const MemoryCategories = {
    WORLD_KNOWLEDGE: 'world_knowledge',
    CRYPTO_KNOWLEDGE: 'crypto_ecosystem_knowledge',
    SELF_KNOWLEDGE: `${AGENT_NAME}_self`,
    USER_SPECIFIC: 'user_specific',
    MAIN_TWEETS: 'main_tweets',
    IMAGE_PROMPTS: 'image_prompts',
    SYSTEM: 'system'
} as const;

// Memory categories type
export type MemoryCategory = string;

// Search options interface
export interface SearchOptions {
    user_id?: string;
    metadata?: MemoryMetadata;
    limit?: number;
    infer?: boolean;
}

// Add new types for structured queries
export interface StructuredMemoryQuery {
    primary_keywords: string[];
    context_keywords: string[];
    time_relevance: 'recent' | 'all';
    categories: string[];
}

// Memory service wrapper for local storage
export class MemoryService {
    private onlineMemory: any; // Online mem0 instance
    private static instance: MemoryService;
    private storagePath: string;

    private constructor() {
        // Set up local storage path
        this.storagePath = path.join(process.cwd(), 'data', 'memories');
        
        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
            Logger.log(`Created memory storage directory at: ${this.storagePath}`);
        }

        // Create category subdirectories
        Object.values(MemoryCategories).forEach(category => {
            const categoryPath = path.join(this.storagePath, category);
            if (!fs.existsSync(categoryPath)) {
                fs.mkdirSync(categoryPath, { recursive: true });
                Logger.log(`Created category directory at: ${categoryPath}`);
            }
        });

        // Initialize online mem0 instance if API key exists
        const mem0Key = process.env.MEM0_API_KEY;
        if (mem0Key) {
            this.onlineMemory = new Mem0({
                apiKey: mem0Key
            });
            Logger.log('Online memory service initialized');
        }

        Logger.log(`Memory storage initialized at: ${this.storagePath}`);
    }

    // Singleton pattern
    public static getInstance(): MemoryService {
        if (!MemoryService.instance) {
            MemoryService.instance = new MemoryService();
        }
        return MemoryService.instance;
    }

    // Add memory matching original implementation
    async addMemory(
        msgTemplate: MessageTemplate,
        category: string,
        metadata: Record<string, any> = {},
        infer: boolean = true
    ): Promise<Memory> {
        try {
            const timestamp = new Date().toISOString();
            const memory: Memory = {
                id: crypto.randomUUID(),
                content: msgTemplate,
                metadata: {
                    ...metadata,
                    category,
                    timestamp
                },
                agent_id: AGENT_NAME,
                user_id: category,
                created_at: timestamp,
                updated_at: timestamp,
                infer
            };

            // Ensure category directory exists (for both predefined and dynamic categories)
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
                    await this.onlineMemory.add(msgTemplate, {
                        agent_id: AGENT_NAME,
                        user_id: category,
                        metadata: memory.metadata,
                        infer
                    });
                } catch (error) {
                    Logger.log('Warning: Failed to sync memory to online service:', error);
                }
            }

            Logger.log(`Memory added successfully: ${memory.id} in category: ${category}`);
            return memory;
        } catch (error) {
            Logger.log('Error adding memory:', error);
            throw error;
        }
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
     * Enhanced search function that handles structured queries
     * @param query Structured query parameters
     * @returns Promise<Memory[]>
     */
    async searchMemories(query: StructuredMemoryQuery): Promise<Memory[]> {
        try {
            // Build search parameters based on structured query
            const searchParams = {
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

            // Search online memory if available
            if (this.onlineMemory) {
                try {
                    const results = await this.onlineMemory.search(searchParams);
                    Logger.log(`Found ${results.length} memories matching query`);
                    return results;
                } catch (error) {
                    Logger.log('Warning: Online memory search failed:', error);
                }
            }

            // Fallback to local search
            return this.searchLocalMemories(searchParams);
        } catch (error) {
            Logger.log('Error searching memories:', error);
            throw error;
        }
    }

    /**
     * Local memory search implementation
     * @param searchParams Search parameters
     * @returns Promise<Memory[]>
     */
    private async searchLocalMemories(searchParams: any): Promise<Memory[]> {
        try {
            const results: Memory[] = [];
            const { query, filter, weights } = searchParams;

            // Search through each category directory
            for (const category of filter.categories) {
                const categoryPath = path.join(this.storagePath, category);
                if (!fs.existsSync(categoryPath)) continue;

                const files = fs.readdirSync(categoryPath);
                for (const file of files) {
                    if (!file.endsWith('.json')) continue;

                    const filePath = path.join(categoryPath, file);
                    const memory: Memory = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    // Apply time filter if recent
                    if (filter.timeRange === 'last_24h') {
                        const memoryDate = new Date(memory.created_at);
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (memoryDate < yesterday) continue;
                    }

                    // Calculate relevance score
                    const score = this.calculateRelevanceScore(memory, query, weights);
                    if (score > 0) {
                        results.push({ ...memory, score });
                    }
                }
            }

            // Sort by relevance score and return top results
            return results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
        } catch (error) {
            Logger.log('Error in local memory search:', error);
            throw error;
        }
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

    // Delete memory
    async deleteMemory(id: string): Promise<boolean> {
        try {
            for (const category of Object.values(MemoryCategories)) {
                const filePath = path.join(this.storagePath, category, `${id}.json`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    return true;
                }
            }
            return false;
        } catch (error) {
            Logger.log(`Error deleting memory ${id}:`, error);
            throw error;
        }
    }
} 