// Script to generate and post a video catchphrase tweet
import { generateAndPostVideoCatchphraseTweet } from '../pipelines/generateVideoCatchphraseTweet';
import { Logger } from '../utils/logger';

Logger.enable();

async function main() {
  try {
    const result = await generateAndPostVideoCatchphraseTweet();
    console.log('Tweet result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
}

main(); 