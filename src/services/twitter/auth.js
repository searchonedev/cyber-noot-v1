/**
 * Ensures a fresh login by clearing any existing sessions
 */
async function ensureFreshLogin(page) {
  try {
    Logger.log('Clearing existing Twitter sessions');
    
    // Clear all browser data
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    
    // Navigate to logout (optional, but helps ensure clean state)
    await page.goto('https://twitter.com/logout');
    await page.waitForTimeout(2000);
    
    // Now perform fresh login
    await page.goto('https://twitter.com/login');
    
    Logger.log('Successfully cleared previous sessions');
  } catch (error) {
    Logger.error('Failed to clear sessions:', error);
    throw error;
  }
} 