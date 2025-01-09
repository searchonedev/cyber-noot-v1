import axios from 'axios';
import { Logger } from '../../utils/logger';
import { scraper } from '../twitterClient';
import type { Tweet } from 'goat-x';

// Trusted crypto price accounts to follow
const TRUSTED_PRICE_ACCOUNTS = [
  'whale_alert',
  'BitcoinPriceBot',
  'CryptoTrendz',
  'PriceOracle'
];

interface PriceData {
  price: number;
  timestamp: number;
  source: string;
  change24h?: number;
}

interface CryptoPrice {
  btc: PriceData | null;
  eth: PriceData | null;
  sol: PriceData | null;
}

/**
 * Fetches crypto prices from CoinGecko API
 */
export async function getCryptoPrices(): Promise<CryptoPrice> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,solana',
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_last_updated_at: true
      }
    });

    const data = response.data;
    const now = Date.now();

    return {
      btc: data?.bitcoin ? {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        timestamp: data.bitcoin.last_updated_at || now,
        source: 'coingecko'
      } : null,
      eth: data?.ethereum ? {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
        timestamp: data.ethereum.last_updated_at || now,
        source: 'coingecko'
      } : null,
      sol: data?.solana ? {
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change,
        timestamp: data.solana.last_updated_at || now,
        source: 'coingecko'
      } : null
    };
  } catch (error) {
    Logger.log('Error fetching crypto prices from CoinGecko:', error);
    return { btc: null, eth: null, sol: null };
  }
}

/**
 * Safely fetch tweets with retries and error handling
 */
async function safeFetchTweets(username: string, count: number) {
  try {
    // Add delay between API calls to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await scraper.getUserTweets(username, count);
    return response.tweets || [];
  } catch (error) {
    // Log error but don't throw
    Logger.log(`Error fetching tweets from ${username}:`, error);
    return [];
  }
}

/**
 * Gets latest crypto price tweets from trusted accounts
 */
export async function getLatestPriceTweets(): Promise<Partial<CryptoPrice>> {
  try {
    const prices: Partial<CryptoPrice> = {};
    
    for (const account of TRUSTED_PRICE_ACCOUNTS) {
      const tweets = await safeFetchTweets(account, 10);
      
      // Process each tweet for price information
      for (const tweet of tweets) {
        if (!tweet.text) continue;
        const text = tweet.text.toLowerCase();
        
        // Extract BTC price
        if (!prices.btc && text.includes('bitcoin') && /\$[0-9,]+/.test(text)) {
          const match = text.match(/\$([0-9,]+)/);
          if (match) {
            prices.btc = {
              price: parseFloat(match[1].replace(/,/g, '')),
              timestamp: Date.now(),
              source: `twitter:${account}`
            };
          }
        }
        
        // Extract ETH price
        if (!prices.eth && text.includes('ethereum') && /\$[0-9,]+/.test(text)) {
          const match = text.match(/\$([0-9,]+)/);
          if (match) {
            prices.eth = {
              price: parseFloat(match[1].replace(/,/g, '')),
              timestamp: Date.now(),
              source: `twitter:${account}`
            };
          }
        }
        
        // Extract SOL price
        if (!prices.sol && text.includes('solana') && /\$[0-9,]+/.test(text)) {
          const match = text.match(/\$([0-9,]+)/);
          if (match) {
            prices.sol = {
              price: parseFloat(match[1].replace(/,/g, '')),
              timestamp: Date.now(),
              source: `twitter:${account}`
            };
          }
        }
      }
    }
    
    return prices;
  } catch (error) {
    Logger.log('Error in getLatestPriceTweets:', error);
    return {};
  }
}

/**
 * Gets comprehensive crypto market data
 */
export async function getMarketData() {
  try {
    // Get prices from CoinGecko first as it's most reliable
    const apiPrices = await getCryptoPrices();
    
    // Only try Twitter sources if CoinGecko fails for any coin
    const tweetPrices = !apiPrices.btc || !apiPrices.eth || !apiPrices.sol 
      ? await getLatestPriceTweets()
      : {};

    return {
      prices: {
        btc: apiPrices.btc || tweetPrices.btc || null,
        eth: apiPrices.eth || tweetPrices.eth || null,
        sol: apiPrices.sol || tweetPrices.sol || null
      },
      timestamp: Date.now()
    };
  } catch (error) {
    Logger.log('Error getting market data:', error);
    return null;
  }
} 