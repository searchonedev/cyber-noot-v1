// Command registry for terminal commands

import { Command } from './types/commands';
import { Logger } from '../utils/logger';
import { commands } from './commands';

// Command registry to store all available commands
const commandRegistry = new Map<string, Command>();

/**
 * Loads all available commands into the registry
 */
export function loadCommands() {
  // Clear existing commands
  commandRegistry.clear();

  // Load commands from the commands object
  Object.entries(commands).forEach(([name, command]) => {
    if (command && typeof command === 'object' && 'handler' in command) {
      // Use the name from the commands object
      commandRegistry.set(name, command);
    }
  });

  Logger.log('Loaded commands:', Array.from(commandRegistry.keys()));
}

/**
 * Gets a command by name from the registry
 */
export function getCommand(name: string): Command | undefined {
  return commandRegistry.get(name);
}

/**
 * Gets all registered commands
 */
export function getAllCommands(): Map<string, Command> {
  return commandRegistry;
}

/**
 * Generates help text for all available commands
 */
export function generateHelpText(): string {
  const commandList = Array.from(commandRegistry.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  let helpText = 'Available Commands:\n\n';

  const maxNameLength = Math.max(...commandList.map(([name]) => name.length));

  commandList.forEach(([name, command]) => {
    // Format command name and description in a clean, aligned way
    const paddedName = name.padEnd(maxNameLength + 2);
    helpText += `${paddedName}${command.description}\n`;

    // Add parameter details if any exist
    if (command.parameters && command.parameters.length > 0) {
      command.parameters.forEach(param => {
        const flagInfo = param.flag ? ` (-${param.flag})` : '';
        const requiredInfo = param.required ? ' (required)' : '';
        const defaultInfo = param.defaultValue ? ` (default: ${param.defaultValue})` : '';
        helpText += `  ${param.name}${flagInfo}${requiredInfo}${defaultInfo}: ${param.description}\n`;
      });
    }
    helpText += '\n';
  });

  return helpText;
}

// Initialize commands on module load
loadCommands();