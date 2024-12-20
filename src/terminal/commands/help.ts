// Command to display help information in a concise format with parameter details

import { Command } from '../types/commands';
import { generateHelpText } from '../commandRegistry';

/**
 * @command help
 * @description Displays available commands and usage information
 */
export const help: Command = {
  name: 'help',
  description: 'Shows available commands and their usage',
  parameters: [],
  handler: async () => {
    const helpText = generateHelpText();
    return {
      output: helpText
    };
  }
};