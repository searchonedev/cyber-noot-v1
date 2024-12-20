import { Logger } from '../utils/logger';
import dotenv from 'dotenv';

// Import all test functions
import { testTwitterFunctionality } from './twitterTest';
import { testGifFunctionality } from './gifTest';
import { testMemoryService } from './memoryTest';
import { runModelTests } from './toolsTest';
import { testSummaries } from './random';
import { testMemorySearches } from '../memory/test';
import { testLocalMemory } from '../memory/test-local';
import { runChatTests } from './chatTest';
import { runTest as testPopulateSummaries } from './testPopulateSummaries';

dotenv.config();
Logger.enable();

/**
 * Main test runner that executes all test suites
 */
async function runAllTests() {
  Logger.log('\n🚀 Starting Comprehensive Test Suite\n');
  
  const tests = [
    {
      name: 'Memory Service Tests',
      fn: testMemoryService,
      description: 'Testing memory service CRUD operations'
    },
    {
      name: 'Twitter Functionality Tests',
      fn: testTwitterFunctionality,
      description: 'Testing Twitter client and interactions'
    },
    {
      name: 'GIF Functionality Tests',
      fn: testGifFunctionality,
      description: 'Testing Tenor GIF search and posting'
    },
    {
      name: 'AI Model Tests',
      fn: runModelTests,
      description: 'Testing AI model integrations'
    },
    {
      name: 'Memory Summaries Tests',
      fn: testSummaries,
      description: 'Testing memory summarization'
    },
    {
      name: 'Memory Search Tests',
      fn: testMemorySearches,
      description: 'Testing memory search functionality'
    },
    {
      name: 'Local Memory Tests',
      fn: testLocalMemory,
      description: 'Testing local memory operations'
    },
    {
      name: 'Chat Tests',
      fn: runChatTests,
      description: 'Testing chat model interactions'
    },
    {
      name: 'Summary Population Tests',
      fn: testPopulateSummaries,
      description: 'Testing memory summary population'
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    errors: [] as { name: string, error: any }[]
  };

  for (const test of tests) {
    try {
      Logger.log(`\n📋 Running ${test.name}`);
      Logger.log(`Description: ${test.description}`);
      
      const startTime = Date.now();
      await test.fn();
      const duration = Date.now() - startTime;
      
      Logger.log(`✅ ${test.name} completed in ${duration}ms\n`);
      results.passed++;
    } catch (error) {
      Logger.log(`❌ ${test.name} failed:`, error);
      results.failed++;
      results.errors.push({ name: test.name, error });
    }
  }

  // Print test summary
  Logger.log('\n📊 Test Summary');
  Logger.log('==============');
  Logger.log(`Total Tests: ${tests.length}`);
  Logger.log(`Passed: ${results.passed}`);
  Logger.log(`Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    Logger.log('\n❌ Failed Tests:');
    results.errors.forEach(({ name, error }) => {
      Logger.log(`\n${name}:`);
      Logger.log(error);
    });
  }

  Logger.log('\n🏁 All tests completed\n');
}

// Run all tests
runAllTests().catch(error => {
  Logger.log('Fatal error in test execution:', error);
  process.exit(1);
}); 