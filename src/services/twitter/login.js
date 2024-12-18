async function loginToTwitter(page) {
  try {
    // Force logout first
    await page.goto('https://twitter.com/logout');
    await page.waitForTimeout(2000);
    
    // Go to login page
    await page.goto('https://twitter.com/login');
    await page.waitForTimeout(2000);
    
    // Simple login with new credentials
    await page.waitForSelector('input[autocomplete="username"]');
    await page.type('input[autocomplete="username"]', process.env.TWITTER_USERNAME);
    await page.click('[role="button"]:has-text("Next")');
    
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', process.env.TWITTER_PASSWORD);
    await page.click('[role="button"]:has-text("Log in")');
    
    Logger.log('Logged in with new credentials');
  } catch (error) {
    Logger.error('Login failed:', error);
    throw error;
  }
} 