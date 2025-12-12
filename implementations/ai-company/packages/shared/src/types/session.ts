export interface Session {
  id: string;
  workingDir: string;
  slackChannelId?: string;
  slackThreadTs?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface SessionMetadata {
  sessionId: string;
  workingDir: string;
  slackChannelId?: string;
  slackThreadTs?: string;
  createdAt: string;
}

export interface CreateSessionRequest {
  workingDir?: string;
  slackChannelId?: string;
  slackThreadTs?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  workingDir: string;
  createdAt: string;
}
