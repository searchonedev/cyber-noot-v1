// Memory Types Module
// Defines types and interfaces for the memory system

/**
 * Configuration options for memory optimization
 */
export interface OptimizationConfig {
    decayRate: number;
    priorityThreshold: number;
    cleanupInterval: number;
    maxMemorySize: number;
}

/**
 * Message template type
 */
export type MessageTemplate = Array<{ 
    role: string; 
    content: string 
}>;

/**
 * Memory metadata interface
 */
export interface MemoryMetadata {
    category: string;
    timestamp: string;
    user_id?: string;
    importance?: number;
    relevanceScore?: number;
    usageCount?: number;
    decayScore?: number;
    priorityScore?: number;
    [key: string]: any;
}

/**
 * Base memory interface with common properties
 */
export interface BaseMemory {
    id: string;
    metadata: MemoryMetadata;
}

/**
 * Memory optimization scores
 */
export interface OptimizationScores {
    decayScore: number;
    priorityScore: number;
}

/**
 * Memory entry interface for optimization system
 */
export interface MemoryEntry extends BaseMemory {
    content: MessageTemplate;
    timestamp: number;
    importance: number;
    relevanceScore: number;
    usageCount: number;
    type: string;
    decayScore: number;
    priorityScore: number;
}

/**
 * Extended memory interface for the memory service
 */
export interface Memory extends BaseMemory {
    content: MessageTemplate;
    agent_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    infer?: boolean;
    score?: number;
}

/**
 * Memory conflict resolution strategies
 */
export enum ConflictStrategy {
    HIGHEST_RELEVANCE = 'highest_relevance',
    MOST_RECENT = 'most_recent',
    MERGE = 'merge'
}

/**
 * Memory categories
 */
export const MemoryCategories = {
    WORLD_KNOWLEDGE: 'world_knowledge',
    CRYPTO_KNOWLEDGE: 'crypto_ecosystem_knowledge',
    SELF_KNOWLEDGE: 'agent_self',
    USER_SPECIFIC: 'user_specific',
    MAIN_TWEETS: 'main_tweets',
    IMAGE_PROMPTS: 'image_prompts',
    SYSTEM: 'system',
    UNCATEGORIZED: 'uncategorized'
} as const;

export type MemoryCategory = typeof MemoryCategories[keyof typeof MemoryCategories];

/**
 * Type guard to check if content is MessageTemplate
 */
export function isMessageTemplate(content: any): content is MessageTemplate {
    return Array.isArray(content) && content.every(msg => 
        typeof msg === 'object' &&
        msg !== null &&
        typeof msg.role === 'string' &&
        typeof msg.content === 'string'
    );
}

/**
 * Type guard to check if object has optimization scores
 */
export function hasOptimizationScores(obj: any): obj is OptimizationScores {
    return typeof obj === 'object' &&
           obj !== null &&
           typeof obj.decayScore === 'number' &&
           typeof obj.priorityScore === 'number';
}

/**
 * Type guard to check if memory is Memory
 */
export function isMemory(obj: any): obj is Memory {
    return typeof obj === 'object' &&
           obj !== null &&
           typeof obj.id === 'string' &&
           isMessageTemplate(obj.content) &&
           typeof obj.agent_id === 'string' &&
           typeof obj.user_id === 'string' &&
           typeof obj.created_at === 'string' &&
           typeof obj.updated_at === 'string' &&
           typeof obj.metadata === 'object' &&
           typeof obj.metadata.timestamp === 'string' &&
           typeof obj.metadata.category === 'string';
}

/**
 * Type guard to check if memory is MemoryEntry
 */
export function isMemoryEntry(obj: any): obj is MemoryEntry {
    return typeof obj === 'object' &&
           obj !== null &&
           typeof obj.id === 'string' &&
           isMessageTemplate(obj.content) &&
           typeof obj.timestamp === 'number' &&
           typeof obj.importance === 'number' &&
           typeof obj.relevanceScore === 'number' &&
           typeof obj.usageCount === 'number' &&
           typeof obj.type === 'string' &&
           typeof obj.metadata === 'object' &&
           typeof obj.metadata.timestamp === 'string' &&
           typeof obj.metadata.category === 'string' &&
           typeof obj.decayScore === 'number' &&
           typeof obj.priorityScore === 'number';
}

/**
 * Convert Memory to MemoryEntry
 */
export function memoryToEntry(memory: Memory, scores: OptimizationScores): MemoryEntry {
    if (!isMemory(memory)) {
        throw new Error('Invalid memory object');
    }
    
    if (!hasOptimizationScores(scores)) {
        throw new Error('Invalid optimization scores');
    }

    return {
        id: memory.id,
        content: memory.content,
        metadata: {
            ...memory.metadata,
            timestamp: memory.metadata.timestamp || memory.created_at,
            category: memory.metadata.category
        },
        timestamp: new Date(memory.created_at).getTime(),
        importance: memory.metadata.importance || 0,
        relevanceScore: memory.metadata.relevanceScore || 0,
        usageCount: memory.metadata.usageCount || 0,
        type: memory.metadata.category,
        decayScore: scores.decayScore,
        priorityScore: scores.priorityScore
    };
}

/**
 * Convert MemoryEntry to Memory
 */
export function entryToMemory(entry: MemoryEntry, baseMemory?: Memory): Memory {
    if (!isMemoryEntry(entry)) {
        throw new Error('Invalid memory entry');
    }

    const timestamp = new Date().toISOString();
    return {
        id: entry.id,
        content: entry.content,
        metadata: {
            ...entry.metadata,
            importance: entry.importance,
            relevanceScore: entry.relevanceScore,
            usageCount: entry.usageCount,
            category: entry.type,
            decayScore: entry.decayScore,
            priorityScore: entry.priorityScore,
            timestamp: entry.metadata.timestamp || timestamp
        },
        agent_id: baseMemory?.agent_id || 'system',
        user_id: baseMemory?.user_id || entry.metadata.user_id || 'system',
        created_at: baseMemory?.created_at || timestamp,
        updated_at: timestamp,
        infer: baseMemory?.infer ?? true
    };
} 