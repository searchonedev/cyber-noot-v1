import { Logger } from '../../utils/logger';

/**
 * Formats tweet text with proper line breaks
 * @param text - The tweet text to format
 * @returns The formatted tweet text
 */
export function formatTweet(text: string): string {
  Logger.log('Formatting tweet text');
  
  // Split into sentences and join with double line breaks
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.join('\n\n').trim();
}