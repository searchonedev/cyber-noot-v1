export interface TweetActionResult {
  success: boolean;
  message: string;
  tweetId?: string;
}

export interface ReplyResult extends TweetActionResult {
  replyText?: string;
  mediaUrls?: string[];
  reflection?: {
    quality_score: number;
    relevance_score: number;
    critique: string;
  };
}

export interface QuoteResult extends TweetActionResult {}
export interface RetweetResult extends TweetActionResult {} 