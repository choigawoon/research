export type MessageType = 'text' | 'tool_use' | 'tool_result' | 'error';

export interface ClaudeMessage {
  type: MessageType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface QueryRequest {
  sessionId: string;
  prompt: string;
  stream?: boolean;
}

export interface QueryResponse {
  messages: ClaudeMessage[];
}

export interface ToolUseMetadata {
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolResultMetadata {
  tool: string;
  output: string;
  success: boolean;
}
