export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      twitter_tweets: {
        Row: {
          id: number
          tweet_id: string | null
          text: string | null
          tweet_type: string | null
          has_media: boolean | null
          bot_username: string | null
          in_reply_to_tweet_id: string | null
          retweeted_tweet_id: string | null
          quoted_tweet_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          tweet_id?: string | null
          text?: string | null
          tweet_type?: string | null
          has_media?: boolean | null
          bot_username?: string | null
          in_reply_to_tweet_id?: string | null
          retweeted_tweet_id?: string | null
          quoted_tweet_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          tweet_id?: string | null
          text?: string | null
          tweet_type?: string | null
          has_media?: boolean | null
          bot_username?: string | null
          in_reply_to_tweet_id?: string | null
          retweeted_tweet_id?: string | null
          quoted_tweet_id?: string | null
          created_at?: string | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
