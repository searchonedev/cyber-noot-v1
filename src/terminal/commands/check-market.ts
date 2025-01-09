import { Logger } from '../../utils/logger';
import { getMarketData } from '../../twitter/utils/priceUtils';
import { Command } from '../types/commands';

/**
 * @command check-market
 * @description Check cryptocurrency prices (BTC, ETH, SOL)
 */
export const checkMarketCommand: Command = {
  name: 'check-market',
  description: 'Check cryptocurrency prices (BTC, ETH, SOL)',
  parameters: [
    {
      name: 'coin',
      description: 'Specific coin to check (btc, eth, sol) or all',
      required: false,
      type: 'string',
      defaultValue: 'all'
    }
  ],
  handler: async (args) => {
    try {
      Logger.log('Fetching market data...');
      const data = await getMarketData();
      
      if (!data) {
        return {
          output: '❌ Failed to fetch market data',
          success: false
        };
      }

      // Format prices nicely
      const formatPrice = (price: number) => 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(price);

      // Format 24h change
      const formatChange = (change?: number) => {
        if (change === undefined) return '';
        const sign = change >= 0 ? '↗' : '↘';
        const color = change >= 0 ? '🟢' : '🔴';
        return ` ${color} ${sign}${Math.abs(change).toFixed(2)}%`;
      };

      let output = '';
      const { prices } = data;

      // Helper to add coin info to output
      const addCoinInfo = (name: string, data: typeof prices.btc) => {
        if (data) {
          output += `${name}: ${formatPrice(data.price)}`;
          if (data.change24h !== undefined) {
            output += formatChange(data.change24h);
          }
          output += ` (${data.source})\n`;
        } else {
          output += `${name}: No data available\n`;
        }
      };

      // Show requested data based on coin parameter
      if (args.coin === 'btc' || args.coin === 'all') {
        addCoinInfo('Bitcoin', prices.btc);
      }
      if (args.coin === 'eth' || args.coin === 'all') {
        addCoinInfo('Ethereum', prices.eth);
      }
      if (args.coin === 'sol' || args.coin === 'all') {
        addCoinInfo('Solana', prices.sol);
      }

      if (!output) {
        output = '❌ Invalid coin specified. Use: btc, eth, sol, or all';
      } else {
        output = '📊 Crypto Prices:\n' + output;
      }

      return {
        output: output.trim(),
        success: true
      };

    } catch (error) {
      Logger.log('Error checking market:', error);
      return {
        output: `❌ Error checking market: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }
}; 