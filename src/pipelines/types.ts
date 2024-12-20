export interface MainTweetResult {
  success: boolean;
  tweetId?: string;
  message: string;
  tweetText: string;
  mediaUrls?: string[];
  reflection?: {
    quality_score: number;
    relevance_score: number;
    critique: string;
  };
} 