import { scraper } from '../twitter/twitterClient';
import { postTweetWithTenorGif } from '../twitter/utils/gifUtils';
import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { getConversationWithUser } from '../supabase/functions/twitter/getTweetContext';
import { isCooldownActive } from '../supabase/functions/twitter/cooldowns';
import { Logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();
Logger.enable();

/**
 * Test suite for Twitter functionality
 */
export async function testTwitterFunctionality() {
  try {
    Logger.log('\n🧪 Starting Twitter Functionality Tests\n');

    // Test 1: Cooldown System
    Logger.log('Test 1: Testing Cooldown System');
    const cooldownTypes = ['main', 'quote', 'retweet', 'media'] as const;
    
    for (const type of cooldownTypes) {
      const cooldown = await isCooldownActive(type);
      Logger.log(`Cooldown status for ${type}:`, cooldown);
    }

    // Test 2: Tweet Context Assembly
    Logger.log('\nTest 2: Testing Tweet Context Assembly');
    const testTweetId = '1862442359020990812'; // Replace with a valid tweet ID
    
    try {
      const { textContent, imageContents, usernames } = await assembleTwitterInterface(testTweetId);
      Logger.log('\nAssembled tweet interface:');
      Logger.log('Text content:', textContent);
      Logger.log('Image count:', imageContents.length);
      Logger.log('Usernames:', usernames);
    } catch (error) {
      Logger.log('Error assembling tweet interface:', error);
    }

    // Test 3: Conversation Context
    Logger.log('\nTest 3: Testing Conversation Context');
    try {
      const conversation = await getConversationWithUser(testTweetId);
      Logger.log('Conversation context:', conversation);
    } catch (error) {
      Logger.log('Error getting conversation context:', error);
    }

    // Test 4: GIF Tweet Posting (if not in cooldown)
    Logger.log('\nTest 4: Testing GIF Tweet Posting');
    const mediaCooldown = await isCooldownActive('media');
    
    if (!mediaCooldown.isActive) {
      try {
        const result = await postTweetWithTenorGif(
          'Test tweet with GIF #testing',
          'happy pingu'
        );
        Logger.log('GIF tweet result:', result);
      } catch (error) {
        Logger.log('Error posting GIF tweet:', error);
      }
    } else {
      Logger.log(`Skipping GIF tweet test - Cooldown active for ${mediaCooldown.remainingTime} minutes`);
    }

    // Test 5: Tweet Client Functions
    Logger.log('\nTest 5: Testing Tweet Client Functions');
    
    // Test tweet sending
    try {
      const tweetResponse = await scraper.sendTweet('Test tweet from automated testing');
      Logger.log('Tweet response:', tweetResponse);
    } catch (error) {
      Logger.log('Error sending tweet:', error);
    }

    Logger.log('\n✅ Twitter functionality tests completed\n');
  } catch (error) {
    Logger.log('\n❌ Error during Twitter tests:', error);
  }
}

// Run the tests
testTwitterFunctionality().then(() => {
  Logger.log('Test execution completed');
}).catch((error) => {
  Logger.log('Fatal error in test execution:', error);
}); 