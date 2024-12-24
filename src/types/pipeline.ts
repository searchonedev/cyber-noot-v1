export interface ReplyResult {
  success: boolean;
  tweetId?: string;
  message: string;
  replyText: string;
  mediaUrls?: string[];
  reflection?: {
    quality_score: number;
    relevance_score: number;
    critique: string;
  };
} 