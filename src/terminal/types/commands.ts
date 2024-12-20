// Type definitions for command parameters and commands

/**
 * Represents a command parameter.
 */
export interface CommandParameter {
    /**
     * The name of the parameter.
     */
    name: string;
  
    /**
     * A description of the parameter.
     */
    description: string;
  
    /**
     * Whether the parameter is required.
     */
    required: boolean;
  
    /**
     * The expected type of the parameter.
     */
    type: string;
  
    /**
     * Optional flag for command-line argument (e.g., 't' for -t)
     */
    flag?: string;
  
    /**
     * The default value of the parameter (if any).
     */
    defaultValue?: any;
  }
  
  /**
   * Defines the structure of a command.
   */
  export interface Command {
    /**
     * The name of the command.
     */
    name: string;
  
    /**
     * A description of what the command does.
     */
    description: string;
  
    /**
     * The parameters that the command accepts.
     */
    parameters: CommandParameter[];
  
    /**
     * The function that handles the command execution.
     */
    handler: (args: any) => Promise<{
      /**
       * The output of the command execution.
       */
      output: string;
      /**
       * Indicates success of the command execution.
       */
      success?: boolean;
    }>;
  }