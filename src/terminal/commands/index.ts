import { Command } from '../types/commands';
import { postGifCommand } from './post-gif';
import { twitterTweet } from './post-main-tweet';
import { help } from './help';
import { getTweetsCommand } from './get-tweets';
import { twitterGetMentions } from './get-mentions';
import { get_homepage } from './get-homepage';
import { searchTwitterCommand } from './search-twitter';
import { followCommand } from './follow';
import { replyToTweetCommand } from './reply-to-tweet';
import { twitterQuote } from './quote-tweet';

// Export a single commands object with consistent naming
export const commands: { [key: string]: Command } = {
  'help': {
    ...help,
    name: 'help'
  },
  'follow': {
    ...followCommand,
    name: 'follow'
  },
  'get-tweets': {
    ...getTweetsCommand,
    name: 'get-tweets'
  },
  'get-mentions': {
    ...twitterGetMentions,
    name: 'get-mentions'
  },
  'get-homepage': {
    ...get_homepage,
    name: 'get-homepage'
  },
  'search-twitter': {
    ...searchTwitterCommand,
    name: 'search-twitter'
  },
  'post-gif': {
    ...postGifCommand,
    name: 'post-gif'
  },
  'post-main-tweet': {
    ...twitterTweet,
    name: 'post-main-tweet'
  },
  'reply-to-tweet': {
    ...replyToTweetCommand,
    name: 'reply-to-tweet'
  },
  'quote-tweet': {
    ...twitterQuote,
    name: 'quote-tweet'
  }
};

export * from './help';
export * from './get-tweets';
export * from './get-mentions';
export * from './get-homepage';
export * from './search-twitter';
export * from './follow';
export * from './post-main-tweet';
export * from './post-gif';
export * from './quote-tweet';
export * from './reply-to-tweet'; 