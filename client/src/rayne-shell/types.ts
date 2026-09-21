export type ChatRole = 'user' | 'milla' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  who?: string;
  imageUrl?: string;
}

export interface AgentStub {
  id: string;
  name: string;
  status: 'live' | 'idle' | 'pending' | 'offline';
  detail?: string;
}

export type ModelTier = 'local' | 'cloud';

export interface ModelChoice {
  id: string;
  label: string;
  tier: ModelTier;
}
