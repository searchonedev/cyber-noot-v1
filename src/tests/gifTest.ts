import { Logger } from '../utils/logger';
import { searchTenorGif, postTweetWithTenorGif } from '../twitter/utils/gifUtils';
import { isCooldownActive } from '../twitter/utils/cooldowns';
import dotenv from 'dotenv';

dotenv.config();
Logger.enable();

/**
 * Test suite for GIF functionality
 */
export async function testGifFunctionality() {
  try {
    Logger.log('\n🧪 Starting GIF Functionality Tests\n');

    // Test 1: Search for GIFs
    Logger.log('Test 1: Testing GIF Search');
    const searchTerms = ['pingu', 'nootnoot', 'happy pingu'];
    
    for (const term of searchTerms) {
      try {
        const gifUrl = await searchTenorGif(term);
        Logger.log(`\nSearch results for "${term}":`);
        Logger.log('GIF URL:', gifUrl || 'No GIF found');
      } catch (error) {
        Logger.log(`Error searching for "${term}":`, error);
      }
    }

    // Test 2: Post Tweet with GIF (if not in cooldown)
    Logger.log('\nTest 2: Testing GIF Tweet Posting');
    const mediaCooldown = await isCooldownActive('media');
    
    if (!mediaCooldown.isActive) {
      try {
        const result = await postTweetWithTenorGif(
          'Test tweet with Pingu GIF #testing',
          'happy pingu'
        );
        Logger.log('GIF tweet result:', result);
      } catch (error) {
        Logger.log('Error posting GIF tweet:', error);
      }
    } else {
      Logger.log(`Skipping GIF tweet test - Cooldown active for ${mediaCooldown.remainingTime} minutes`);
    }

    // Test 3: Test Invalid Search Terms
    Logger.log('\nTest 3: Testing Invalid Search Terms');
    const invalidTerms = ['', ' ', '   '];
    
    for (const term of invalidTerms) {
      try {
        const gifUrl = await searchTenorGif(term);
        Logger.log(`Search results for invalid term "${term}":`, gifUrl || 'No GIF found');
      } catch (error) {
        Logger.log(`Expected error for invalid term "${term}":`, error);
      }
    }

    // Test 4: Test Search Term Sanitization
    Logger.log('\nTest 4: Testing Search Term Sanitization');
    const specialTerms = [
      'pingu!@#$%^&*()',
      '   noot   noot   ',
      'PINGU in UPPERCASE'
    ];
    
    for (const term of specialTerms) {
      try {
        const gifUrl = await searchTenorGif(term);
        Logger.log(`\nSearch results for special term "${term}":`);
        Logger.log('GIF URL:', gifUrl || 'No GIF found');
      } catch (error) {
        Logger.log(`Error searching for "${term}":`, error);
      }
    }

    Logger.log('\n✅ GIF functionality tests completed\n');
  } catch (error) {
    Logger.log('\n❌ Error during GIF tests:', error);
  }
}

// Run the tests
testGifFunctionality().then(() => {
  Logger.log('Test execution completed');
}).catch((error) => {
  Logger.log('Fatal error in test execution:', error);
}); 