// Script to generate and post a main tweet
import { generateAndPostMainTweet } from '../pipelines/generateMainTweet';
import { Logger } from '../utils/logger';

Logger.enable();

async function main() {
  try {
    const result = await generateAndPostMainTweet();
    console.log('Tweet result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
}

main(); 