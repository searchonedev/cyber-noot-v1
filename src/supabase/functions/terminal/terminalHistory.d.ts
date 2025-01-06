import { Message } from '../../../ai/types/agentSystem';

export function storeTerminalMessage(message: Message, sessionId: string): Promise<void>;
export function getShortTermHistory(limit?: number): Promise<Message[]>;
export function clearShortTermHistory(): Promise<void>;
export function getFormattedRecentHistory(limit?: number): Promise<string>; 