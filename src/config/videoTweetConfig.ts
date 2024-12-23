// Configuration for periodic video tweets with short catchphrases
export const VIDEO_TWEET_CONFIG = {
  // Cooldown in minutes between video tweets (2 hours = 120 minutes)
  COOLDOWN_MINUTES: 120,
  
  // Collection of original short catchphrases
  CATCHPHRASES: [
    "stay nooty",
    "gm noot fam",
    "nooting all day",
    "noot noot",
    "lets get nooty",
    "noot szn",
    "nooty vibes only",
    "noot to the moon",
    "feeling nooty",
    "noot gang",
  ]
};

// Video tweet type definition
export interface VideoTweetConfig {
  cooldownMinutes: number;
  catchphrases: string[];
} 