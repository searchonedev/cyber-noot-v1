// Core terminal command execution logic with parameter parsing

import { Command } from './types/commands';
import { Logger } from '../utils/logger';
import { getCommand } from './commandRegistry';

/**
 * Parses command line arguments into a key-value object
 * Supports both flag (-t, -m) and full name (--text, --media) formats
 */
function parseArgs(args: string[]): { [key: string]: string } {
  const parsedArgs: { [key: string]: string } = {};
  let i = 0;
  
  while (i < args.length) {
    const arg = args[i];
    
    // Check if it's a flag
    if (arg.startsWith('-')) {
      const isLongFlag = arg.startsWith('--');
      const flag = isLongFlag ? arg.slice(2) : arg.slice(1);
      
      // Get the value (next argument)
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsedArgs[flag] = args[i + 1];
        i += 2; // Skip the value
      } else {
        parsedArgs[flag] = 'true'; // Boolean flag
        i += 1;
      }
    } else {
      // Treat as positional argument
      parsedArgs[`arg${i}`] = arg;
      i += 1;
    }
  }
  
  return parsedArgs;
}

/**
 * Executes a terminal command
 * @param input - The command string to execute
 * @returns The command output
 */
export async function executeCommand(input: string): Promise<{ command: string; output: string }> {
  try {
    // Split input into command and arguments
    const [commandName, ...args] = input.split(' ');
    const command = getCommand(commandName);

    if (!command) {
      return {
        command: commandName,
        output: `Unknown command: ${commandName}. Type 'help' for available commands.`
      };
    }

    // Parse arguments without logging
    const parsedArgs = parseArgs(args);

    // Map flags to parameter names
    if (command.parameters) {
      // First map any flag arguments
      command.parameters.forEach(param => {
        if (param.flag && parsedArgs[param.flag]) {
          parsedArgs[param.name] = parsedArgs[param.flag];
        }
      });

      // Then map positional arguments to parameter names in order
      command.parameters.forEach((param, index) => {
        if (parsedArgs[`arg${index}`] && !parsedArgs[param.name]) {
          parsedArgs[param.name] = parsedArgs[`arg${index}`];
        }
      });
    }

    // Execute command
    const result = await command.handler(parsedArgs);

    return {
      command: commandName,
      output: result.output
    };

  } catch (error) {
    Logger.log('Error executing command:', error);
    return {
      command: input,
      output: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}