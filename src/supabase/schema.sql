-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS memory_summaries CASCADE;
DROP TABLE IF EXISTS learnings CASCADE;
DROP TABLE IF EXISTS terminal_status CASCADE;
DROP TABLE IF EXISTS agent_responses CASCADE;
DROP TABLE IF EXISTS short_term_terminal_history CASCADE;
DROP TABLE IF EXISTS terminal_history CASCADE;
DROP TABLE IF EXISTS twitter_interactions CASCADE;
DROP TABLE IF EXISTS tweet_media CASCADE;
DROP TABLE IF EXISTS twitter_tweets CASCADE;
DROP TABLE IF EXISTS twitter_user_accounts CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now create tables
-- Core user management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_registered BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Platform account linkage
CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NULL, -- Allow NULL for unregistered users
  platform VARCHAR NOT NULL,
  platform_user_id VARCHAR NOT NULL,
  username VARCHAR,
  connected_at TIMESTAMP,
  UNIQUE (platform, platform_user_id)
);

-- Media storage
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR NOT NULL,    -- 'image', 'video', etc.
  file_path VARCHAR NOT NULL,     -- Path in Supabase storage
  created_at TIMESTAMP
);

-- Twitter-specific account data
CREATE TABLE twitter_user_accounts (
  user_account_id INTEGER PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
  is_followed_by_bot BOOLEAN DEFAULT FALSE,
  last_followed_at TIMESTAMP,
  profile_data JSONB DEFAULT NULL,  -- Store complete Twitter profile
  last_profile_update TIMESTAMP     -- Track when profile was last updated
);

-- Bot's tweets
CREATE TABLE twitter_tweets (
  id SERIAL PRIMARY KEY,
  tweet_id VARCHAR NULL,  -- Allow NULL
  text TEXT,
  tweet_type VARCHAR,             -- 'main', 'reply', 'quote', 'retweet'
  has_media BOOLEAN DEFAULT FALSE,
  bot_username TEXT,             
  in_reply_to_tweet_id VARCHAR,
  retweeted_tweet_id VARCHAR,
  quoted_tweet_id VARCHAR,
  created_at TIMESTAMP,
  CONSTRAINT unique_tweet_id UNIQUE NULLS NOT DISTINCT (tweet_id)  -- Only enforce uniqueness for non-null values
);

-- Link tweets to media (modified to handle nullable tweet_id)
CREATE TABLE tweet_media (
  tweet_id VARCHAR REFERENCES twitter_tweets(tweet_id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  PRIMARY KEY (tweet_id, media_id),
  CONSTRAINT tweet_id_not_null CHECK (tweet_id IS NOT NULL)  -- Ensure we only link media to tweets with IDs
);

CREATE TABLE twitter_interactions (
  id SERIAL PRIMARY KEY,
  tweet_id VARCHAR,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bot_username TEXT,         
  text TEXT,                        -- User's tweet text
  context JSONB,                    -- Store any additional context
  timestamp TIMESTAMP,              -- When the user's tweet was created
  UNIQUE(tweet_id)                  -- Prevent duplicate entries for same tweet
);

-- Terminal history table with new structure
CREATE TABLE terminal_history (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  internal_thought TEXT,
  plan TEXT,
  command TEXT NOT NULL,
  terminal_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create terminal_history table for active short-term history
CREATE TABLE short_term_terminal_history (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for faster queries
    CONSTRAINT terminal_history_session_idx UNIQUE (id, session_id)
);

CREATE TABLE agent_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id VARCHAR NOT NULL,
  session_id VARCHAR NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  chat_history TEXT[],
  direct_response TEXT,
  tool_output JSONB,
  error TEXT
);

CREATE TABLE terminal_status (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id), -- Ensures only one row exists
  is_active BOOLEAN NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning system
CREATE TABLE learnings (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  learning_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A single unified memory table for all summaries
CREATE TABLE memory_summaries (
  id SERIAL PRIMARY KEY,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('short', 'mid', 'long')),
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  session_id TEXT,  -- NULL for long-term summaries
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_platform ON user_accounts(platform);
CREATE INDEX idx_twitter_interactions_user_id ON twitter_interactions(user_id);
CREATE INDEX idx_twitter_interactions_tweet_id ON twitter_interactions(tweet_id);
CREATE INDEX idx_twitter_interactions_bot_account ON twitter_interactions(bot_username);
CREATE INDEX idx_twitter_tweets_created_at ON twitter_tweets(created_at);
CREATE INDEX idx_terminal_history_session_id ON terminal_history(session_id);
CREATE INDEX idx_agent_responses_lookup ON agent_responses(agent_id, session_id);
CREATE INDEX idx_twitter_tweets_bot_account ON twitter_tweets(bot_username);
CREATE INDEX idx_user_accounts_platform_user ON user_accounts(platform, platform_user_id);
CREATE INDEX idx_twitter_tweets_type ON twitter_tweets(tweet_type);
CREATE INDEX idx_twitter_tweets_reply_to ON twitter_tweets(in_reply_to_tweet_id);
CREATE INDEX idx_twitter_tweets_quoted ON twitter_tweets(quoted_tweet_id);
CREATE INDEX idx_twitter_tweets_retweeted ON twitter_tweets(retweeted_tweet_id);
CREATE INDEX short_term_terminal_history_session_id_idx ON terminal_history(session_id);
CREATE INDEX idx_learnings_session ON learnings(session_id);
CREATE INDEX idx_learnings_user_id ON learnings(user_id);
CREATE INDEX idx_learnings_type ON learnings(learning_type);
CREATE INDEX idx_memory_summaries_type_processed ON memory_summaries(summary_type, processed);
CREATE INDEX idx_memory_summaries_created ON memory_summaries(created_at);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_term_terminal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_summaries ENABLE ROW LEVEL SECURITY;

-- Private tables (only service role can access)
-- Users table
CREATE POLICY "Service role only" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- User accounts table
CREATE POLICY "Service role only" ON user_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Twitter user accounts table
CREATE POLICY "Service role only" ON twitter_user_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Public readable tables (anyone can read, only service role can modify)
-- Media table
CREATE POLICY "Public read access" ON media
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON media
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Twitter tweets table
CREATE POLICY "Public read access" ON twitter_tweets
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON twitter_tweets
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tweet media table
CREATE POLICY "Public read access" ON tweet_media
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON tweet_media
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Twitter interactions table
CREATE POLICY "Public read access" ON twitter_interactions
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON twitter_interactions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Terminal history table
CREATE POLICY "Public read access" ON terminal_history
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON terminal_history
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Agent responses table
CREATE POLICY "Public read access" ON agent_responses
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON agent_responses
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Terminal status table
CREATE POLICY "Public read access" ON terminal_status
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON terminal_status
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Short term terminal history table
CREATE POLICY "Service role modification" ON short_term_terminal_history
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies
CREATE POLICY "Public read access" ON learnings
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON learnings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read access" ON memory_summaries
  FOR SELECT USING (true);
CREATE POLICY "Service role modification" ON memory_summaries
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert the initial row
INSERT INTO terminal_status (id, is_active) VALUES (TRUE, FALSE); 