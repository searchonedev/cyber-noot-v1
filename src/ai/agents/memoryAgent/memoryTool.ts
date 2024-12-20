// tools/TerminalTool.ts

import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

export const memoryToolSchema = z.object({
  internal_thought: z.string().describe('Think about what query would be the most efficient to pull the most relevant memories'),
  memory_query: z.object({
    primary_keywords: z.array(z.string()).describe('Primary keywords for memory search (max 3 words)'),
    context_keywords: z.array(z.string()).describe('Additional context keywords (max 3 words)'),
    time_relevance: z.enum(['recent', 'all']).describe('Whether to prioritize recent memories or search all'),
    categories: z.array(z.string()).describe('Specific memory categories to search')
  }).describe('Structured query parameters for memory search')
});

export const MemoryTool: Tool = {
  type: 'function',
  function: {
    "name": "memory_tool",
    "description": "Analyze chat logs to generate a structured query to pull the most relevant memories from the vector database of memories",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": [
        "internal_thought",
        "memory_query"
      ],
      "properties": {
        "internal_thought": {
          "type": "string",
          "description": "Think about what query would be the most efficient to pull the most relevant memories."
        },
        "memory_query": {
          "type": "object",
          "description": "Structured query parameters for memory search",
          "required": ["primary_keywords", "context_keywords", "time_relevance", "categories"],
          "properties": {
            "primary_keywords": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Primary keywords for memory search (max 3 words)"
            },
            "context_keywords": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Additional context keywords (max 3 words)"
            },
            "time_relevance": {
              "type": "string",
              "enum": ["recent", "all"],
              "description": "Whether to prioritize recent memories or search all"
            },
            "categories": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Specific memory categories to search"
            }
          }
        }
      }
    }
  }
};