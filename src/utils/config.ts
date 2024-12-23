import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

// Interface for agent configuration
export interface AgentConfig {
  name: string;
  raw_personality: string;
}

// Interface for the entire configuration
interface Config {
  agent: AgentConfig;
}

class ConfigLoader {
  private static instance: ConfigLoader;
  private config!: Config;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(__dirname, '..', 'config', 'agent.yaml');
    this.loadConfig();
  }

  private loadConfig() {
    try {
      // Load the YAML file
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContents) as Config;
      Logger.log('Configuration loaded successfully');
    } catch (error) {
      Logger.log(`Error loading configuration: ${error}`);
      throw error;
    }
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  // Force a reload of the configuration
  public reloadConfig(): void {
    Logger.log('Reloading configuration...');
    this.loadConfig();
    Logger.log('Configuration reloaded successfully');
  }

  public getAgentConfig(): AgentConfig {
    return this.config.agent;
  }

  public getAgentName(): string {
    return this.config.agent.name;
  }

  public getRawPersonality(): string {
    // Always reload config before getting personality to ensure fresh data
    this.reloadConfig();
    return this.config.agent.raw_personality.trim();
  }
}

export const configLoader = ConfigLoader.getInstance(); 