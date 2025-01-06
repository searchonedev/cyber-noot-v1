import { getTweets } from '../twitter/functions/getTweets';
import { Logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();
Logger.enable();

async function testTweetFetch() {
  try {
    Logger.log('Testing tweet fetch with uppercase username...');
    const tweets = await getTweets('NOOTNOOTMFERS', 5);
    Logger.log('Result:', tweets);
  } catch (error) {
    Logger.log('Error in test:', error instanceof Error ? error.message : 'Unknown error');
  }
}

testTweetFetch(); 