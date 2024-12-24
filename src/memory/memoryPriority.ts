// Memory Priority Manager Module
// Handles memory prioritization and conflict resolution

import { Logger } from '../utils/logger';
import type { 
    Memory, 
    MemoryEntry, 
    OptimizationScores,
    MemoryMetadata
} from '../types/memory';
import { 
    ConflictStrategy,
    isMemoryEntry,
    memoryToEntry,
    entryToMemory
} from '../types/memory';
import { MemoryOptimizer } from './memoryOptimizer';

export class MemoryPriorityManager {
    private optimizer: MemoryOptimizer;

    constructor(optimizer: MemoryOptimizer) {
        this.optimizer = optimizer;
        Logger.log('Memory priority manager initialized');
    }

    /**
     * Convert Memory array to MemoryEntry array
     */
    public convertToEntries(memories: Memory[]): MemoryEntry[] {
        return memories
            .map(memory => {
                try {
                    const scores: OptimizationScores = {
                        decayScore: this.optimizer.calculateDecay(memoryToEntry(memory, { decayScore: 0, priorityScore: 0 })),
                        priorityScore: this.optimizer.calculatePriorityScore(memoryToEntry(memory, { decayScore: 0, priorityScore: 0 }))
                    };
                    return memoryToEntry(memory, scores);
                } catch (error) {
                    Logger.warn(`Failed to convert memory to entry: ${memory.id}`, error);
                    return null;
                }
            })
            .filter((entry): entry is MemoryEntry => entry !== null);
    }

    /**
     * Resolve conflicts between memory entries
     */
    public resolveConflict(
        entries: MemoryEntry[],
        strategy: ConflictStrategy = ConflictStrategy.HIGHEST_RELEVANCE
    ): MemoryEntry {
        if (entries.length === 0) {
            throw new Error('No memory entries provided for conflict resolution');
        }

        if (entries.length === 1) {
            return entries[0];
        }

        // Validate all entries
        if (!entries.every(isMemoryEntry)) {
            throw new Error('Invalid memory entries provided for conflict resolution');
        }

        switch (strategy) {
            case ConflictStrategy.HIGHEST_RELEVANCE:
                return this.resolveByRelevance(entries);
            
            case ConflictStrategy.MOST_RECENT:
                return this.resolveByRecency(entries);
            
            case ConflictStrategy.MERGE:
                return this.mergeEntries(entries);
            
            default:
                throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
        }
    }

    /**
     * Sort memory entries by priority score
     */
    public sortByPriority(entries: MemoryEntry[]): MemoryEntry[] {
        // Validate all entries
        if (!entries.every(isMemoryEntry)) {
            throw new Error('Invalid memory entries provided for sorting');
        }

        return [...entries].sort((a, b) => {
            const scoreA = a.priorityScore;
            const scoreB = b.priorityScore;
            return scoreB - scoreA; // Sort in descending order
        });
    }

    /**
     * Filter memory entries based on priority threshold
     */
    public filterHighPriority(entries: MemoryEntry[]): MemoryEntry[] {
        // Validate all entries
        if (!entries.every(isMemoryEntry)) {
            throw new Error('Invalid memory entries provided for filtering');
        }

        return entries.filter(entry => 
            entry.priorityScore >= this.optimizer.getPriorityThreshold()
        );
    }

    private resolveByRelevance(entries: MemoryEntry[]): MemoryEntry {
        return this.sortByPriority(entries)[0];
    }

    private resolveByRecency(entries: MemoryEntry[]): MemoryEntry {
        return entries.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
        );
    }

    private mergeEntries(entries: MemoryEntry[]): MemoryEntry {
        // Sort by priority to use highest priority entry as base
        const sorted = this.sortByPriority(entries);
        const base = sorted[0];
        
        // Merge metadata from all entries
        const mergedMetadata: MemoryMetadata = {
            ...entries.reduce((acc, entry) => ({
                ...acc,
                ...entry.metadata
            }), { 
                category: base.type,
                timestamp: new Date().toISOString()
            }),
        };

        // Calculate merged scores
        const mergedScores: OptimizationScores = {
            decayScore: Math.max(...entries.map(e => e.decayScore)),
            priorityScore: Math.max(...entries.map(e => e.priorityScore))
        };

        // Create merged entry
        return {
            ...base,
            metadata: mergedMetadata,
            importance: Math.max(...entries.map(e => e.importance)),
            relevanceScore: Math.max(...entries.map(e => e.relevanceScore)),
            usageCount: entries.reduce((sum, e) => sum + e.usageCount, 0),
            timestamp: Date.now(),
            decayScore: mergedScores.decayScore,
            priorityScore: mergedScores.priorityScore
        };
    }
} 