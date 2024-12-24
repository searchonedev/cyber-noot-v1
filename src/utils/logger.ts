// src/utils/logger.ts

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private static enabled: boolean = true;

  /**
   * Enable logging
   */
  public static enable(): void {
    Logger.enabled = true;
    Logger.log('Logging enabled');
  }

  /**
   * Disable logging
   */
  public static disable(): void {
    Logger.log('Logging disabled');
    Logger.enabled = false;
  }

  /**
   * Set the minimum log level to display
   * @param level Minimum log level
   */
  public static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  /**
   * Log debug message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  public static debug(message: string, ...args: any[]): void {
    Logger.log(message, ...args, LogLevel.DEBUG);
  }

  /**
   * Log info message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  public static log(message: string, ...args: any[]): void {
    Logger.logWithLevel(message, LogLevel.INFO, ...args);
  }

  /**
   * Log warning message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  public static warn(message: string, ...args: any[]): void {
    Logger.logWithLevel(message, LogLevel.WARN, ...args);
  }

  /**
   * Log error message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  public static error(message: string, ...args: any[]): void {
    Logger.logWithLevel(message, LogLevel.ERROR, ...args);
  }

  private static logWithLevel(message: string, level: LogLevel, ...args: any[]): void {
    if (!Logger.enabled) return;
    
    if (Logger.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] ${level}:`;
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(prefix, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...args);
          break;
        case LogLevel.DEBUG:
          console.debug(prefix, message, ...args);
          break;
        default:
          console.log(prefix, message, ...args);
      }
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(Logger.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }
}