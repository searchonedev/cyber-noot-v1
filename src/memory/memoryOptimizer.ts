// Memory Optimizer Module
// Handles memory optimization, decay calculations, and priority scoring with autonomous adjustment

import { Logger } from '../utils/logger';
import type { 
    Memory, 
    MemoryEntry, 
    OptimizationConfig, 
    OptimizationScores
} from '../types/memory';
import { isMemoryEntry } from '../types/memory';

// Default configuration values for memory optimization
const DEFAULT_CONFIG: OptimizationConfig = {
    decayRate: 0.1,
    priorityThreshold: 0.5,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxMemorySize: 1000000 // Maximum number of entries
};

export class MemoryOptimizer {
    private config: OptimizationConfig;
    private lastCleanup: Date;
    private memoryStats: {
        totalMemories: number;
        avgImportance: number;
        avgUsage: number;
        lastAdjustment: Date;
    };

    constructor(config: Partial<OptimizationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.lastCleanup = new Date();
        this.memoryStats = {
            totalMemories: 0,
            avgImportance: 0.5,
            avgUsage: 0,
            lastAdjustment: new Date()
        };
        Logger.log('Memory optimizer initialized with config:', this.config);
    }

    /**
     * Autonomously adjust optimization parameters based on system metrics
     */
    private adjustParameters(memories: MemoryEntry[]): void {
        const now = new Date();
        const hoursSinceLastAdjustment = 
            (now.getTime() - this.memoryStats.lastAdjustment.getTime()) / (1000 * 60 * 60);
        
        // Only adjust every 6 hours
        if (hoursSinceLastAdjustment < 6) return;

        const totalMemories = memories.length;
        const avgImportance = memories.reduce((sum, m) => sum + (m.importance || 0), 0) / totalMemories;
        const avgUsage = memories.reduce((sum, m) => sum + (m.usageCount || 0), 0) / totalMemories;

        // Adjust decay rate based on memory growth
        if (totalMemories > this.memoryStats.totalMemories * 1.5) {
            this.config.decayRate *= 1.2; // Increase decay rate if growing too fast
        } else if (totalMemories < this.memoryStats.totalMemories * 0.5) {
            this.config.decayRate *= 0.8; // Decrease decay rate if shrinking too fast
        }

        // Adjust priority threshold based on average importance
        if (avgImportance > this.memoryStats.avgImportance * 1.3) {
            this.config.priorityThreshold *= 1.1; // Raise bar if too many high importance memories
        } else if (avgImportance < this.memoryStats.avgImportance * 0.7) {
            this.config.priorityThreshold *= 0.9; // Lower bar if too few important memories
        }

        // Keep parameters within reasonable bounds
        this.config.decayRate = Math.max(0.01, Math.min(0.5, this.config.decayRate));
        this.config.priorityThreshold = Math.max(0.3, Math.min(0.8, this.config.priorityThreshold));

        // Update stats
        this.memoryStats = {
            totalMemories,
            avgImportance,
            avgUsage,
            lastAdjustment: now
        };

        Logger.log('Autonomously adjusted memory parameters:', {
            decayRate: this.config.decayRate,
            priorityThreshold: this.config.priorityThreshold,
            totalMemories,
            avgImportance,
            avgUsage
        });
    }

    /**
     * Get the current priority threshold
     */
    public getPriorityThreshold(): number {
        return this.config.priorityThreshold;
    }

    /**
     * Calculate memory decay based on time elapsed and importance
     */
    public calculateDecay(entry: MemoryEntry): number {
        if (!isMemoryEntry(entry)) {
            throw new Error('Invalid memory entry provided for decay calculation');
        }

        const ageInHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
        const decayFactor = Math.exp(-this.config.decayRate * ageInHours);
        const importanceBoost = entry.importance || 1;
        
        return Math.min(1, decayFactor * importanceBoost);
    }

    /**
     * Calculate priority score for a memory entry with dynamic weighting
     */
    public calculatePriorityScore(entry: MemoryEntry): number {
        if (!isMemoryEntry(entry)) {
            throw new Error('Invalid memory entry provided for priority calculation');
        }

        const decay = this.calculateDecay(entry);
        const relevance = entry.relevanceScore || 0.5;
        const usage = entry.usageCount || 0;
        const usageScore = Math.min(1, usage / Math.max(1, this.memoryStats.avgUsage * 2));

        // Adjust weights based on memory stats
        const decayWeight = 0.4;
        const relevanceWeight = this.memoryStats.avgImportance > 0.7 ? 0.5 : 0.3;
        const usageWeight = 1 - decayWeight - relevanceWeight;

        return (
            decay * decayWeight +
            relevance * relevanceWeight +
            usageScore * usageWeight
        );
    }

    /**
     * Calculate optimization scores for a memory entry
     */
    public calculateOptimizationScores(entry: MemoryEntry): OptimizationScores {
        if (!isMemoryEntry(entry)) {
            throw new Error('Invalid memory entry provided for optimization');
        }

        return {
            decayScore: this.calculateDecay(entry),
            priorityScore: this.calculatePriorityScore(entry)
        };
    }

    /**
     * Determine if a memory should be retained based on priority score
     */
    public shouldRetainMemory(entry: MemoryEntry): boolean {
        if (!isMemoryEntry(entry)) {
            throw new Error('Invalid memory entry provided for retention check');
        }

        const priorityScore = this.calculatePriorityScore(entry);
        return priorityScore >= this.config.priorityThreshold;
    }

    /**
     * Schedule periodic cleanup of memory storage with autonomous adjustment
     */
    public scheduleCleanup(cleanupCallback: (adjustedConfig?: OptimizationConfig) => Promise<void>): void {
        setInterval(async () => {
            try {
                Logger.log('Starting scheduled memory cleanup');
                await cleanupCallback(this.config);
                this.lastCleanup = new Date();
            } catch (error) {
                Logger.error('Error during memory cleanup:', error);
            }
        }, this.config.cleanupInterval);
    }

    /**
     * Get the time since last cleanup
     */
    public getTimeSinceLastCleanup(): number {
        return Date.now() - this.lastCleanup.getTime();
    }

    /**
     * Check if cleanup is due
     */
    public isCleanupDue(): boolean {
        return this.getTimeSinceLastCleanup() >= this.config.cleanupInterval;
    }

    /**
     * Process memories for cleanup with autonomous parameter adjustment
     */
    public processMemoriesForCleanup(memories: MemoryEntry[]): MemoryEntry[] {
        this.adjustParameters(memories);
        return memories.filter(memory => this.shouldRetainMemory(memory));
    }
} 