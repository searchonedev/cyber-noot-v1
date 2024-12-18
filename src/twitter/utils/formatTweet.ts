import { Logger } from '../../utils/logger';

/**
 * Formats tweet text with proper line breaks between thoughts
 * @param text - The original tweet text
 * @returns Formatted tweet text with proper line breaks
 */
export function formatTweet(text: string): string {
  Logger.log('Formatting tweet:', text);
  
  // Split text into sentences using regex that handles multiple punctuation marks
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Filter out empty sentences and join with double line breaks
  return sentences
    .filter(sentence => sentence.trim().length > 0)
    .join('\n\n')
    .trim();
} 