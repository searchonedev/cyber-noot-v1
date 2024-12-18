import { Logger } from './logger';

export async function analyzeThread(tweets: any[]) {
  try {
    const threadContext = {
      topic: extractMainTopic(tweets),
      technicalLevel: assessTechnicalLevel(tweets),
      sentiment: analyzeSentiment(tweets),
      participants: getUniqueParticipants(tweets),
      keywords: extractKeywords(tweets)
    };

    Logger.log('Thread analysis completed', { context: threadContext });
    return threadContext;
  } catch (error) {
    Logger.log('Error analyzing thread', { error });
    throw error;
  }
}

function extractMainTopic(tweets: any[]): string[] {
  const fullText = tweets.map(t => t.text).join(' ');
  const topics = ['bitcoin', 'ordinals', 'runes', 'market', 'development', 'technical']
    .filter(topic => fullText.toLowerCase().includes(topic));
  return topics;
}

function assessTechnicalLevel(tweets: any[]): string {
  const technicalTerms = [
    'blockchain', 'bitcoin', 'crypto',
    'ordinals', 'runes', 'protocol', 'network',
    'merkle', 'consensus', 'cryptography'
  ];

  const fullText = tweets.map(t => t.text).join(' ').toLowerCase();
  const termCount = technicalTerms.reduce((count, term) => {
    return count + (fullText.match(new RegExp(term, 'g')) || []).length;
  }, 0);

  if (termCount > 10) return 'advanced';
  if (termCount > 5) return 'intermediate';
  return 'basic';
}

function analyzeSentiment(tweets: any[]): string {
  const fullText = tweets.map(t => t.text).join(' ').toLowerCase();
  const positiveTerms = ['bullish', 'excited', 'great', 'good', 'amazing', 'love'];
  const negativeTerms = ['bearish', 'concerned', 'bad', 'worried', 'hate', 'issue'];
  
  const positiveCount = positiveTerms.reduce((count, term) => 
    count + (fullText.match(new RegExp(term, 'g')) || []).length, 0);
  const negativeCount = negativeTerms.reduce((count, term) => 
    count + (fullText.match(new RegExp(term, 'g')) || []).length, 0);

  if (positiveCount > negativeCount + 2) return 'positive';
  if (negativeCount > positiveCount + 2) return 'negative';
  return 'neutral';
}

function getUniqueParticipants(tweets: any[]): string[] {
  return [...new Set(tweets.map(t => t.author_id))];
}

function extractKeywords(tweets: any[]): string[] {
  const fullText = tweets.map(t => t.text).join(' ').toLowerCase();
  const words = fullText.split(/\s+/);
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'];
  return Object.entries(wordFreq)
    .filter(([word]) => !commonWords.includes(word))
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
} 