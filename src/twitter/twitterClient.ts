// Twitter client connectivity and authentication

import { Scraper } from 'goat-x';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

// Initialize the Scraper instance for interacting with Twitter
export const scraper = new Scraper();

// Function to log in and save cookies
export async function loginAndSaveCookies() {
  Logger.log("Attempting to login and save cookies");
  try {
    // Validate required environment variables
    if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
      throw new Error('Missing required Twitter credentials in environment variables');
    }

    // Log in using credentials from environment variables
    await scraper.login(
      process.env.TWITTER_USERNAME,
      process.env.TWITTER_PASSWORD,
      process.env.TWITTER_EMAIL
    );

    // Retrieve the current session cookies
    const cookies = await scraper.getCookies();
    if (!cookies || cookies.length === 0) {
      throw new Error('No cookies received after login');
    }

    // Create directory if it doesn't exist
    const cookiesDir = path.dirname(path.resolve(__dirname, 'cookies.json'));
    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true });
    }

    // Save the cookies to a JSON file for future sessions
    fs.writeFileSync(
      path.resolve(__dirname, 'cookies.json'),
      JSON.stringify(cookies)
    );

    Logger.log('Successfully logged in and saved cookies');
  } catch (error) {
    Logger.log('Error during login:', error);
    throw error; // Re-throw to handle at caller level
  }
}

// Function to load cookies from the JSON file
export async function loadCookies() {
  try {
    const cookiesPath = path.resolve(__dirname, 'cookies.json');
    
    // Check if cookies file exists
    if (!fs.existsSync(cookiesPath)) {
      Logger.log('No cookies file found, will need to login');
      return false;
    }

    // Read cookies from the file system
    const cookiesData = fs.readFileSync(cookiesPath, 'utf8');
    const cookiesArray = JSON.parse(cookiesData);

    if (!Array.isArray(cookiesArray) || cookiesArray.length === 0) {
      Logger.log('Invalid or empty cookies data');
      return false;
    }

    // Map cookies to the correct format (strings)
    const cookieStrings = cookiesArray.map((cookie: any) => {
      if (!cookie.key || !cookie.value) {
        throw new Error('Invalid cookie format');
      }
      return `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${
        cookie.secure ? 'Secure' : ''
      }; ${cookie.httpOnly ? 'HttpOnly' : ''}; SameSite=${
        cookie.sameSite || 'Lax'
      }`;
    });

    // Set the cookies for the current session
    await scraper.setCookies(cookieStrings);
    Logger.log('Successfully loaded cookies from file');
    return true;

  } catch (error) {
    Logger.log('Error loading cookies:', error);
    return false;
  }
}

// Function to ensure the scraper is authenticated
export async function ensureAuthenticated() {
  try {
    // First try to load existing cookies
    const cookiesLoaded = await loadCookies();
    
    if (cookiesLoaded) {
      // Verify the loaded cookies are still valid
      const loggedIn = await scraper.isLoggedIn();
      if (loggedIn) {
        Logger.log('Successfully authenticated with loaded cookies');
        return true;
      }
      Logger.log('Loaded cookies are invalid, attempting fresh login');
    }

    // If cookies failed or are invalid, try fresh login
    await loginAndSaveCookies();
    
    // Verify the new login was successful
    const loggedIn = await scraper.isLoggedIn();
    if (!loggedIn) {
      throw new Error('Failed to authenticate after fresh login');
    }

    return true;

  } catch (error) {
    Logger.log('Error during authentication:', error);
    throw error;
  }
}

// Initialize authentication on module load
ensureAuthenticated().catch(error => {
  Logger.log('Failed to initialize Twitter client:', error);
});